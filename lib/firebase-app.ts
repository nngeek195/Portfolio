import { initializeApp, getApps, getApp } from 'firebase/app';

// Shared Firebase app instance. Safe to import from both server and client code:
// it only initializes the app, not Auth (which is browser-oriented).
// Values come from .env.local.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize only once (prevents errors during hot-reloading in development).
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
