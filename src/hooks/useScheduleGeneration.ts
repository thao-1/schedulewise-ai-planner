import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useScheduleGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSyncingToGoogle, setIsSyncingToGoogle] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    const checkGoogleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.provider === 'google') {
        setIsGoogleConnected(true);
      }
    };
    
    checkGoogleAuth();
  }, []);

  const generateSchedule = async (preferences: any) => {
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
    console.log('Starting Google Calendar sync process');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session found');
        throw new Error('You must be logged in to sync with Google Calendar');
      }
      
      if (session.user?.app_metadata?.provider !== 'google') {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            scopes: [
              'https://www.googleapis.com/auth/calendar.events', 
              'https://www.googleapis.com/auth/calendar',
              'https://www.googleapis.com/auth/userinfo.email',
              'https://www.googleapis.com/auth/userinfo.profile'
            ],
            redirectTo: `${window.location.origin}/schedule`
          }
        });
        return false;
      }
      
      console.log('User authenticated, session found', session);
      
      const savedSchedule = localStorage.getItem('generatedSchedule');
      if (!savedSchedule) {
        console.error('No schedule found in localStorage');
        throw new Error('No schedule found to sync');
      }
      
      console.log('Schedule found in localStorage, preparing to sync');
      
      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: { schedule: JSON.parse(savedSchedule) }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to sync with Google Calendar');
      }
      
      console.log('Google Calendar sync response:', data);
      
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

  const addEvent = async (eventData: any) => {
    try {
      console.log('Adding new event to schedule:', eventData);
      
      const savedSchedule = localStorage.getItem('generatedSchedule');
      const currentSchedule = savedSchedule ? JSON.parse(savedSchedule) : [];
      
      const updatedSchedule = [...currentSchedule, eventData];
      
      localStorage.setItem('generatedSchedule', JSON.stringify(updatedSchedule));
      
      console.log('Event added successfully, updated schedule:', updatedSchedule);
      toast.success('Event added successfully', {
        description: `${eventData.title} has been added to your schedule`
      });
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error adding event:', errorMessage);
      
      toast.error('Failed to add event', {
        description: errorMessage
      });
      return false;
    }
  };

  return {
    generateSchedule,
    isGenerating,
    generationError,
    syncScheduleToGoogle,
    isSyncingToGoogle,
    isGoogleConnected,
    addEvent
  };
};
