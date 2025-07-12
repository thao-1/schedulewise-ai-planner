import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function AuthTest() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [status, setStatus] = useState<string>('Checking auth...');

  useEffect(() => {
    if (isAuthenticated) {
      setStatus(`Authenticated as: ${user?.email || 'Unknown user'}`);
    } else {
      setStatus('Not authenticated');
    }
  }, [isAuthenticated, user]);

  const handleTestLogin = async () => {
    try {
      setStatus('Logging in...');
      // This is just for testing - in a real app, use the login form
      await login('test@example.com', 'password123');
    } catch (error) {
      setStatus(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLogout = async () => {
    try {
      setStatus('Logging out...');
      await logout();
      setStatus('Logged out successfully');
    } catch (error) {
      setStatus(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow">
      <h2 className="text-lg font-semibold mb-4">Auth Test Component</h2>
      <div className="mb-4">
        <p className="font-medium">Status: <span className={isAuthenticated ? 'text-green-600' : 'text-amber-600'}>{status}</span></p>
        {user && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <p>User ID: {user.id}</p>
            <p>Email: {user.email || 'No email'}</p>
            <p>Display Name: {user.displayName || 'Not set'}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {!isAuthenticated ? (
          <Button onClick={handleTestLogin} variant="outline">
            Test Login
          </Button>
        ) : (
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}
