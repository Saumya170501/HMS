import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDJGNUFZBC7AUn8qhk-F6-b0CkEwaQE1p4",
    authDomain: "global-markets-bd748.firebaseapp.com",
    projectId: "global-markets-bd748",
    storageBucket: "global-markets-bd748.firebasestorage.app",
    messagingSenderId: "339392801144",
    appId: "1:339392801144:web:2f52cf054ee9450346008d",
    measurementId: "G-1KVB7V9GYQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
