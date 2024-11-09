// src/context/UserContext.jsx
import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser  = () => {
    return useContext(UserContext);
}

export const UserProvider = ({ children }) => {
    const [user, setUser ] = useState(null);
    const [authError, setAuthError] = useState(null);

    const login = (email, password) => {
        // Mock user authentication logic
        if (password.length < 6) {
            setAuthError("Password must be at least 6 characters");
            return false;
        }

        // Mock user data
        const mockUser Data = {
            email,
            name: email.split('@')[0], // Use the part before '@' as the name
            avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
        };

        setUser (mockUser Data);
        setAuthError(null);
        return true;
    };

    const logout = () => {
        setUser (null);
        setAuthError(null);
    };

    return (
        <User Context.Provider value={{ user, login, logout, authError }}>
            {children}
        </User Context.Provider>
    );
};