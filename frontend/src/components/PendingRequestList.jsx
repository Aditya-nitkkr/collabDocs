import { useEffect } from "react";
import { useState } from "react";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { UserPlus, Check, X, Bell, FileEdit } from 'lucide-react';
import { useParams } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const PendingList = () => {
    const socket = useSocket();
    const { user, isOwner } = useAuth();
    const { id: roomId } = useParams();

    const [pendingRequests, setPendingRequests] = useState([]);

    useEffect(() => {
        //Function to fetch all the pending requested from the db to the owner dashboard
        const fetchExistingRequests = async () => {
            try {
                const res = await axios.get(`${backendUrl}/api/docs/pending-requests/${roomId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });

                const formatted = res.data.map(req => ({
                    senderId: req.requestorId?._id,
                    senderName: req.requestorId?.name,
                    roomId: req.roomId?._id || req.roomId,
                    roomTitle: req.roomId?.title
                }));

                 setPendingRequests(formatted);

            } catch (err) {
                console.error("Failed to fetch persistent requests", err);
            }
        };

        if (roomId && user.token) {
            fetchExistingRequests();
        }
    }, [roomId, user.token]);

    useEffect(() => {
        if (!socket) return;

        const handleRequest = (data) => {
            if (!isOwner) return;

            setPendingRequests(prev => {
                const exists = prev.some(req => req.senderId === data.senderId);
                return exists ? prev : [...prev, data];
            });

        };

        socket.on("receive-edit-request", handleRequest);

        return () => {
            socket.off("receive-edit-request", handleRequest);
        };
    }, [socket, user?._id]);


    //Function to handle the decision given by the owner to the pending requests
    const handleDecision = async (targetUserId, roomId, decision) => {
        try {
            const res = await axios.post(`${backendUrl}/api/docs/handle-request`, {
                roomId,
                targetUserId,
                decision // 'allow' or 'deny'
            }, { headers: { Authorization: `Bearer ${user.token}` } });

            if (res.status == 200) {
                socket.emit("owner-decision", { roomId, targetUserId, decision });
                setPendingRequests(prev => prev.filter(r => r.senderId !== targetUserId));

            }
        } catch (err) {
            console.error("Decision failed", err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center gap-2 mb-4 px-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Access Requests ({pendingRequests.length})
                </h3>
            </div>

            <div className="space-y-3">
                {pendingRequests.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                        <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <UserPlus className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">No pending requests at the moment.</p>
                    </div>
                ) : (
                    pendingRequests.map((userRequest) => (
                        <div
                            key={userRequest.senderId}
                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow animate-in slide-in-from-right duration-300"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                        {userRequest.senderName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 leading-snug">
                                            <span className="font-bold text-slate-900">{userRequest.senderName}</span>
                                            {" "}requested to edit
                                        </p>
                                        <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1 mt-0.5">
                                            <FileEdit className="w-3 h-3" />
                                            {userRequest.roomTitle || "this document"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={() => handleDecision(userRequest.senderId, userRequest.roomId, 'allow')}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all active:scale-95 shadow-sm shadow-emerald-100"
                                    >
                                        <Check className="w-4 h-4" />
                                        Allow
                                    </button>

                                    <button
                                        onClick={() => handleDecision(userRequest.senderId, userRequest.roomId, 'deny')}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-xs font-bold py-2.5 px-5 rounded-xl transition-all active:scale-95"
                                    >
                                        <X className="w-4 h-4" />
                                        Deny
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}