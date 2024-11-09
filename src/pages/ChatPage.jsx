// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import PubNub from 'pubnub';

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [activeChat, setActiveChat] = useState('global');
    const [showAllUsers, setShowAllUsers] = useState(false);
    const messagesEndRef = useRef(null);
    const { user, setUser } = useUser();
    const navigate = useNavigate();
    const pubnubRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        pubnubRef.current = new PubNub({
            publishKey: 'pub-c-ffe1f819-f3a1-4a89-a787-3d0ece760468',
            subscribeKey: 'sub-c-3da15639-dfb5-4f48-b345-a08fe215a9c8',
            userId: user.email
        });

        const channels = ['global', user.email];
        pubnubRef.current.subscribe({ channels });

        pubnubRef.current.addListener({
            message: handleMessage,
            presence: handlePresence
        });

        pubnubRef.current.hereNow(
            { channels: ['global'] },
            (status, response) => {
                if (response) {
                    const users = response.channels.global.occupants.map(occupant => occupant.uuid);
                    setOnlineUsers(users.filter(u => u !== user.email));
                }
            }
        );

        // Fetch all users (this is a mock function, replace with your actual user fetching logic)
        fetchAllUsers();

        return () => {
            if (pubnubRef.current) {
                pubnubRef.current.unsubscribe({ channels });
                pubnubRef.current.removeListener({
                    message: handleMessage,
                    presence: handlePresence
                });
            }
        };
    }, [user, navigate]);

    const fetchAllUsers = () => {
        // This is a mock function. Replace this with your actual logic to fetch all users.
        // For example, you might make an API call to your backend to get all registered users.
        const mockUsers = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
        setAllUsers(mockUsers.filter(u => u !== user.email));
    };

    const handleMessage = (event) => {
        const message = event.message;
        setMessages(prevMessages => [...prevMessages, message]);
        scrollToBottom();
    };

    const handlePresence = (event) => {
        if (event.action === 'join') {
            setOnlineUsers(prevUsers => [...new Set([...prevUsers, event.uuid])]);
        } else if (event.action === 'leave' || event.action === 'timeout') {
            setOnlineUsers(prevUsers => prevUsers.filter(user => user !== event.uuid));
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = () => {
        if (inputMessage.trim() === '') return;

        const messageObject = {
            text: inputMessage,
            sender: user.email,
            timestamp: new Date().toISOString()
        };

        pubnubRef.current.publish({
            channel: activeChat,
            message: messageObject
        }, (status, response) => {
            if (status.error) {
                console.error("Error sending message:", status);
            } else {
                setInputMessage('');
            }
        });
    };

    const startPersonalChat = (recipientEmail) => {
        const personalChannel = [user.email, recipientEmail].sort().join('_');
        setActiveChat(personalChannel);
        pubnubRef.current.subscribe({ channels: [personalChannel] });
        setMessages([]);
    };

    const handleLogout = () => {
        setUser(null);
        navigate('/');
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                <h1 className="text-2xl font-bold">Chat App</h1>
                <div>
                    <span className="mr-4">{user?.email}</span>
                    <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded">Logout</button>
                </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
                    <h2 className="font-bold mb-2">Chats</h2>
                    <button 
                        onClick={() => setShowAllUsers(!showAllUsers)}
                        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded w-full"
                    >
                        {showAllUsers ? "Show Online Users" : "Show All Users"}
                    </button>
                    <ul>
                        <li className="mb-2">
                            <button 
                                onClick={() => {
                                    setActiveChat('global');
                                    setMessages([]);
                                }}
                                className={`text-blue-500 hover:underline ${activeChat === 'global' ? 'font-bold' : ''}`}
                            >
                                Global Chat
                            </button>
                        </li>
                        {(showAllUsers ? allUsers : onlineUsers).map((userEmail) => (
                            <li key={userEmail} className="mb-2">
                                <button 
                                    onClick={() => startPersonalChat(userEmail)}
                                    className={`text-blue-500 hover:underline ${activeChat.includes(userEmail) ? 'font-bold' : ''}`}
                                >
                                    {userEmail} {!showAllUsers && "(Online)"}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="p-2 bg-gray-200 font-bold">
                        {activeChat === 'global' ? 'Global Chat' : `Chat with ${activeChat.replace(user.email, '').replace('_', '')}`}
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.map((message, index) => (
                            <div key={index} className={`mb-2 ${message.sender === user.email ? 'text-right' : 'text-left'}`}>
                                <span className={`inline-block p-2 rounded ${message.sender === user.email ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                    <strong>{message.sender}: </strong>
                                    {message.text}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t">
                        <input 
                            type="text" 
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className ="w-full px-3 py-2 border rounded"
                            placeholder="Type a message..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}