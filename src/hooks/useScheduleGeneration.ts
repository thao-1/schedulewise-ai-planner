import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';

export interface ScheduleEvent {
  day: number;
  hour: number;
  duration: number;
  title: string;
  type: string;
  description?: string;
  id?: string;
}

interface ScheduleGenerationParams {
  preferences: {
    workHours: string;
    deepWorkHours: string;
    personalActivities: string[];
    workoutTime?: string;
    meetingPreference?: string;
    meetingsPerDay?: number | string;
    autoReschedule?: boolean;
    customPreferences?: string;
  };
  onSuccess?: (schedule: ScheduleEvent[]) => void;
  onError?: (error: Error) => void;
}

interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  total: number;
}

const useScheduleGeneration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Authentication is now optional for schedule generation
  const { user } = useAuth();
  
  const generateSchedule = useCallback(
    async ({ preferences, onSuccess, onError }: ScheduleGenerationParams) => {
      setIsLoading(true);
      console.log('Starting schedule generation with preferences:', preferences);
      
      try {
        const apiUrl = import.meta.env['VITE_API_URL'] || 'http://localhost:3001';
        console.log(`Sending request to: ${apiUrl}/api/schedule/generate`);
        
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = new URL(`${apiUrl}/api/schedule/generate`);
        url.searchParams.append('_t', timestamp.toString());
        
        // Get the CSRF token from cookies if using CSRF protection
        const csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('XSRF-TOKEN='))
          ?.split('=')[1];
        
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
          },
          credentials: 'include', // This is crucial for sending cookies with cross-origin requests
          body: JSON.stringify({ 
            preferences,
            userId: user?.id || 'anonymous', // Make user ID optional
          }),
        });
        
        console.log('Request headers:', {
          credentials: 'include',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': '***' }), // Don't log the actual token
        }, 'User ID:', user?.id || 'anonymous');

        console.log('Received response status:', response.status);
        
        // Handle non-OK responses
        if (!response.ok) {
          let errorMessage = `Server responded with status ${response.status}`;
          try {
            const errorData = await response.json();
            console.error('Error response from server:', errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
          throw new Error(errorMessage);
        }

        // Parse the successful response
        let schedule;
        try {
          schedule = await response.json();
          console.log('Schedule response:', schedule);
        } catch (e) {
          console.error('Failed to parse schedule response:', e);
          throw new Error('Invalid response format from server');
        }

        // Validate the schedule format
        if (!Array.isArray(schedule)) {
          console.error('Expected array but got:', typeof schedule, schedule);
          throw new Error('Invalid schedule format: Expected an array of events');
        }

        // Format the schedule with defaults
        const formattedSchedule = schedule.map((event: any) => ({
          ...event,
          day: typeof event.day === 'number' ? event.day : 0,
          hour: typeof event.hour === 'number' ? event.hour : 9,
          duration: typeof event.duration === 'number' ? event.duration : 1,
          title: event.title?.toString() || 'Untitled Event',
          type: ['work', 'break', 'meeting', 'personal', 'other'].includes(event.type) 
            ? event.type 
            : 'other',
          id: event.id?.toString() || crypto.randomUUID(),
          description: event.description?.toString() || '',
        }));
        
        console.log('Successfully formatted schedule with', formattedSchedule.length, 'events');
        
        toast({
          title: "Schedule generated!",
          description: `Successfully created a schedule with ${formattedSchedule.length} events.`,
        });
        
        onSuccess?.(formattedSchedule);
        return formattedSchedule;
        
      } catch (error: any) {
        console.error('Error in generateSchedule:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate schedule';
        
        toast({
          title: "Schedule generation failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        onError?.(error instanceof Error ? error : new Error(errorMessage));
        throw error; // Re-throw to allow component to handle if needed
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const syncScheduleToGoogleCalendar = async (
    scheduleData: ScheduleEvent[], 
    accessToken: string, 
    timezone: string = 'UTC'
  ): Promise<SyncResult> => {
    if (!accessToken) {
      throw new Error('No access token provided for Google Calendar sync');
    }
    console.log("syncScheduleToGoogleCalendar called with:", {
      scheduleDataLength: scheduleData?.length || 0,
      accessTokenExists: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      timezone
    });

    if (!scheduleData || scheduleData.length === 0) {
      console.error("No schedule data available");
      toast({
        title: "No schedule data available",
        description: "Please generate a schedule first.",
        variant: "destructive"
      });
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        total: 0
      };
    }

    try {
      setIsLoading(true);
      console.log("Syncing schedule with Google Calendar");

      // First, get the primary calendar ID
      const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!calendarResponse.ok) {
        const error = await calendarResponse.json();
        throw new Error(error.error?.message || 'Failed to access Google Calendar');
      }

      // Process each event in the schedule
      const eventPromises = scheduleData.map(async (event) => {
        const eventStart = new Date();
        eventStart.setDate(eventStart.getDate() + (event.day || 0));
        eventStart.setHours(event.hour, 0, 0, 0);
        
        const eventEnd = new Date(eventStart);
        eventEnd.setHours(eventStart.getHours() + (event.duration || 1));

        const calendarEvent = {
          summary: event.title,
          description: event.description || '',
          start: {
            dateTime: eventStart.toISOString(),
            timeZone: timezone || 'UTC',
          },
          end: {
            dateTime: eventEnd.toISOString(),
            timeZone: timezone || 'UTC',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
            ],
          },
        };

        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calendarEvent),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to create event:', error);
          throw new Error(`Failed to create event: ${error.error?.message || 'Unknown error'}`);
        }

        return response.json();
      });

      // Execute all event creation promises in parallel
      const results = await Promise.allSettled(eventPromises);
      
      // Check for any failed events
      const failedEvents = results.filter(result => result.status === 'rejected');
      const successfulEvents = results.filter(result => result.status === 'fulfilled');

      if (failedEvents.length > 0) {
        console.error(`Failed to create ${failedEvents.length} events`);
        failedEvents.forEach((result: any) => {
          console.error('Event creation failed:', result.reason);
        });
        
        if (successfulEvents.length === 0) {
          // All events failed
          throw new Error('Failed to sync any events to Google Calendar');
        }
        
        // Some events succeeded, some failed
        toast({
          title: `Successfully synced ${successfulEvents.length} events`,
          description: `Failed to sync ${failedEvents.length} events. Check console for details.`,
          variant: 'default',
        });
      } else {
        // All events synced successfully
        toast({
          title: 'Success!',
          description: `Successfully synced ${successfulEvents.length} events to Google Calendar`,
          variant: 'default',
        });
      }

      return {
        success: true,
        syncedCount: successfulEvents.length,
        failedCount: failedEvents.length,
        total: results.length,
      };
    } catch (error: any) {
      console.error('Error syncing with Google Calendar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync with Google Calendar',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }

      // All sync operations complete
  };

  return {
    generateSchedule,
    isLoading,
    syncScheduleToGoogleCalendar,
  };
};

export default useScheduleGeneration;
