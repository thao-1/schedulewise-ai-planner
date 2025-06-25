import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, Calendar, Check, Loader2 } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScheduleEvent } from '@/api/generate-schedule';

interface GoogleIntegrationStepProps {
  onComplete: () => void;
  onSkip: () => void;
  scheduleData: ScheduleEvent[];
}

const GoogleIntegrationStep: React.FC<GoogleIntegrationStepProps> = ({
  onComplete,
  onSkip,
  scheduleData
}) => {
  const [isInIframe, setIsInIframe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    login,
    logout,
    syncSchedule
  } = useGoogleCalendar();
  
  // Check if we're in an iframe
  useEffect(() => {
    try {
      const inIframe = window.self !== window.top;
      setIsInIframe(inIframe);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);
  
  // Handle auth errors
  useEffect(() => {
    if (authError) {
      setError(authError);
      toast.error(authError);
    }
  }, [authError]);
  
  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      if (isInIframe) {
        setError('Google authentication cannot run in an iframe. Please open this page directly in a new tab.');
        toast.error('Cannot authenticate in iframe', {
          description: 'Please open this page in a new browser tab to connect with Google.'
        });
        return;
      }
      
      await login();
      toast.success('Successfully connected with Google!');
    } catch (error) {
      console.error('Google login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };
  
  // Handle Google logout
  const handleGoogleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully disconnected from Google');
    } catch (error) {
      console.error('Google logout failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out from Google';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };
  
  // Handle schedule sync with Google Calendar
  const handleSyncSchedule = useCallback(async () => {
    if (!scheduleData) return;
    
    try {
      setIsSyncing(true);
      setError(null);
      
      if (!scheduleData || !Array.isArray(scheduleData)) {
        throw new Error('No valid schedule data available to sync');
      }
      
      // Sync the schedule with Google Calendar
      const result = await syncSchedule(scheduleData);
      
      if (result.success) {
        toast.success(`Successfully synced ${result.eventsAdded || 0} events to Google Calendar`);
        onComplete();
      } else {
        throw new Error(result.message || 'Failed to sync with Google Calendar');
      }
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync with Google Calendar';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  }, [scheduleData, onComplete, syncSchedule]);
  
  const handleSkip = () => {
    onSkip();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Connect Google Calendar</CardTitle>
        <CardDescription>
          Sync your schedule with Google Calendar to keep all your events in one place.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isInIframe && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="text-orange-800 font-medium">Cannot authenticate in iframe</p>
              <p className="text-orange-600 text-sm">
                Google authentication will not work in an iframe for security reasons.
                Please open this page directly in a new browser tab.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(window.location.href, '_blank')}
              >
                Open in new tab
              </Button>
            </div>
          </div>
        )}

        {error && !isInIframe && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Google Integration Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {isAuthenticated ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
            <Check className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">Connected to Google Calendar</p>
              <p className="text-green-600 text-sm">
                Your schedule will be synced with your Google Calendar.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Calendar className="h-12 w-12 text-gray-400" />
            <p className="text-gray-600 text-center">
              Connect your Google account to sync your schedule with Google Calendar
            </p>
            <Button
              onClick={handleGoogleLogin}
              disabled={isAuthLoading || isInIframe}
              className="gap-2"
            >
              {isAuthLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect with Google'
              )}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleSkip}>
          Skip for now
        </Button>
        <Button 
          onClick={handleSyncSchedule} 
          disabled={!isAuthenticated || isSyncing}
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            'Sync with Google Calendar'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GoogleIntegrationStep;
