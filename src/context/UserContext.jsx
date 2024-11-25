// src/context/UserContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { auth } from '../components/firebase'; // Import your Firebase configuration
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [authError, setAuthError] = useState(null);

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setAuthError(null);
            return true;
        } catch (error) {
            setAuthError(error.message);
            return false;
        }
    };

    const register = async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setAuthError(null);
            return true;
        } catch (error) {
            setAuthError(error.message);
            return false;
        }
    };

    return (
        <UserContext.Provider value={{ login, register, authError }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser  = () => useContext(UserContext);