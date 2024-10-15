import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// Initialize Firebase only once
const firebaseConfig = {
  apiKey: "AIzaSyBbZTwN_rHm3xF-pkt7_NLuj13R660hGyo",
  authDomain: "messenger-71c2f.firebaseapp.com",
  projectId: "messenger-71c2f",
  storageBucket: "messenger-71c2f.appspot.com",
  messagingSenderId: "526135825340",
  appId: "1:526135825340:web:b7aa5defea3c4e735391b9"
};

// Initialize Firebase app
const app = firebase.initializeApp(firebaseConfig);

// Export the auth module
export const auth = app.auth();

export default firebase;
