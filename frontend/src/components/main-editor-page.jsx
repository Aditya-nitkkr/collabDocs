import { EditorContent } from "@tiptap/react";
import { useSocket } from "../context/SocketContext";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
import { ShareSettingModal } from "./Share-modal";
import { RequestAccess } from "./RequestAccess";
import { PendingList } from "./PendingRequestList";
import {
    Users, History, Share2, ShieldCheck, PenTool,
    Clock, RotateCcw, Loader2, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import toast from 'react-hot-toast';
import { ToolbarButton } from "./Toolbar";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const MainPage = ({ user, activeUsers, versions, editor, setVersions }) => {

    const socket = useSocket();
    const { id: roomId } = useParams();

    const [roomTitle, setTitle] = useState("");
    const { isOwner, setIsOwner } = useAuth();
    const [sharemodal, setShareModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {

        // Check if the current user is the owner of room or not for displaying the version
        const checkOwner = async () => {
            const res = await axios.get(`${backendUrl}/api/admin/check/${roomId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            const { isowner, title } = res.data;
            setTitle(title);
            if (isowner) {
                setIsOwner(true);
            }
            else {
                setIsOwner(false);
            }

        }
        if (roomId) checkOwner();
    }, [roomId]);

    //Function to fetching all the histories of the Document (Only Admin)
    const fetchHistoryList = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/admin/history/${roomId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = res.data;
            setVersions(data)
        }
        catch (err) {
            console.error("Fetch history failed:", err);
        }
    };

    // Function to give the Access for Overwrite the past history of the document into the current document
    const handleRevert = (id) => {
        if (window.confirm("Restore this version? This will wipe current changes for everyone.")) {
            socket.emit("revert-to-snapshot", { roomId, snapId: id });
        }
    };

    //Function to Handle the sharing of the document
    const handleShare = () => {
        if (isOwner)
            setShareModal(true);
        else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link Copied", {
                duration: 4000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });

        }
    }

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
        
            {/*  Sub-Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <div className="flex items-center">
                                <Link
                                    to="/editor/home"
                                    className="flex items-center gap-2 group transition-all"
                                >
                                    <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:rotate-3 transition-transform">
                                        <PenTool className="w-5 h-5 text-white" />
                                    </div>
                                </Link>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 truncate max-w-[200px] md:max-w-md">
                                {roomTitle || "Untitled Document"}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">v1.2.0</span>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> {user.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2 mr-3">
                            {activeUsers.slice(0, 4).map((u) => (
                                <div key={u.clientId} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-slate-200" title={u.name}>
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            {isOwner && (
                                <button onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'}`}>
                                    <History className="w-4 h-4" />
                                </button>
                            )}
                            <button onClick={handleShare} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95">
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="bg-white border-b border-slate-200 px-4 py-1.5 z-20 overflow-x-auto scrollbar-hide">
                <div className="max-w-7xl mx-auto w-full flex items-center gap-1">

                    {/* Basic Formatting */}
                    <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-2">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            active={editor?.isActive('bold')}
                            title="Bold (Ctrl+B)"
                        >
                            <span className="font-bold text-sm">B</span>
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            active={editor?.isActive('italic')}
                            title="Italic (Ctrl+I)"
                        >
                            <span className="italic text-sm serif">I</span>
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            active={editor?.isActive('strike')}
                            title="Strikethrough"
                        >
                            <span className="line-through text-sm">S</span>
                        </ToolbarButton>
                    </div>

                    {/* Headings */}
                    <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-2">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            active={editor?.isActive('heading', { level: 1 })}
                            title="Heading 1"
                        >
                            <span className="font-bold text-xs">H1</span>
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            active={editor?.isActive('heading', { level: 2 })}
                            title="Heading 2"
                        >
                            <span className="font-bold text-xs">H2</span>
                        </ToolbarButton>
                    </div>

                    {/* Lists */}
                    <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-2">
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            active={editor?.isActive('bulletList')}
                            title="Bullet List"
                        >
                            <div className="flex flex-col gap-1">
                                <div className="w-3 h-0.5 bg-current rounded-full"></div>
                                <div className="w-3 h-0.5 bg-current rounded-full"></div>
                            </div>
                        </ToolbarButton>
                    </div>

                    {/* Page Tools  */}
                    <button
                        onClick={() => editor?.chain().focus().setPageBreak().run()}
                        className="p-1.5 hover:bg-slate-100 rounded-md transition-all flex items-center gap-2 text-slate-600 border border-transparent hover:border-slate-200"
                        title="Insert Page Break (Mod+Enter)"
                    >
                        <div className="flex flex-col gap-0.5 items-center justify-center border-t-2 border-b-2 border-slate-400 w-4 h-3">
                            <div className="w-full border-t border-dashed border-slate-400 opacity-60"></div>
                        </div>
                        <span className="text-xs font-bold hidden md:inline">Page Break</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden relative">

                {/* LEFT SIDEBAR */}
                <aside
                    className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out relative z-10 ${isSidebarOpen ? 'w-64' : 'w-5'}`}
                >
                    {/* Toggle Arrow Button */}
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="absolute cursor-pointer  -right-3 top-10 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:text-indigo-600 transition-all z-20"
                    >
                        {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    {/* Content inside Sidebar */}
                    <div className={`${!isSidebarOpen && 'hidden'} w-64 flex flex-col h-full`}>
                        <div className="p-4 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
                            <Users className="w-4 h-4 text-slate-400" />
                            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Pending Access</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            <PendingList />
                        </div>
                    </div>
                </aside>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-hide bg-slate-100/30">
                    <RequestAccess roomId={roomId} user={user} roomTitle={roomTitle} />

                    <div className="max-w-[850px] mx-auto bg-white min-h-[1100px] shadow-sm border border-slate-200 rounded-sm p-12 md:p-20 mt-4">
                        <div className="prose prose-slate max-w-none">
                            {editor ? (
                                <EditorContent editor={editor} />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-200" />
                                    <p className="font-medium">Syncing document...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: For History  */}
                {isOwner && showHistory && (
                    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" /> History
                            </h4>
                            <button onClick={fetchHistoryList} className="p-1.5 hover:bg-white rounded-md border border-slate-200 text-slate-500 shadow-sm">
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {versions.length > 0 ? versions.map((v) => (
                                <div key={v.snapId || v._id} className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{new Date(v.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <button onClick={() => handleRevert(v.snapId || v._id)} className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded opacity-0 group-hover:opacity-100 hover:border-indigo-500">Restore</button>
                                    </div>
                                </div>
                            )) : <p className="text-center text-xs text-slate-400 mt-10">No history saved.</p>}
                        </div>
                    </aside>
                )}
            </main>
            
            {/* SHARING  MODAL */}
            {sharemodal && isOwner && (
                <ShareSettingModal roomId={roomId} setShareModal={setShareModal} />
            )}
        </div>
    );
}