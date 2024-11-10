// src/context/UserContext.jsx
import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser = () => {
    return useContext(UserContext);
}

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authError, setAuthError] = useState(null);

    const login = (email, password) => {
        if (password.length < 6) {
            setAuthError("Password must be at least 6 characters");
            return false;
        }
        setUser({ 
            email, 
            name: email.split('@')[0],
            avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' 
        });
        setAuthError(null);
        return true;
    };

    const logout = () => {
        setUser(null);
        setAuthError(null);
    };

    return (
        <UserContext.Provider value={{ user, login, logout, authError }}>
            {children}
        </UserContext.Provider>
    );
};