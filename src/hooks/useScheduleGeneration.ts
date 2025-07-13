
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

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

  const generateSchedule = useCallback(
    async ({ preferences, onSuccess, onError }: ScheduleGenerationParams) => {
      setIsLoading(true);
      try {
        const apiUrl = import.meta.env['VITE_API_URL'] || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/schedule/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // This is needed to include cookies with the request
          body: JSON.stringify({ preferences }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate schedule');
        }

        const schedule = await response.json();
        console.log('Schedule Result:', schedule);

        // The API returns the schedule directly as an array
        if (!Array.isArray(schedule)) {
          throw new Error('Invalid schedule format received from API');
        }

        // Format the schedule to ensure it matches our expected format
        const formattedSchedule = schedule.map((event: any) => ({
          ...event,
          day: event.day ?? 0,
          hour: event.hour ?? 9,
          duration: event.duration ?? 1,
          title: event.title || 'Untitled Event',
          type: event.type || 'work',
          id: event.id || crypto.randomUUID(),
        }));
        
        console.log('Formatted Schedule:', formattedSchedule);
        
        toast({
          title: "Schedule generated successfully!",
          description: "Your personalized schedule has been created.",
        });
        
        onSuccess?.(formattedSchedule);
      } catch (error: any) {
        console.error('Error generating schedule:', error);
        toast({
          title: "Error generating schedule",
          description: error.message || "Failed to generate schedule. Please try again.",
          variant: "destructive",
        })
        onError?.(error);
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
