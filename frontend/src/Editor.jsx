import React, { useEffect, useState } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { useSocket } from "./context/SocketContext.jsx";
import { WebrtcProvider } from 'y-webrtc';
import { MainPage } from './components/main-editor-page';
import { useAuth } from './context/AuthContext.jsx';
import { useParams } from 'react-router-dom';
import "./App.css";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PageBreak } from './components/PageBreak.js';
import { useRef } from 'react';
import { useCallback } from 'react';


const backendUrl = import.meta.env.VITE_BACKEND_URL;

const CollaborativeEditor = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const { id: roomId } = useParams();
  const { setRequestStatus } = useAuth();
  const navigate = useNavigate();

  const [activeUsers, setActiveUsers] = useState([]);
  const [versions, setVersions] = useState([]);
  const [isSynced, setIsSynced] = useState(false);
  const { userPermission, setUserPermission } = useAuth();

  // Doc and Provider state
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);

  const joinedRef = useRef(null);
  const joinRoom = useCallback(async () => {
    if (!roomId || !user?.token || joinedRef.current === roomId) return;

    try {
      const res = await axios.get(`${backendUrl}/api/docs/fetch-room/${roomId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (res.status === 200) {
        setUserPermission(res.data.userPermission);
        setRequestStatus(res.data.currStatus);
        socket.emit("join-room", roomId);
        joinedRef.current = roomId;
      }
    } catch (err) {
      console.error("Authorization failed:", err.response?.data || err.message);
    }
  }, [roomId, user?.token, socket, setUserPermission, setRequestStatus]);

  useEffect(() => {
    //  If user isn't logged in, send them away
    if (user === null) {
      navigate("/login");
      return;
    }
    // If we don't have a token or roomId yet, wait.
    if (!user?.token || !roomId || !socket) return;

    // Handler for decisions (Allow/Deny)
    const handleDecision = ({ targetUserId, decision }) => {
      if (targetUserId === user._id) {
        if (decision === 'allow') {
          joinRoom();
          setRequestStatus('accept');
        } else {
          setRequestStatus('denied');
        }
      }
    };

    //  Set up the listener
    socket.on("refresh-permissions", joinRoom);
    socket.on("decision-sent", handleDecision);

    //  Initial Trigger
    joinRoom();

    // cleanup 
    return () => {
      socket.off("refresh-permissions", joinRoom);
      socket.off("owner-decision", handleDecision)
    };

  }, [roomId, user, socket, navigate, joinRoom]);


  //Setting the new provider
  useEffect(() => {
    if (!roomId || !user) return;

    const newDoc = new Y.Doc();
    const newProvider = new WebrtcProvider(roomId, newDoc, {
      signaling: ['ws://localhost:4444'],
      dataChannel: { ordered: false },
    });

    setYdoc(newDoc);
    setProvider(newProvider);

    if (user) {
      newProvider.awareness.setLocalStateField('user', {
        name: user.name,
        color: "#212121",
      });
    }

    return () => {
      newProvider.destroy();
      newDoc.destroy();
      setProvider(null);
      setYdoc(null);
      setIsSynced(false);
    }
  }, [roomId, user?.id]);

  // EDITOR: Only initialize if ydoc exists
  const editor = useEditor({
    extensions: [
      PageBreak,
      StarterKit.configure({ history: false }),
      ...(ydoc ? [
        Collaboration.configure({
          document: ydoc,
          field: 'default',
        })
      ] : []),
      ...(provider ? [
        CollaborationCursor.configure({
          provider: provider,
          user: { name: user?.name || "Anonymous", color: "#" + Math.floor(Math.random() * 16777215).toString(16) },
        })
      ] : [])
    ],
    editable: userPermission == 'edit'
  }, [ydoc, provider, userPermission]);

  //  SOCKETS: Guarding every listener

  useEffect(() => {
    // Intial check to prevent the illegal joining
    if (!socket || !roomId || !ydoc) return;

    // Function to get the Intial State of document when the User joins
    const handleInitState = (currState) => {
      if (!ydoc) return;
      Y.applyUpdate(ydoc, new Uint8Array(currState), 'server');
      setIsSynced(true);
    };

    // Function to capture the Update that are done by other users
    const handleRemoteUpdate = (update) => {
      if (!ydoc) return;
      Y.applyUpdate(ydoc, new Uint8Array(update), 'server');
    };

    // Function for Local update in the Browser State
    const handleLocalUpdate = (update, origin) => {
      if (origin !== 'server' && isSynced) {
        socket.emit('update-doc', { roomId, update });
      }
    };

    // Function to forcefully OverWrite the selected version by the owner
    const handleForceSync = (updatedVersion) => {
      if (!ydoc) return;
      const newState = new Uint8Array(updatedVersion);

      ydoc.transact(() => {
        const fragment = ydoc.getXmlFragment('default');
        if (fragment) Y.applyUpdate(ydoc, newState);
      }, 'revert-origin');

      if (editor) {
        editor.commands.setContent(ydoc.getXmlFragment('default').toJSON(), false);
      }
    };


    // sending the listeners 
    ydoc.on('update', handleLocalUpdate);
    socket.on('update-doc', handleRemoteUpdate);
    socket.on("init-state", handleInitState);
    socket.on("force-sync", handleForceSync);


    // Removing the Listener after call
    return () => {
      ydoc.off("update", handleLocalUpdate);
      socket.off('update-doc', handleRemoteUpdate);
      socket.off("init-state", handleInitState);
      socket.off("force-sync", handleForceSync);
    };
  }, [socket, roomId, ydoc, isSynced]);

  /* AWARENESS / USER LIST HANDLER */

  useEffect(() => {
    //  If the provider hasn't been created yet, we can't listen to it
    if (!provider || !user) return;

    //Function to Capture the awareness of the document
    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates();
      const users = [];

      states.forEach((state, clientId) => {
        // Only add users who have the 'user' field set in their local state
        if (state.user) {
          users.push({
            clientId,
            name: state.user.name,
            color: state.user.color || "#ccc",
          });
        }
      });

      setActiveUsers(users);
    };

    //  Listen for changes (joins, leaves, cursor moves)
    provider.awareness.on("change", handleAwarenessChange);

    // Fire it once manually to catch people already in the room
    handleAwarenessChange();

    return () => {
      provider.awareness.off("change", handleAwarenessChange);
    };
  }, [provider]);



  // Handle if Document is not Created yet
  if (!ydoc || !provider) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <p className="ml-3 font-medium">Connecting to room...</p>
      </div>
    );
  }


  return (
    <MainPage
      user={user}
      activeUsers={activeUsers}
      versions={versions}
      editor={editor}
      setVersions={setVersions}
    />
  );
};

export default CollaborativeEditor;