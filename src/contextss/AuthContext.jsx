import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../components/firebase';
import firebase from 'firebase/compat/app';  // Ensure firebase is imported

const AuthContext = React.createContext();

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
                setLoading(false);
                navigate('/chats');  // Navigate if user is logged in
            } else {
                setLoading(false);
            }
        });
    
        // Handle the result from a redirect login
        firebase.auth().getRedirectResult().then((result) => {
            if (result.user) {
                setUser(result.user);  // Set the user from the redirect result
                navigate('/chats');    // Navigate to /chats after successful login
            }
        }).catch((error) => {
            console.error("Error during login: ", error);  // Log errors if any
            alert("Login failed! Please try again.");      // Inform the user
        });
    
        return () => unsubscribe();
    }, [navigate]);

    const value = { user };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
