
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchScheduleFromStorage = () => {
      try {
        const savedSchedule = localStorage.getItem('generatedSchedule');
        if (savedSchedule) {
          const parsedSchedule = JSON.parse(savedSchedule);
          setScheduleData(parsedSchedule);
        }
      } catch (error) {
        console.error('Error loading schedule from storage:', error);
      }
    };

    fetchScheduleFromStorage();
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleSyncToGoogle = async () => {
    if (scheduleData.length === 0) {
      toast({
        title: "No schedule to sync",
        description: "Please generate a schedule first.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Google Calendar Integration",
        description: "Google Calendar integration is not yet implemented. This is a mock implementation.",
      });
    } catch (error: any) {
      console.error("Error syncing with Google Calendar:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sync with Google Calendar",
        variant: "destructive"
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      work: 'bg-blue-100 text-blue-800',
      meeting: 'bg-purple-100 text-purple-800',
      break: 'bg-green-100 text-green-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[eventType] || colors.default;
  };

  // Date selection is handled by the Calendar component
  // No need for a separate handler since we're using the selectedDate state directly

  const selectedDayEvents = selectedDate ? [...scheduleData].filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }) : [];

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
              <Button variant="outline" className="w-full" onClick={handleSyncToGoogle}>
                <PlusCircle className="mr-2 h-4 w-4" />
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
              {[...selectedDayEvents]
                .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map((event: any, index: number) => (
                  <Card key={index} className={`${getEventColor(event.type)} border`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{event.title}</h3>
                          <p className="text-sm text-gray-600">
                            {formatTime(event.startTime)}
                            {event.duration && (
                              <span> - {formatTime(new Date(new Date(event.startTime).getTime() + event.duration * 60 * 1000).toString())}</span>
                            )}
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
