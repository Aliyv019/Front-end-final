// src/components/firebase.jsx
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // Import getStorage

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
const storage = getStorage(app); // Initialize Firebase Storage

export { db, auth, storage }; // Export storage