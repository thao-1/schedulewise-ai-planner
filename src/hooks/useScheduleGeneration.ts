
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Preferences } from '@/types/OnboardingTypes';

interface WindowWithGoogleData extends Window {
  workLifeBalanceData?: {
    work: number;
    personal: number;
    learning: number;
    rest: number;
  };
}

declare const window: WindowWithGoogleData;

export const useScheduleGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSyncingToGoogle, setIsSyncingToGoogle] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Check if the user is already authenticated with Google
  useEffect(() => {
    const checkGoogleAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.provider === 'google') {
        setIsGoogleConnected(true);
      }
    };
    
    checkGoogleAuth();
  }, []);

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
    console.log('Starting Google Calendar sync process');
    
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session found');
        throw new Error('You must be logged in to sync with Google Calendar');
      }
      
      console.log('User authenticated, session found', session);
      
      // Get the schedule from localStorage
      const savedSchedule = localStorage.getItem('generatedSchedule');
      if (!savedSchedule) {
        console.error('No schedule found in localStorage');
        throw new Error('No schedule found to sync');
      }
      
      console.log('Schedule found in localStorage, preparing to sync');
      
      // Check if we have the necessary Google authentication
      const provider = session.user?.app_metadata?.provider;
      const hasGoogleAuth = provider === 'google';
      
      if (!hasGoogleAuth) {
        console.log('User not authenticated with Google, initiating Google auth...');
        
        // Redirect to Google auth
        toast.info('Connecting to Google Calendar...', {
          description: 'You will be redirected to Google for authentication'
        });
        
        // Store current location to return after auth
        const currentPath = window.location.pathname;
        localStorage.setItem('returnPathAfterGoogleAuth', currentPath);
        
        // Use sign out and sign in to ensure we get a fresh token with calendar scopes
        await supabase.auth.signOut({ scope: 'local' });
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
            redirectTo: `${window.location.origin}${currentPath}`,
          }
        });
        
        if (error) {
          console.error('Google auth initiation error:', error);
          throw new Error(`Failed to start Google authentication: ${error.message}`);
        }
        
        // The page will redirect, so we return to prevent further code execution
        return false;
      }
      
      console.log('User has Google auth, proceeding with sync');
      
      // Make the function call to sync calendar
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
      
      // Get the current schedule from localStorage
      const savedSchedule = localStorage.getItem('generatedSchedule');
      const currentSchedule = savedSchedule ? JSON.parse(savedSchedule) : [];
      
      // Add the new event to the schedule
      const updatedSchedule = [...currentSchedule, eventData];
      
      // Save the updated schedule back to localStorage
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
