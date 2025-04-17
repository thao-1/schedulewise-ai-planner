
import React, { useState } from 'react';
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

  const handleGoogleIntegration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/schedule`
        }
      });

      if (error) {
        console.error('Google integration error:', error);
        
        if (error.message.includes('not enabled') || error.status === 400) {
          setError('Google authentication is not enabled in your Supabase project. Please contact the administrator.');
          toast.error('Google authentication is not enabled', {
            description: 'This feature requires additional configuration'
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
              Note: Google integration requires additional configuration in Supabase.
              You can still use ScheduleWise without Google Calendar integration.
            </p>
          </div>
        </div>
      )}
      
      <div className="flex gap-4">
        <Button 
          onClick={handleGoogleIntegration} 
          disabled={isLoading}
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
