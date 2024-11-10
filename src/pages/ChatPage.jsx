// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser  } from '../context/UserContext';
import PubNub from 'pubnub';

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [activeChat, setActiveChat] = useState('global');
    const messagesEndRef = useRef(null);
    const { user, setUser  } = useUser ();
    const navigate = useNavigate();
    const pubnubRef = useRef(null);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        pubnubRef.current = new PubNub({
            publishKey: 'your-publish-key',
            subscribeKey: 'your-subscribe-key',
            userId: user.email,
        });

        const channels = ['global', user.email];
        pubnubRef.current.subscribe({ channels });

        pubnubRef.current.addListener({
            message: handleMessage,
            presence: handlePresence,
        });

        fetchAllUsers();

        return () => {
            pubnubRef.current.unsubscribe({ channels });
            pubnubRef.current.removeListener({
                message: handleMessage,
                presence: handlePresence,
            });
        };
    }, [user, navigate]);

    const fetchAllUsers = () => {
        const mockUsers = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
        setAllUsers(mockUsers.filter(u => u !== user.email));
    };

    const handleMessage = (event) => {
        const message = event.message;
        setMessages(prevMessages => {
            const updatedMessages = [...prevMessages, message];
            localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
            return updatedMessages;
        });
        scrollToBottom();
    };
    
    // Load messages from local storage when the component mounts
    useEffect(() => {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
        }
    }, []);

    const handlePresence = (event) => {
        // Handle presence events if necessary
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = () => {
        if (inputMessage.trim() === '') return;
    
        const messageObject = {
            text: inputMessage,
            sender: user.email,
            timestamp: new Date().toISOString()
        };
    
        console.log("Sending message:", messageObject); // Debugging line
    
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
        setMessages([]);
        pubnubRef.current.subscribe({ channels: [personalChannel] });
    };

    const handleLogout = () => {
        setUser (null);
        navigate('/');
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                <h1 className="text-2xl font-bold">Messenger</h1>
                <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded">Logout</button>
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
                    <h2 className="font-bold mb-2">Users</h2>
                    <ul>
                        {allUsers.map((userEmail) => (
                            <li key={userEmail} className="mb-2">
                                <button 
                                    onClick={() => startPersonalChat(userEmail)}
                                    className={`text-blue-500 hover:underline`}
                                >
                                    {userEmail}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex-1 bg-white p-4 flex flex-col">
                    <div className="text-lg font-bold mb-2">
                        Chatting with: {activeChat.split('_').find(email => email !== user.email)}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="mb-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`mb-2 ${msg.sender === user.email ? 'text-right' : 'text -left'}`}>
                                    <div className={`inline-block p-2 rounded ${msg.sender === user.email ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
                                        <strong>{msg.sender}:</strong> {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <div className="flex mt-4">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            className="flex-1 border rounded p-2"
                            placeholder="Type your message..."
                        />
                        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2 rounded ml-2">Send</button>
                    </div>
                </div>
            </div>
        </div>
    );
}