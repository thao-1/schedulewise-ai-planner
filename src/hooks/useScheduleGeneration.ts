
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
      console.log("🚀 generateSchedule function called!");
      console.log("🚀 Parameters:", { apiKey: !!apiKey, prompt, email, timezone });

      setIsLoading(true);
      try {
        console.log("Calling Supabase Edge Function for schedule generation");
        console.log("Prompt received:", prompt);

        // Parse the prompt if it's a string, otherwise use it directly
        let preferences;
        try {
          preferences = typeof prompt === 'string' ? JSON.parse(prompt) : prompt;
        } catch (parseError) {
          console.error("Error parsing prompt:", parseError);
          throw new Error("Invalid preferences format");
        }

        console.log("Preferences being sent:", JSON.stringify(preferences, null, 2));

        // Change to call the Supabase Edge Function directly
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          },
          body: JSON.stringify({
            preferences: preferences
          }),
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            const textError = await response.text();
            console.error('API Error (text):', textError);
            errorData = { error: textError };
          }
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
        console.log('Result type:', typeof result);
        console.log('Result keys:', Object.keys(result || {}));

        if (result && result.schedule && Array.isArray(result.schedule) && result.schedule.length > 0) {
          // The schedule is already parsed JSON from the Edge Function
          console.log('Parsed Schedule:', result.schedule);
          console.log('Schedule length:', result.schedule.length);

          localStorage.setItem('generatedSchedule', JSON.stringify(result.schedule));

          onSuccess?.(result.schedule);
        } else {
          console.error('Invalid schedule format received from API:', result);
          const errorMsg = result?.error || 'Invalid schedule format received from the server.';
          toast({
            title: "Error generating schedule",
            description: errorMsg,
            variant: "destructive",
          })
          onError?.(errorMsg);
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
