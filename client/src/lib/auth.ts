import { useState, useEffect } from "react";
import { onAuthStateChange, signInWithGoogle as firebaseSignInWithGoogle, signOutUser } from "./firebase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        const authUser: AuthUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          avatarUrl: firebaseUser.photoURL || '',
        };
        setUser(authUser);
        
        // Register or update user in backend
        try {
          await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: authUser.id,
              email: authUser.email,
              name: authUser.name,
              avatarUrl: authUser.avatarUrl,
            }),
          });
        } catch (error) {
          console.error('Error registering user:', error);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await firebaseSignInWithGoogle();
      // User state will be updated by onAuthStateChange
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await signOutUser();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
  };
}
