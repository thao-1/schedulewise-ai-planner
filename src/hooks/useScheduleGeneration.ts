
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Preferences } from '@/types/OnboardingTypes';

export const useScheduleGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSyncingToGoogle, setIsSyncingToGoogle] = useState(false);

  const generateSchedule = async (preferences: Preferences) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      toast.info('Generating your personalized schedule...', {
        description: 'This may take up to 30 seconds',
        duration: 5000
      });
      
      console.log('Sending preferences to generate schedule:', preferences);
      
      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: { preferences }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate schedule');
      }
      
      if (!data || !data.schedule) {
        console.error('Invalid response from generate-schedule:', data);
        throw new Error('Invalid response from schedule generator');
      }
      
      console.log('Schedule generated successfully:', data.schedule);
      
      // Store the generated schedule in localStorage
      localStorage.setItem('generatedSchedule', JSON.stringify(data.schedule));
      
      return data.schedule;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Schedule generation error:', errorMessage);
      
      setGenerationError(errorMessage);
      toast.error('Failed to generate schedule', {
        description: errorMessage
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const syncScheduleToGoogle = async () => {
    setIsSyncingToGoogle(true);
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to sync with Google Calendar');
      }
      
      // Get the schedule from localStorage
      const savedSchedule = localStorage.getItem('generatedSchedule');
      if (!savedSchedule) {
        throw new Error('No schedule found to sync');
      }
      
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { schedule: JSON.parse(savedSchedule) }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to sync with Google Calendar');
      }
      
      toast.success('Schedule successfully synced with Google Calendar!', {
        description: `${data?.eventsAdded || 0} events added to your calendar`
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Google Calendar sync error:', errorMessage);
      
      toast.error('Failed to sync with Google Calendar', {
        description: errorMessage
      });
      return false;
    } finally {
      setIsSyncingToGoogle(false);
    }
  };

  return {
    generateSchedule,
    isGenerating,
    generationError,
    syncScheduleToGoogle,
    isSyncingToGoogle
  };
};
