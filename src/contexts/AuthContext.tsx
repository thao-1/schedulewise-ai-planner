// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface User {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (token: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const token = localStorage.getItem('token');
    
    const initializeAuth = async () => {
      try {
        if (token) {
          const user = await authService.getCurrentUser(token);
          setUser(user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const { user, token } = await authService.signup({ email, password, displayName });
      
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Update user state
      const userData = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user, token } = await authService.login({ email, password });
      
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Update user state
      const userData = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      };
      
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // Remove token from localStorage
      localStorage.removeItem('token');
      // Clear user state
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Don't block UI while checking auth state
  // The app will render with isAuthenticated=false initially
  // and update once the auth state is known
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}