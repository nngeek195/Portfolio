import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from './firebase-app';

// Client-side Auth + Firestore, used by the admin dashboard.
// Public pages read their data on the server through lib/content.ts instead.
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
