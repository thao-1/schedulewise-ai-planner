import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle, Calendar, Check, Loader2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { ScheduleEvent } from '@/api/generate-schedule';

interface ScheduleWithGoogleIntegrationProps {
  onComplete: () => void;
  onSkip: () => void;
  scheduleData: ScheduleEvent[];
}

const ScheduleWithGoogleIntegration: React.FC<ScheduleWithGoogleIntegrationProps> = ({
  onComplete,
  onSkip,
  scheduleData = []
}) => {
  const [isInIframe, setIsInIframe] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { 
    isAuthenticated, 
    login, 
    logout, 
    syncSchedule, 
    isLoading: isGoogleLoading,
    error: googleError
  } = useGoogleCalendar();

  // Check if we're in an iframe (Google OAuth doesn't work in iframes)
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        try {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          
          if (accessToken) {
            localStorage.setItem('google_access_token', accessToken);
            toast.success('Successfully connected with Google');
            // Clear the hash from the URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('Error handling OAuth callback:', error);
          setError('Failed to complete Google sign in. Please try again.');
          toast.error('Failed to complete Google sign in');
        }
      }
    };

    handleOAuthCallback();
  }, []);

  const handleConnectGoogle = async () => {
    try {
      setError(null);
      await login();
    } catch (error) {
      console.error('Error connecting to Google:', error);
      setError('Failed to connect with Google. Please try again.');
      toast.error('Failed to connect with Google');
    }
  };

  const handleSyncToGoogle = async () => {
    if (!scheduleData || scheduleData.length === 0) {
      setError('No schedule data available to sync');
      toast.error('No schedule data available to sync');
      return;
    }

    try {
      setIsSyncing(true);
      setError(null);
      
      await syncSchedule(scheduleData);
      toast.success('Schedule synced to Google Calendar!');
      onComplete();
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      setError('Failed to sync with Google Calendar. Please try again.');
      toast.error('Failed to sync with Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isInIframe) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Integration</CardTitle>
            <CardDescription>
              Google OAuth does not work in an iframe. Please open this page in a new tab.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.open(window.location.href, '_blank')}>
              Open in New Tab
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sync with Google Calendar</CardTitle>
          <CardDescription>
            Connect your Google account to sync your schedule with Google Calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between p-4 border rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Google Calendar</h3>
                <p className="text-sm text-gray-500">
                  {isAuthenticated ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span>Connected</span>
              </div>
            ) : (
              <Button
                onClick={handleConnectGoogle}
                disabled={isGoogleLoading}
                variant="outline"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : 'Connect'}
              </Button>
            )}
          </div>

          {isAuthenticated && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Sync Schedule</h3>
                <Button
                  onClick={handleSyncToGoogle}
                  disabled={isSyncing || scheduleData.length === 0}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Sync your generated schedule to your Google Calendar.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onSkip}>
            Skip for Now
          </Button>
          {isAuthenticated && (
            <Button onClick={onComplete}>
              Continue to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ScheduleWithGoogleIntegration;
