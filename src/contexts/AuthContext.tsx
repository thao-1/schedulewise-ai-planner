
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/status', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.isAuthenticated && data.user) {
            setUser({
              id: data.user.id,
              email: data.user.emails?.[0]?.value || '',
              name: data.user.displayName || 'User',
              picture: data.user.photos?.[0]?.value,
            });
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Basic validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // In a real app, you would make an API call to your backend
      // For now, we'll simulate a successful login after a delay
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (password.length < 6) {
            return reject(new Error('Password must be at least 6 characters'));
          }
          
          setUser({
            id: 'user-' + Math.random().toString(36).substr(2, 9),
            email,
            name: email.split('@')[0],
          });
          resolve();
        }, 1000);
      });
    } catch (error) {
      console.error('Error signing in:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = () => {
    // This will redirect to the Google OAuth flow
    window.location.href = '/api/auth/google';
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      // Call the server to destroy the session
      const response = await fetch('/api/auth/logout', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        setUser(null);
        // Force a full page reload to clear any client-side state
        window.location.href = '/';
      } else {
        throw new Error('Failed to sign out');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.isAuthenticated === true;
      }
      return false;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  };

  const isAuthenticated = !!user;

  // Create the context value object
  const contextValue = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signInWithGoogle,
    signOut,
    checkAuth,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
