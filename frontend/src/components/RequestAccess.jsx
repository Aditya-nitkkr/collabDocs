import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../context/SocketContext";
import { Lock, Clock, Send, AlertCircle } from 'lucide-react';
import { CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const RequestAccess = ({ roomId, user, roomTitle }) => {
    const { requestStatus, isOwner } = useAuth();
    const [requestSend, setSend] = useState(false);
    const socket = useSocket();

    const prevStatusRef = useRef(requestStatus);
    useEffect(() => {
        //  Only trigger if the status has CHANGED from something else to 'accept'/'deny'
        if (prevStatusRef.current !== requestStatus) {

            if (requestStatus === "accept" && !isOwner) {
                setSend(false);
                toast.success("The owner has approved your request!", {
                    id: "access-granted", // Prevents duplicate toasts
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
               
            }
            else if (requestStatus === "denied" && !isOwner) {
                setSend(false);
                toast.error("Your request was declined by the owner.", {
                    id: "access-denied"
                });
               
            }

            prevStatusRef.current = requestStatus;
        }
    }, [requestStatus, isOwner]);


    //Function to handle the request for the edit mode
    const handleRequest = async () => {
        try {
            const res = await axios.post(`${backendUrl}/api/user/requests/access`, {
                roomId
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSend(true);
            socket.emit("request-edit-access", { roomId, userId: user._id, userName: user.name, roomTitle });

        } catch (err) {
            console.error("Failed to save request:", err);
            toast.error(err.response?.data?.message || "Error sending request");
        }

    }


    return (
        <div className="max-w-7xl mx-auto px-4 pt-4">
            {requestStatus === 'pending' && requestSend === false && isOwner === false && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm animate-in slide-in-from-top duration-500">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Read-Only Mode</h4>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    You don't have permission to edit this document. Request access to start collaborating.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleRequest}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-amber-200 transition-all transform active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                            Request Edit Access
                        </button>
                    </div>
                </div>
            )}

            {requestSend === true && isOwner === false && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 shadow-sm animate-in zoom-in duration-300">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 animate-pulse">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-indigo-900">Request Pending</h4>
                            <p className="text-xs text-indigo-700 mt-0.5">
                                Your request has been sent to the owner. You'll be notified once it's approved.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}