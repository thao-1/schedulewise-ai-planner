
import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface ScheduleGenerationParams {
  apiKey: string;
  prompt: string;
  email: string;
  timezone: string;
  onSuccess?: (schedule: any) => void;
  onError?: (error: any) => void;
}

const useScheduleGeneration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSchedule = useCallback(
    async ({ apiKey, prompt, email, timezone, onSuccess, onError }: ScheduleGenerationParams) => {
      setIsLoading(true);
      try {
        // Change to call the Supabase Edge Function directly
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          },
          body: JSON.stringify({
            preferences: JSON.parse(prompt)
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          toast({
            title: "Error generating schedule",
            description: errorData.error || "Please check your preferences and try again.",
            variant: "destructive",
          })
          onError?.(errorData);
          throw new Error(`Failed to generate schedule: ${response.status}`);
        }

        const result = await response.json();
        console.log('Schedule Result:', result);

        if (result && result.schedule) {
          // The schedule is already parsed JSON from the Edge Function
          console.log('Parsed Schedule:', result.schedule);

          localStorage.setItem('generatedSchedule', JSON.stringify(result.schedule));

          onSuccess?.(result.schedule);
        } else {
          console.error('Invalid schedule format received from API');
          toast({
            title: "Error generating schedule",
            description: "Invalid schedule format received from the server.",
            variant: "destructive",
          })
          onError?.('Invalid schedule format received from API');
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
