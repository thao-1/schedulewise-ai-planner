
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface GoogleIntegrationStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const GoogleIntegrationStep = ({ onComplete, onSkip }: GoogleIntegrationStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProviderEnabled, setIsProviderEnabled] = useState(true);

  // Check if Google provider is enabled when component mounts
  useEffect(() => {
    const checkGoogleProvider = async () => {
      try {
        // Attempt a small operation to see if Google provider is enabled
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/schedule`,
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

    checkGoogleProvider();
  }, []);

  const handleGoogleIntegration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting Google integration with Supabase configured client');
      
      // Use the standard Supabase OAuth flow without specifying the client_id
      // Let Supabase handle the OAuth flow with its configured credentials
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/schedule`
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
        toast.success('Successfully connected with Google Calendar');
        onComplete();
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Integrate ScheduleWise with Google</h3>
        <p className="text-muted-foreground">
          Connect your Google Calendar to automatically sync your schedule
        </p>
      </div>
      
      {error && (
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
                  Google client ID and secret are correctly configured with the following values:
                </p>
                <ul className="text-red-700 text-sm mt-1 ml-4 list-disc">
                  <li>Client ID: 136254816370-75sqblkuldi99avsa50jhb230g16qqrq.apps.googleusercontent.com</li>
                  <li>Client Secret: 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</li>
                  <li>Redirect URL: {window.location.origin}/schedule</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex gap-4">
        <Button 
          onClick={handleGoogleIntegration} 
          disabled={isLoading || !isProviderEnabled}
        >
          {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
        </Button>
        <Button variant="outline" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
};

export default GoogleIntegrationStep;
