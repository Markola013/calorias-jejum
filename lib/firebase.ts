import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Environment variables configuration for Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if the API key is present before initializing Firebase
const isConfigValid = typeof window !== 'undefined' || !!firebaseConfig.apiKey;

// Safe initialization of Firebase for Next.js App Router (handles hot-reloading and build time missing env variables)
const app = isConfigValid 
  ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
  : null;

const auth = app ? getAuth(app) : null as any;
const db = app ? getFirestore(app) : null as any;

export { app, auth, db };
