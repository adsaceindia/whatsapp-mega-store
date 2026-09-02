import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase config when available
// You'll get this from the Firebase console when you set up the client app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCbg--q7n28LVsuLlxa-CJnWkBJ5_IG5bI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "northern-webbing-j5jvd.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "northern-webbing-j5jvd",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "northern-webbing-j5jvd.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "497607656288",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:497607656288:web:0d9529631f7869133c1405"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-e6cf6377-02c6-4134-a524-4d5cae1e9116");
