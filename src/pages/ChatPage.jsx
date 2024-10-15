import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatEngine } from 'react-chat-engine';
import { useAuth } from '../contextss/AuthContext';
import { auth } from '../components/firebase';

export default function ChatPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        console.log(user);
        
    }, [user]);
    const handleLogout = async () => {
        await auth.signOut();
        navigate('/');
    };

    if (!user) return <div>Loading...</div>;  // Handle the case when user is not logged in yet

    return (
        <div>
            <div>
                <div>Messenger</div>
                <div className='cursor-pointer' onClick={handleLogout}>
                    Logout
                </div>
            </div>
            <ChatEngine
                height='100%'
                projectID='f8e765c8-44d1-4d1b-9718-2061c334ab8c'
                userName={user.email}
                userSecret={user.uid}
            />
        </div>
    );
}