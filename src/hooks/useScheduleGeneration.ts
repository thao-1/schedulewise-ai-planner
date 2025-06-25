
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { generateSchedule as generateScheduleAPI, type ScheduleEvent } from '@/api/generate-schedule';
import type { SchedulePreferences } from '@/types/schedule';

interface ScheduleGenerationParams {
  prompt: string | SchedulePreferences;
  onSuccess?: (schedule: ScheduleEvent[]) => void;
  onError?: (error: string) => void;
}

const useScheduleGeneration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSchedule = useCallback(
    async ({ prompt, onSuccess, onError }: ScheduleGenerationParams) => {
      console.log("🚀 generateSchedule function called!");
      console.log("🚀 Prompt:", prompt);

      setIsLoading(true);
      try {
        console.log("Generating schedule with OpenAI");
        
        // Parse the prompt if it's a string, otherwise use it directly
        let preferences: SchedulePreferences;
        try {
          preferences = typeof prompt === 'string' ? JSON.parse(prompt) : prompt;
        } catch (parseError) {
          console.error("Error parsing prompt:", parseError);
          throw new Error("Invalid preferences format");
        }

        console.log("Preferences being sent:", JSON.stringify(preferences, null, 2));

        // Call our local API function
        const result = await generateScheduleAPI(preferences);
        
        console.log("Generated schedule result:", result);
        
        if (result.success && result.data) {
          // Successfully generated schedule
          console.log('Generated schedule:', result.data);
          localStorage.setItem('generatedSchedule', JSON.stringify(result.data));
          onSuccess?.(result.data);
        } else {
          // Handle error case
          const errorMessage = result.error || 'Failed to generate schedule';
          console.error('Error generating schedule:', errorMessage);
          
          toast({
            title: "Error generating schedule",
            description: errorMessage,
            variant: "destructive",
          });
          
          onError?.(errorMessage);
        }
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

  const syncScheduleToGoogleCalendar = async (scheduleData: any[], accessToken: string, timezone: string) => {
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
      return false;
    }

    if (!accessToken) {
      console.error("No access token provided");
      toast({
        title: "Authentication required",
        description: "Please connect to Google Calendar first.",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsLoading(true);
      console.log("Syncing schedule with Google Calendar");

      // Import the syncWithGoogleCalendar function
      const { syncWithGoogleCalendar } = await import('@/api/google-calendar');

      // Call the sync function
      const result = await syncWithGoogleCalendar(scheduleData, accessToken);
      console.log("Google Calendar sync result:", result);

      toast({
        title: "Success",
        description: "Schedule has been synced to Google Calendar",
      });

      return true;
    } catch (error: any) {
      console.error('Error syncing to Google Calendar:', error);
      toast({
        title: "Error syncing to Google Calendar",
        description: error.message || "Failed to sync schedule to Google Calendar. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getGoogleCalendarTime = (dayOfWeek: number, hour: number, timezone: string) => {
    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
    const nextDate = new Date(now.setDate(now.getDate() + daysToAdd));

    const eventDate = new Date(nextDate);
    eventDate.setHours(Math.floor(hour));
    eventDate.setMinutes(Math.round((hour % 1) * 60));
    eventDate.setSeconds(0);

    return eventDate.toISOString();
  };

  return {
    generateSchedule,
    isLoading,
    syncScheduleToGoogleCalendar
  };
};

export default useScheduleGeneration;
