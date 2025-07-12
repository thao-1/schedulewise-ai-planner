
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, Calendar, Check } from 'lucide-react';
import useScheduleGeneration from '@/hooks/useScheduleGeneration';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface GoogleIntegrationStepProps {
  onComplete: () => void;
  onSkip: () => void;
  onScheduleGenerated: (data: any) => void;
}

const GoogleIntegrationStep: React.FC<GoogleIntegrationStepProps> = ({ onComplete, onSkip, onScheduleGenerated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { syncScheduleToGoogleCalendar, isLoading: isSyncingToGoogle } = useScheduleGeneration();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
      console.log("Iframe detection: ", window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
      console.log("Access to parent window restricted, assuming iframe");
    }
  }, []);

  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        console.log("Checking Google authentication status");

        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session:", session ? "Found" : "None");

        if (session) {
          const provider = session.user?.app_metadata?.provider;
          console.log("Auth provider:", provider);

          if (provider === 'google') {
            setIsConnected(true);
            console.log("Google connection detected");

            // Store the provider token if available
            if (session.provider_token) {
              console.log("Provider token found in session");
              localStorage.setItem('googleAccessToken', session.provider_token);
            }
          }
        }

        const hash = window.location.hash;
        const search = window.location.search;

        console.log("URL hash:", hash);
        console.log("URL search params:", search);

        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          if (params.has('access_token')) {
            const accessToken = params.get('access_token');
            console.log("Access token found in URL hash");
            localStorage.setItem('googleAccessToken', accessToken || '');
            setIsConnected(true);
            toast.success('Successfully connected with Google!');

            setTimeout(() => {
              handleSyncSchedule();
            }, 1000);
          }
        }

        const urlParams = new URLSearchParams(search);
        if (urlParams.get('provider') === 'google') {
          console.log("Google provider detected in URL params");
          setIsConnected(true);
          toast.success('Successfully connected with Google!');

          setTimeout(() => {
            handleSyncSchedule();
          }, 1000);
        }
      } catch (err) {
        console.error('Error checking Google authentication:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    checkGoogleAuth();
  }, []);

  const handleGoogleIntegration = async () => {
    try {
      if (isInIframe) {
        setError('Google authentication cannot run in an iframe. Please open this page directly in a new tab.');
        toast.error('Cannot authenticate in iframe', {
          description: 'Please open this page in a new browser tab to connect with Google.'
        });
        return;
      }

      setIsLoading(true);
      setError(null);

      console.log('Attempting Google integration with Supabase');
      console.log('Redirect URL set to:', `${window.location.origin}/onboarding`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/onboarding`,
        }
      });

      console.log('Sign in response:', data);

      if (error) {
        console.error('Google integration error:', error);
        setError(error.message);
        toast.error('Failed to connect with Google', {
          description: error.message
        });
      } else {
        toast.success('Connecting to Google Calendar...');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Google integration error caught:', errorMessage);
      setError(errorMessage);
      toast.error('Failed to connect with Google', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSchedule = async () => {
    console.log("Attempting to sync schedule to Google Calendar");
    const scheduleData = localStorage.getItem('generatedSchedule');
    if (!scheduleData) {
      toast.error('No schedule data available');
      return;
    }

    try {
      const parsedSchedule = JSON.parse(scheduleData);
      // Get user timezone or use default
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Get the Google access token from localStorage
      const accessToken = localStorage.getItem('googleAccessToken');

      if (!accessToken) {
        console.error("No Google access token found in localStorage");

        // Try to get it from the session as a fallback
        const { data: { session } } = await supabase.auth.getSession();
        const sessionToken = session?.provider_token;

        if (!sessionToken) {
          toast.error('Authentication required', {
            description: 'Please connect with Google Calendar first'
          });
          return;
        }

        // Store it for future use
        localStorage.setItem('googleAccessToken', sessionToken);
        console.log("Retrieved and stored access token from session");
      }

      const success = await syncScheduleToGoogleCalendar(
        parsedSchedule,
        accessToken || localStorage.getItem('googleAccessToken') || '',
        timezone
      );

      if (success) {
        console.log("Sync successful, completing step");
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (err) {
      console.error('Error syncing schedule:', err);
      toast.error('Failed to sync schedule');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Integrate ScheduleWise with Google</h3>
        <p className="text-muted-foreground">
          Connect your Google Calendar to automatically sync your schedule
        </p>
      </div>

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

      {isConnected ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
          <Check className="h-5 w-5 text-green-500 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">Successfully connected with Google!</p>
            <p className="text-green-600 text-sm">
              You can now sync your ScheduleWise calendar with Google Calendar.
            </p>

            <Button
              className="mt-3"
              onClick={handleSyncSchedule}
              disabled={isSyncingToGoogle}
            >
              {isSyncingToGoogle ? (
                <>Syncing your schedule...</>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Sync Schedule to Google Calendar
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4">
          <Button
            onClick={handleGoogleIntegration}
            disabled={isLoading || isInIframe}
          >
            {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
      )}
    </div>
  );
};

export default GoogleIntegrationStep;
