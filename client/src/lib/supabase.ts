// Note: We're using Drizzle directly instead of @supabase/supabase-js
// This file contains utility functions for authentication and API calls

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];

  constructor() {
    // Check for stored user session
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('auth_user');
      }
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  subscribe(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  private setUser(user: AuthUser | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
    this.notifyListeners();
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sign in failed');
      }

      const { user } = await response.json();
      this.setUser(user);
      return user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, name?: string): Promise<AuthUser> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sign up failed');
      }

      const { user } = await response.json();
      this.setUser(user);
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    this.setUser(null);
  }

  async signInWithGoogle(): Promise<AuthUser> {
    // For MVP, we'll implement a simple OAuth flow
    // In a real app, this would redirect to Google OAuth
    throw new Error('Google sign-in not implemented yet');
  }

  async signInWithApple(): Promise<AuthUser> {
    // For MVP, we'll implement a simple OAuth flow
    // In a real app, this would redirect to Apple OAuth
    throw new Error('Apple sign-in not implemented yet');
  }
}

export const authService = new AuthService();
