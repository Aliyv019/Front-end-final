import React from 'react';
import { GoogleOutlined,FacebookOutlined } from '@ant-design/icons';
import { auth } from '../components/firebase';
import firebase from 'firebase/compat/app';
export default function Login() {
  const handleGoogleLogin = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithRedirect(provider);
};

  const handleFacebookLogin = () => {
    const provider = new firebase.auth.FacebookAuthProvider();  // Use firebase.auth properly
    auth.signInWithRedirect(provider);
  };

  return (
    <div className="flex flex-col items-center justify-center h-fit w-fit gap-4 p-11 px-24 rounded-lg bg-white">
      <h2 className="font-bold text-lg">Welcome to Messenger!</h2>
      <div onClick={handleGoogleLogin} className="bg-blue-600 text-white p-2 rounded-lg cursor-pointer flex items-center gap-2">
        <GoogleOutlined className="text-white" />
        Sign In with Google
      </div>
      <div onClick={handleFacebookLogin} className="bg-indigo-700 text-white p-2 rounded-lg cursor-pointer flex items-center gap-2">
        <FacebookOutlined className="text-white" />
        Sign In with Facebook
      </div>
    </div>
  );
}
