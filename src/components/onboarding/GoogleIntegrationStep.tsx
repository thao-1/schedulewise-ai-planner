
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, Calendar, Check } from 'lucide-react';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';

interface GoogleIntegrationStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const GoogleIntegrationStep = ({ onComplete, onSkip }: GoogleIntegrationStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProviderEnabled, setIsProviderEnabled] = useState(true);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [syncingSchedule, setSyncingSchedule] = useState(false);

  // Add the hook
  const { syncScheduleToGoogle, isSyncingToGoogle } = useScheduleGeneration();

  // Check if running in an iframe
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      // If we can't access window.top due to security restrictions,
      // we're probably in an iframe
      setIsInIframe(true);
    }
  }, []);

  // Check if Google provider is enabled when component mounts
  useEffect(() => {
    const checkGoogleProvider = async () => {
      try {
        // Check if the user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check if the provider is google
          const provider = session.user?.app_metadata?.provider;
          if (provider === 'google') {
            setIsConnected(true);
          }
        }

        // Attempt a small operation to see if Google provider is enabled
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/onboarding`,
            skipBrowserRedirect: true // Just check, don't actually redirect
          }
        });

        // If we get a specific error about provider not enabled
        if (error && (error.message.includes('not enabled') || error.status === 400)) {
          setIsProviderEnabled(false);
          setError('Google authentication is not enabled in your Supabase project. Please check your configuration.');
        }
      } catch (err) {
        console.error('Error checking Google provider:', err);
      }
    };

    // Check if we have a Google token from auth callback
    const checkAuthCallback = async () => {
      // Check URL for auth callback parameters
      const params = new URLSearchParams(window.location.hash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check for access_token in hash or successful auth in query params
      if (params.has('access_token') || urlParams.get('provider') === 'google') {
        setIsConnected(true);
        toast.success('Successfully connected with Google!');
        
        // Auto-trigger sync after successful connection
        setTimeout(() => {
          handleSyncSchedule();
        }, 1000);
      }
    };

    checkGoogleProvider();
    checkAuthCallback();
  }, []);

  const handleGoogleIntegration = async () => {
    try {
      // If we're in an iframe, we need to alert the user
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
      
      // Request calendar scope explicitly
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/onboarding`, // Redirect back to onboarding
        }
      });

      if (error) {
        console.error('Google integration error:', error);
        
        if (error.message.includes('not enabled') || error.message.includes('validation_failed') || error.status === 400) {
          setError('Google authentication provider is not enabled or properly configured in your Supabase project. Please check your Google client configuration in the Supabase dashboard.');
          toast.error('Google authentication is not enabled', {
            description: 'This feature requires additional configuration in Supabase'
          });
        } else {
          setError(error.message);
          toast.error('Failed to connect with Google', {
            description: error.message
          });
        }
      } else {
        toast.success('Successfully initiated Google Calendar connection');
        // We don't call onComplete here as we'll be redirected to Google
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to connect with Google', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSchedule = async () => {
    const success = await syncScheduleToGoogle();
    if (success) {
      // Wait a moment before completing to let the user see the success message
      setTimeout(() => {
        onComplete();
      }, 2000);
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
            <p className="text-red-600 text-sm mt-2">
              Note: Google integration requires proper configuration in Supabase.
              You can still use ScheduleWise without Google Calendar integration.
            </p>
            {!isProviderEnabled && (
              <div className="mt-3 p-3 bg-red-100 rounded-md">
                <p className="text-red-800 text-sm font-medium">Administrator Action Required:</p>
                <p className="text-red-700 text-sm">
                  Enable Google provider in Supabase Authentication settings and ensure the 
                  Google client ID and secret are correctly configured.
                </p>
                <p className="text-red-700 text-sm mt-2">
                  Make sure <strong>X-Frame-Options</strong> is set to <strong>DENY</strong> in your Supabase project settings
                  to prevent iframe embedding issues.
                </p>
              </div>
            )}
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
              disabled={syncingSchedule}
            >
              {syncingSchedule ? (
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
            disabled={isLoading || !isProviderEnabled || isInIframe}
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
