import { useState } from 'react';
import { syncWithGoogleCalendar } from '@/api/google-calendar';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar';

export const useGoogleCalendar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already authenticated
  const checkAuth = (): boolean => {
    const token = localStorage.getItem('google_access_token');
    const expiry = localStorage.getItem('google_token_expiry');
    
    if (token && expiry) {
      const isExpired = new Date().getTime() > parseInt(expiry, 10);
      if (!isExpired) {
        setIsAuthenticated(true);
        return true;
      }
      // Token expired, clear it
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_token_expiry');
    }
    
    setIsAuthenticated(false);
    return false;
  };

  // Initialize Google OAuth2 client
  const initClient = (onSuccess: (token: string) => void) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // @ts-ignore - Google types
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (response.credential) {
            const { credential } = response;
            onSuccess(credential);
          }
        },
      });
    };
    document.body.appendChild(script);
  };

  // Handle Google OAuth2 login
  const handleAuthClick = (): Promise<string> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      const onTokenReceived = (token: string) => {
        try {
          // Store the token and expiry (1 hour from now)
          const expiryTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour
          localStorage.setItem('google_access_token', token);
          localStorage.setItem('google_token_expiry', expiryTime.toString());
          setIsAuthenticated(true);
          setIsLoading(false);
          resolve(token);
        } catch (err) {
          console.error('Error storing token:', err);
          setError('Failed to store authentication token');
          setIsLoading(false);
          reject(err);
        }
      };

      initClient(onTokenReceived);

      // @ts-ignore - Google types
      google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            onTokenReceived(tokenResponse.access_token);
          } else {
            setError('Failed to get access token');
            setIsLoading(false);
            reject(new Error('Failed to get access token'));
          }
        },
        error_callback: (error: any) => {
          console.error('Google OAuth error:', error);
          setError('Authentication failed. Please try again.');
          setIsLoading(false);
          reject(error);
        },
      }).requestAccessToken();
    });
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    setIsAuthenticated(false);
  };

  // Sync schedule with Google Calendar
  const syncSchedule = async (schedule: any[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('google_access_token');
      if (!token) {
        throw new Error('Not authenticated with Google');
      }

      const result = await syncWithGoogleCalendar(schedule, token);
      setIsLoading(false);
      return result;
    } catch (err) {
      console.error('Error syncing with Google Calendar:', err);
      setError(err.message || 'Failed to sync with Google Calendar');
      setIsLoading(false);
      throw err;
    }
  };

  return {
    isAuthenticated: checkAuth(),
    isLoading,
    error,
    login: handleAuthClick,
    logout: handleLogout,
    syncSchedule,
  };
};
