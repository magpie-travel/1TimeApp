import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim()}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim()}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google Auth Provider
const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

export const signInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const handleRedirectResult = async () => {
  // Not needed with popup flow, but keeping for compatibility
  return null;
};

export const signOutUser = () => {
  return signOut(auth);
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};