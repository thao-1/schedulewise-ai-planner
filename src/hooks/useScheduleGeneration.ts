
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface ScheduleEvent {
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

const useScheduleGeneration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSchedule = useCallback(
    async ({ preferences, onSuccess, onError }: ScheduleGenerationParams) => {
      setIsLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${apiUrl}/api/schedule/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferences }),
        });

        const result = await response.json();
        console.log('Schedule Result:', result);

        if (!response.ok) {
          throw new Error(result.error || 'Failed to generate schedule');
        }

        // The API returns the schedule directly as an array
        if (!Array.isArray(result)) {
          throw new Error('Invalid schedule format received from API');
        }

        // Format the schedule to ensure it matches our expected format
        const formattedSchedule = result.map((event: any) => ({
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
      console.log("Calling Supabase Edge Function for Google Calendar sync");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log("Supabase URL:", supabaseUrl);
      console.log("Supabase Anon Key exists:", !!supabaseAnonKey);
      console.log("Access token starts with:", accessToken.substring(0, 10) + "...");

      // Prepare the request body
      const requestBody = {
        schedule: scheduleData,
        timezone
      };

      console.log("Request body sample:", JSON.stringify(requestBody).substring(0, 200) + "...");

      // Call the Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey || '',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      // Try to parse the response as JSON
      let responseData;
      try {
        responseData = await response.json();
        console.log("Response data:", responseData);
      } catch (e) {
        const textResponse = await response.text();
        console.error("Failed to parse response as JSON:", textResponse);
        throw new Error(`Failed to parse response: ${textResponse.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(`Failed to sync calendar: ${response.status} - ${responseData.error || 'Unknown error'}`);
      }

      toast({
        title: "Schedule synced to Google Calendar",
        description: responseData.message || "Your schedule has been successfully synced to your Google Calendar."
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

  return {
    generateSchedule,
    isLoading,
    syncScheduleToGoogleCalendar
  };
};

export default useScheduleGeneration;
