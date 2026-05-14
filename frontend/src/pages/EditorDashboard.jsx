import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Plus, FileText, Trash2, ExternalLink, Edit3, Shield, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const EditorDashboard = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const { user } = useAuth();
    const [editingRoomId, setEditingRoomId] = useState(null); // Tracks which room is in edit mode
    const [tempTitle, setTempTitle] = useState("");


    //Function to create the Document
    const handleMakeDoc = async () => {
        try {
            const res = await axios.post(`${backendUrl}/api/docs/create`, {}, {
                headers: {
                    Authorization: `Bearer ${user.token}` 
                }
            });

            const { roomId } = res.data;
            navigate(`/editor/${roomId}`);

        } catch (err) {
            console.error("Failed to create document:", err);
            navigate("/login");
        }
    };

    useEffect(() => {
        if (!user) {
            setRooms([]);
            return;
        }

        //Function to Load the Rooms when the user is at the editor dashboard page
        const fetchRooms = async () => {
            const res = await axios.get(`${backendUrl}/api/docs/my-rooms`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const { rooms } = res.data;
            setRooms(rooms);
        }

        if (user) fetchRooms();

    }, [user]);

    // Function to Delete the Document
    const handleDelete = async (roomId) => {
        try {
            const res = await axios.delete(`${backendUrl}/api/docs/delete-room/${roomId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setRooms((prev) => prev.filter((room) => room.roomId !== roomId));
            toast.success(res.data.message, {
                duration: 4000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });

        } catch (error) {
            // console.log("error in deleting ", error);
            toast.error("Error deleting room. Please try again.", {
                duration: 4000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        }
    }

    // Function to handle the Switch to Input 
    const startEditing = (room) => {
        setEditingRoomId(room.roomId);
        setTempTitle(room.title || "Untitled Document");
    };

    // Function to Save the changed title into the Backend 
    const saveTitle = async (roomId) => {
        if (!tempTitle.trim()) return setEditingRoomId(null);

        try {
            const res = await axios.patch(
                `${backendUrl}/api/docs/rename/${roomId}`,
                { title: tempTitle },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            console.log(res.data);
            setRooms(rooms.map(r => r.roomId === roomId ? { ...r, title: res.data.title } : r));
            setEditingRoomId(null); 


        } catch (err) {
            // console.error("Rename failed", err);
            toast.error("Could not save title", {
                duration: 4000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            })
        }
    };

    return (

        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <Header />
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Welcome back, <span className="text-indigo-600">{user?.name}</span>
                    </h2>
                    <p className="text-slate-500 mt-1">Manage your collaborative documents and workspaces.</p>
                </div>

                <button
                    className="flex items-center cursor-pointer justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-indigo-100 transition-all transform active:scale-95"
                    onClick={handleMakeDoc}
                >
                    <Plus className="w-5 h-5 " />
                    Create New Document
                </button>
            </div>

            {/* Rooms Grid */}
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {rooms && rooms.length > 0 ? (
                        rooms.map((room) => (
                            <div
                                key={room.roomId}
                                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {/*  Icon & Ownership Badge */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        {room.owner === user?._id ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100">
                                                <Shield className="w-3 h-3" /> Owner
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100">
                                                <Globe className="w-3 h-3" /> Public
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-h-[60px]">
                                        {editingRoomId === room.roomId ? (
                                            <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-indigo-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    value={tempTitle}
                                                    onChange={(e) => setTempTitle(e.target.value)}
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && saveTitle(room.roomId)}
                                                />
                                                <button onClick={() => saveTitle(room.roomId)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">✅</button>
                                                <button onClick={() => setEditingRoomId(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">❌</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between group/title">
                                                <h3 className="font-bold text-slate-800 text-lg leading-snug line-clamp-2">
                                                    {room.title || "Untitled Document"}
                                                </h3>
                                                <button
                                                    className="opacity-0 group-hover:opacity-100 group-hover/title:bg-slate-50 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                                                    onClick={() => startEditing(room)}
                                                    title="Rename"
                                                >
                                                    <Edit3 className="w-4 h-4 cursor-pointer" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-6">
                                    <button
                                        onClick={() => navigate(`/editor/${room.roomId}`)}
                                        className="flex-1 cursor-pointer flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                                    >
                                        Open <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(room.roomId)}
                                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete Document"
                                    >
                                        <Trash2 className="w-5 h-5 cursor-pointer" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl">
                            <div className="bg-slate-100 p-4 rounded-full mb-4">
                                <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 font-medium text-lg">No documents found.</p>
                            <button onClick={handleMakeDoc} className="text-indigo-600 font-bold hover:underline mt-1">Create your first one</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
};