// src/firebase/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ✅ Replace with the web config from your Firebase Console (same one used in your Expo app)
const firebaseConfig = {
    apiKey: "AIzaSyB6P0PUJaiOHyveFYGwIVl7w5LEDrIcEGA",
    authDomain: "juno-22168.firebaseapp.com",
    projectId: "juno-22168",
    storageBucket: "juno-22168.appspot.com",
    messagingSenderId: "150200968499",
    appId: "1:150200968499:web:25d86490ba772b5737ca46"
  };

const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
