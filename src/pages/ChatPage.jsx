// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import PubNub from 'pubnub';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [isTyping, setIsTyping] = useState({});
    const [activeChat, setActiveChat] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef({});
    const { user, logout } = useUser();
    const navigate = useNavigate();

    const pubnub = new PubNub({
        publishKey: 'pub-c-ffe1f819-f3a1-4a89-a787-3d0ece760468',
        subscribeKey: 'sub-c-3da15639-dfb5-4f48-b345-a08fe215a9c8',
        userId: user?.email
    });

    const getPersonalChannel = (user1, user2) => {
        const sortedEmails = [user1, user2].sort();
        return `personal_${sortedEmails[0]}_${sortedEmails[1]}`;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const channels = ['chat', user.email];
        if (activeChat) {
            channels.push(getPersonalChannel(user.email, activeChat));
        }

        pubnub.subscribe({
            channels: channels,
            withPresence: true
        });

        const listener = {
            message: (event) => {
                setMessages(prev => [...prev, event.message]);
                scrollToBottom();
            },
            presence: (event) => {
                if (event.action === 'join') {
                    setOnlineUsers(prev => new Set([...prev, event.uuid]));
                } else if (event.action === 'leave' || event.action === 'timeout') {
                    setOnlineUsers(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(event.uuid);
                        return newSet;
                    });
                }
            },
            signal: (event) => {
                if (event.message.action === 'typing') {
                    const typingUser = event.message.user;
                    setIsTyping(prev => ({ ...prev, [typingUser]: true }));

                    if (typingTimeoutRef.current[typingUser]) {
                        clearTimeout(typingTimeoutRef.current[typingUser]);
                    }
                    typingTimeoutRef.current[typingUser] = setTimeout(() => {
                        setIsTyping(prev => {
                            const newState = { ...prev };
                            delete newState[typingUser];
                            return newState;
                        });
                    }, 1500);
                }
            }
        };

        pubnub.addListener(listener);

        pubnub.hereNow(
            {
                channels: ['chat'],
                includeUUIDs: true,
            },
            (status, response) => {
                if (response) {
                    const users = new Set(response.channels.chat.occupants.map(occupant => occupant.uuid));
                    setOnlineUsers(users);
                }
            }
        );

        const loadMessages = () => {
            const channel = activeChat ? getPersonalChannel(user.email, activeChat) : 'chat';
            pubnub.history(
                { channel: channel, count: 50 },
                (status, response) => {
                    if (response && response.messages) {
                        setMessages(response.messages.map(m => m.entry));
                        scrollToBottom();
                    }
                }
            );
        };

        loadMessages();

        return () => {
            pubnub.removeListener(listener);
            pubnub.unsubscribe({ channels: channels });
            Object.values(typingTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
        };
    }, [user, navigate, pubnub, activeChat]);

    const handleSendMessage = (messageText) => {
        const channel = activeChat ? getPersonalChannel(user.email, activeChat) : 'chat';
        
        const messageData = {
            text: messageText,
            sender: user.email,
            senderName: user.name,
            timestamp: Date.now()
        };

        pubnub.publish({
            channel,
            message: messageData
        });
    };

    const handleTyping = () => {
        const channel = activeChat ? getPersonalChannel(user.email, activeChat) : 'chat';
        pubnub.signal({
            channel: channel,
            message: { action: 'typing', user: user.email }
        });
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const startPersonalChat = (recipientEmail) => {
        setActiveChat(recipientEmail);
        setMessages([]);  // Clear messages when switching chats
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Messenger</h1>
                <div className="flex items-center">
                    <span className="mr-4">{user.email}</span>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-1/4 bg-white border-r border-gray-200 p-4 overflow-y-auto">
                    <h2 className="text-xl font-semibold mb-4">Online Users</h2>
                    <ul>
                        {Array.from(onlineUsers).map((userEmail) => (
                            <li key={userEmail} className="py-2">
                                <button
                                    onClick={() => startPersonalChat(userEmail)}
                                    className="text-blue-600 hover:text-blue-700"
                                >
                                    {userEmail}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Chat area */}
                <div className="w-3/4 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold">
                            {activeChat ? `Chat with ${activeChat}` : 'Public Chat'}
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {messages.map((message, index) => (
                            <MessageBubble
                                key={index}
                                message={message.text}
                                isOwnMessage={message.sender === user.email}
                                senderName={message.senderName}
                                timestamp={message.timestamp}
                            />
                        ))}
                        {Object.keys(isTyping).map((userEmail, index) => (
                            <div key={index} className="text-gray-500 text-sm">
                                {userEmail} is typing...
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="border-t border-gray-200">
                        <ChatInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
                    </div>
                </div>
            </div>
        </div>
    );
}