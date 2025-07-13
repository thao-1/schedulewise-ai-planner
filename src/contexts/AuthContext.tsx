
import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Basic validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Mock authentication - replace with your actual authentication logic
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (password.length < 6) {
            setIsLoading(false);
            return reject(new Error('Password must be at least 6 characters'));
          }
          
          setUser({
            id: 'user-' + Math.random().toString(36).substr(2, 9),
            email,
            name: email.split('@')[0],
          });
          setIsLoading(false);
          resolve();
        }, 1000);
      });
    } catch (error) {
      console.error('Error signing in:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Mock sign out
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setUser(null);
          resolve();
        }, 500);
      });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    // Check if user is authenticated (e.g., by checking session cookie)
    // This is a simplified example - replace with actual auth check
    return !!user;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated,
      signIn, 
      signOut,
      checkAuth
    }}>
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
