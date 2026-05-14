import axios from "axios";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import {
    Globe, Lock, Copy, Check, X,
    Settings, Users, ChevronDown, Link as LinkIcon
} from 'lucide-react';
import toast from "react-hot-toast";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const ShareSettingModal = ({ roomId, setShareModal }) => {
    const [access, setAccess] = useState('private');
    const [perm, setPerm] = useState('view');
    const { user } = useAuth();
    const socket = useSocket();
    const [copied, setCopied] = useState(false);

    // Function to get the current access and the current permission of the room
    useEffect(() => {
        const getCurrentPermissionAndAccess = async () => {
            try {
                const res = await axios.get(`${backendUrl}/api/docs/check/permissions/${roomId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });

                if (res.data.accessControl) setAccess(res.data.accessControl);
                if (res.data.globalPermission) setPerm(res.data.globalPermission);
                console.log("res per ", res.data.accessControl);
                console.log("res glob ", res.data.globalPermission);

            } catch (error) {
                console.log("Failed to fetch the load settings ", error);
            }
        }

        if (user) getCurrentPermissionAndAccess();
    }, [roomId, user.token]);

    // Function to update the share setting ( Admin)
    const updateSharing = async () => {
        try {
            const res = await axios.patch(`${backendUrl}/api/admin/docs/share-settings/${roomId}`, {
                accessControl: access,
                globalPermission: perm,
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            if (res.status === 200) {
                socket.emit("settings-updated", roomId);
                toast.success("Permission updated successfully", {
                    duration: 4000,
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });
            }

        } catch (error) {
            console.log("Error in saving the permissions", error);
        }
    }
    // Function to Copy the url of the document
    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setShareModal(false)}
            />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">

                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Share Document</h3>
                    </div>
                    <button
                        onClick={() => setShareModal(false)}
                        className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">General Access</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {access === 'private' ? (
                                    <Lock className="w-4 h-4 text-amber-500" />
                                ) : (
                                    <Globe className="w-4 h-4 text-emerald-500" />
                                )}
                            </div>
                            <select
                                value={access}
                                onChange={(e) => setAccess(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-all cursor-pointer"
                            >
                                <option value="private">Restricted (Only invited)</option>
                                <option value="public">Anyone with the link</option>
                            </select>
                            <ChevronDown className="absolute inset-y-0 right-3 flex items-center pointer-events-none w-4 h-4 text-slate-400" />
                        </div>
                    </div>

                    {access === 'public' && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Public Link Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPerm('view')}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${perm === 'view' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                                >
                                    <span className="text-sm font-bold">Viewer</span>
                                    <span className="text-[10px] opacity-70 uppercase tracking-tight font-medium">Read Only</span>
                                </button>
                                <button
                                    onClick={() => setPerm('edit')}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${perm === 'edit' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                                >
                                    <span className="text-sm font-bold">Editor</span>
                                    <span className="text-[10px] opacity-70 uppercase tracking-tight font-medium">Full Access</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <LinkIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">Document Link</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={window.location.href}
                                className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-500 outline-none truncate"
                            />
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={() => setShareModal(false)}
                        className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            updateSharing();
                            setShareModal(false);
                        }}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}