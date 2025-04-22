
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
        const response = await fetch('/api/generateSchedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey, prompt, email, timezone }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          toast({
            title: "Error generating schedule",
            description: "Please check your preferences and try again.",
            variant: "destructive",
          })
          onError?.(errorData);
          throw new Error(`Failed to generate schedule: ${response.status}`);
        }

        const result = await response.json();
        console.log('Schedule Result:', result);
        
        if (result && result.schedule) {
          const parsedSchedule = JSON.parse(result.schedule);
          console.log('Parsed Schedule:', parsedSchedule);
          
          localStorage.setItem('generatedSchedule', JSON.stringify(parsedSchedule));
          
          onSuccess?.(parsedSchedule);
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
    if (!scheduleData || scheduleData.length === 0) {
      toast({
        title: "No schedule data available",
        description: "Please generate a schedule first.",
        variant: "destructive"
      });
      return false;
    }

    if (!accessToken) {
      toast({
        title: "Authentication required",
        description: "Please connect to Google Calendar first.",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsLoading(true);
      // Instead of using googleapis directly, make a call to your API
      const response = await fetch('/api/syncGoogleCalendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          events: scheduleData,
          timezone
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync calendar: ${response.status}`);
      }

      toast({
        title: "Schedule synced to Google Calendar",
        description: "Your schedule has been successfully synced to your Google Calendar."
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
