import { useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";
import { createContext } from "react";
import axios from "axios";

const AuthContext = createContext();
const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requestStatus, setRequestStatus] = useState("pending");
    const [isOwner, setIsOwner] = useState(false);
    const [userPermission, setUserPermission] = useState('view');

    //Function to check the Saved Info present or not in the browser
    const checkAuth = async () => {
        const savedUser = localStorage.getItem('userInfo');
        if (!savedUser) {
            setLoading(false);
            setUser(null);
            return;
        }

        try {
            const parsedUser = JSON.parse(savedUser);

            // checking the token is valid or not
            const res = await axios.get(`${backendUrl}/api/user/auth/verify`, {
                headers: { Authorization: `Bearer ${parsedUser.token}` }
            });

            if (res.status === 200) {
                setUser({ ...res.data, token: parsedUser.token });
            }

        } catch (error) {
            console.error("Session expired. Logging out...");
            localStorage.removeItem('userInfo');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    // check if the user is already login when the app starts
    useEffect(() => {
        checkAuth();
    }, []);

    // Function if the user signed in or not
    const signup = async (userData) => {
        try {
            const res = await axios.post(`${backendUrl}/api/user/auth/signup`, userData);

            const data = res.data;
            setUser(data);
            localStorage.setItem("userInfo", JSON.stringify(data));

            return { success: true, data };

        } catch (err) {
            console.log("Error in login:", err.response?.data?.message || err.message);

            return { success: false, message: err.response?.data?.message };
        }
    }


    // Function if the user logged in or not
    const login = async (formInfo) => {
        try {
            const res = await axios.post(`${backendUrl}/api/user/auth/login`, formInfo);

            const data = res.data;
            setUser(data);
            localStorage.setItem("userInfo", JSON.stringify(data));

            return { success: true, data };

        } catch (err) {
            console.log("Error in login:", err.response?.data?.message || err.message);

            return { success: false, message: err.response?.data?.message };
        }
    }

    // Function for the logging out from the app
    const logout = async () => {
        localStorage.removeItem("userInfo");
        setUser(null);
        
    }

    return (
        <AuthContext.Provider value={{ user, userPermission, setUserPermission, login, logout, loading, setUser, signup, isOwner, setIsOwner, requestStatus, setRequestStatus }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

