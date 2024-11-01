import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatEngine } from 'react-chat-engine';
import { useUser } from '../context/UserContext';
export default function ChatPage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const handleLogout = async () => {
        navigate('/');
    };

    if (!user) return <div>Loading...</div>;  // Handle the case when user is not logged in yet

    return (
        <div>
            <div  className=' bg-blue-600 justify-between flex px-4 py-2 font-sans text-2xl'>
                <div className='p-3 rounded text-white'>Messenger</div>
                <div className='cursor-pointer bg-purple-500 rounded p-2 text-white font-bold' onClick={handleLogout}>
                    Logout
                </div>
            </div>
            <ChatEngine
                height='calc(100vh - 95px)'
                width='100%'
                projectID='edaa1289-6c29-4343-965e-f6c066cf8de3'
                userName={user.email}
                userSecret={user.password}
            />
        </div>
    );
}