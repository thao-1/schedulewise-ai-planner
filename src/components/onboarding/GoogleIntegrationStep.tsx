
import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleIntegrationStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const GoogleIntegrationStep = ({ onComplete, onSkip }: GoogleIntegrationStepProps) => {
  const handleGoogleIntegration = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/schedule`
        }
      });

      if (error) {
        toast.error('Failed to connect with Google', {
          description: error.message
        });
      } else {
        toast.success('Successfully connected with Google Calendar');
        onComplete();
      }
    } catch (error) {
      toast.error('Failed to connect with Google', {
        description: (error as Error).message
      });
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
      
      <div className="flex gap-4">
        <Button onClick={handleGoogleIntegration}>
          Connect Google Calendar
        </Button>
        <Button variant="outline" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
};

export default GoogleIntegrationStep;
