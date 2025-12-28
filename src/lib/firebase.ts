import { initializeApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { Auth, getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseDisabled = import.meta.env.VITE_DISABLE_FIREBASE === 'true';

let app;
let db: Firestore;
let auth: Auth;

// Always initialize Firebase to allow Authentication even if data sync is disabled
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (error) {
    console.warn("Firebase initialization failed:", error);
}

if (isFirebaseDisabled) {
    console.log("Firebase Data Sync is disabled via VITE_DISABLE_FIREBASE. Authentication is still active.");
}

export { db, auth };
