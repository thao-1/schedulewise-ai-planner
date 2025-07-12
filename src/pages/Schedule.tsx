
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Download, Upload } from 'lucide-react';
import useScheduleGeneration from '@/hooks/useScheduleGeneration';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);
  const navigate = useNavigate();
  const { syncScheduleToGoogleCalendar, isLoading } = useScheduleGeneration();
  const { toast } = useToast();

  useEffect(() => {
    const fetchScheduleFromStorage = () => {
      try {
        const savedSchedule = localStorage.getItem('generatedSchedule');
        if (savedSchedule) {
          const parsedSchedule = JSON.parse(savedSchedule);
          setScheduleData(parsedSchedule);

          if (selectedDate) {
            // Filter events for the selected day
            const dayOfWeek = selectedDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
            const eventsForDay = parsedSchedule.filter((event: any) => event.day === dayOfWeek);
            setSelectedDayEvents(eventsForDay);
          }
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };

    fetchScheduleFromStorage();
  }, [selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleSyncToGoogle = async () => {
    try {
      console.log("Starting Google Calendar sync process");

      // First, check if we have a schedule
      if (!scheduleData || scheduleData.length === 0) {
        toast({
          title: "No schedule data",
          description: "Please generate a schedule first.",
          variant: "destructive"
        });
        return;
      }

      // Try to get the Google access token from localStorage first
      let accessToken = localStorage.getItem('googleAccessToken');
      console.log("Google access token from localStorage:", accessToken ? "Found" : "Not found");

      // If no token in localStorage, try to get it from the session
      if (!accessToken) {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Supabase session:", session ? "Found" : "Not found");

        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please sign in to use this feature.",
            variant: "destructive"
          });
          return;
        }

        // Check if the user is authenticated with Google
        const provider = session.user?.app_metadata?.provider;
        console.log("Auth provider:", provider);

        if (provider !== 'google') {
          toast({
            title: "Google authentication required",
            description: "Please connect with Google Calendar first.",
            variant: "destructive"
          });

          // Prompt the user to connect with Google
          const connectWithGoogle = confirm("Would you like to connect with Google Calendar now?");
          if (connectWithGoogle) {
            try {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
                  redirectTo: `${window.location.origin}/schedule`,
                  queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                  }
                }
              });

              if (error) throw error;
            } catch (error: any) {
              console.error("Error connecting with Google:", error);
              toast({
                title: "Connection failed",
                description: error.message || "Failed to connect with Google.",
                variant: "destructive"
              });
            }
          }
          return;
        }

        // Get the provider token
        accessToken = session.provider_token;
        console.log("Provider token exists:", !!accessToken);

        if (accessToken) {
          // Store it for future use
          localStorage.setItem('googleAccessToken', accessToken);
          console.log("Stored Google access token in localStorage");
        } else {
          toast({
            title: "Authentication error",
            description: "Could not get Google access token. Please connect with Google Calendar again.",
            variant: "destructive"
          });
          return;
        }
      }

      console.log("Google access token obtained, proceeding with sync");
      console.log("Schedule data items:", scheduleData?.length || 0);

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("Using timezone:", timezone);

      // Use the Google access token
      const result = await syncScheduleToGoogleCalendar(scheduleData, accessToken, timezone);
      console.log("Sync result:", result);

      toast({
        title: "Schedule synced",
        description: "Your schedule has been successfully synced to Google Calendar."
      });
    } catch (error: any) {
      console.error('Error syncing to Google Calendar:', error);
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync with Google Calendar.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (hour: number) => {
    const hourPart = Math.floor(hour);
    const minutePart = Math.round((hour - hourPart) * 60);
    const period = hourPart >= 12 ? 'PM' : 'AM';
    const hour12 = hourPart % 12 === 0 ? 12 : hourPart % 12;
    return `${hour12}:${minutePart.toString().padStart(2, '0')} ${period}`;
  };

  const getEventColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'meeting': 'bg-red-100 border-red-300',
      'deep-work': 'bg-green-100 border-green-300',
      'workout': 'bg-yellow-100 border-yellow-300',
      'meals': 'bg-orange-100 border-orange-300',
      'learning': 'bg-purple-100 border-purple-300',
      'relaxation': 'bg-blue-100 border-blue-300',
      'work': 'bg-indigo-100 border-indigo-300',
      'commute': 'bg-gray-100 border-gray-300',
      'sleep': 'bg-slate-100 border-slate-300',
    };
    return colors[type] || 'bg-gray-100 border-gray-300';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a day to view events</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
              />
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" className="w-full" onClick={handleSyncToGoogle} disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                Sync to Google Calendar
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="md:w-2/3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Schedule'}
            </h2>
            <Button onClick={() => navigate('/add-event')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>

          {selectedDayEvents.length > 0 ? (
            <div className="space-y-4">
              {selectedDayEvents
                .sort((a, b) => a.hour - b.hour)
                .map((event, index) => (
                  <Card key={index} className={`${getEventColor(event.type)} border`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{event.title}</h3>
                          <p className="text-sm text-gray-600">
                            {formatTime(event.hour)} - {formatTime(event.hour + event.duration)}
                          </p>
                          {event.description && (
                            <p className="mt-2 text-sm">{event.description}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-white bg-opacity-50">
                          {event.type}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="mb-4">No events scheduled for this day.</p>
                <Button variant="outline" onClick={() => navigate('/add-event')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
