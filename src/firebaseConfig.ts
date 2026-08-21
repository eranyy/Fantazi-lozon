import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAYU35Cc-mewf1WAHjHUAcmq1ATntoU9YI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fantasy-luzon.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fantasy-luzon",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fantasy-luzon.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "759769754748",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:759769754748:web:6e402c85c5bb4f9a3dadf9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D89L2G5PHL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);
export const functions = getFunctions(app, "us-west1");
