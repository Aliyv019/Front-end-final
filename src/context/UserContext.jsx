// src/context/UserContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { auth } from '../components/firebase'; // Import your Firebase configuration
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const UserContext = createContext();

export const useUser  = () => {
    return useContext(UserContext);
}

export const UserProvider = ({ children }) => {
    const [user, setUser ] = useState(null);
    const [authError, setAuthError] = useState(null);

    const login = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser (userCredential.user);
            setAuthError(null);
            return true; // Return true if login is successful
        } catch (error) {
            setAuthError(error.message);
            return false; // Return false if there is an error
        }
    };

    const register = async (email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            setUser (userCredential.user);
            setAuthError(null);
            return true; // Return true if registration is successful
        } catch (error) {
            setAuthError(error.message);
            return false; // Return false if there is an error
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser (null);
        setAuthError(null);
    };

    return (
        <UserContext.Provider value={{ user, setUser , login, register, logout, authError }}>
            {children}
        </UserContext.Provider>
    );
};