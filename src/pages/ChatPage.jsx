import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
export default function ChatPage() {
    const PubNub=require('pubnub');
    const pubnub= new PubNub({
        publishKey:'pub-c-ffe1f819-f3a1-4a89-a787-3d0ece760468',
        subscribeKey:'sub-c-3da15639-dfb5-4f48-b345-a08fe215a9c8',
        userId:'user-1'
    })
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
            
        </div>
    );
}