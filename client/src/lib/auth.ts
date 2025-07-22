import { useState, useEffect } from 'react';
import { auth, signInWithGoogle as firebaseSignIn, signOutUser, onAuthStateChange } from './firebase';

export { signInWithGoogle, signOutUser as signOut } from './firebase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out', firebaseUser);
      if (firebaseUser) {
        // Convert Firebase user to our user format
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified
        };
        console.log('Setting user data:', userData);
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    isLoading,
    signInWithGoogle: firebaseSignIn,
    signOut: signOutUser
  };
}