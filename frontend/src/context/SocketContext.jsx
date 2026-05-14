import { createContext, useContext, useMemo } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const SocketProvider = ({ children }) => {
    const socket = useMemo(() => io(`${backendUrl}`, {
        transports: ['websocket'],
        autoConnect: true
    }), []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}
export const useSocket = () => useContext(SocketContext);