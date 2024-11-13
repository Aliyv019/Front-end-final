// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbZTwN_rHm3xF-pkt7_NLuj13R660hGyo",
  authDomain: "messenger-71c2f.firebaseapp.com",
  projectId: "messenger-71c2f",
  storageBucket: "messenger-71c2f.firebasestorage.app",
  messagingSenderId: "526135825340",
  appId: "1:526135825340:web:b7aa5defea3c4e735391b9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export {db, auth};