import React, { useState } from 'react';
import { useNavigate} from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Login() {
  const [email,setEmail]=useState(null)
  const [password,setPassword]=useState(null)
  const { setUser,user } = useUser();

  // Google login handler using Firebase v10 syntax
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault()
    setEmail("")
    setPassword("")
    setUser({email,password})
    navigate('/chats')
    console.log(user);
    
  };  
  return (
    <div className="flex flex-col items-center justify-center h-fit w-fit gap-4 p-6 mx-4 max-sm:p-11 px-24 rounded-lg bg-white">
      <h2 className="font-bold text-lg">Welcome to Messenger!</h2>
      <form onSubmit={handleLogin}>
        <input type="text" onChange={(e)=>setEmail(e.target.value)} value={email} placeholder="Username" className="border-2 border-gray-300 rounded-lg p-2 w-full mb-4" />
        <input type="password" onChange={(e)=>setPassword(e.target.value)} value={password} placeholder="Password" className="border-2 border-gray-300 rounded-lg p-2 w-full mb-4" />
        <button type='submit' className=' bg-blue-400 p-4 rounded-xl text-white font-semibold'>Log In</button>
      </form>
    </div>
  );
}
