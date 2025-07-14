
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Calendar as CalendarIcon, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { ScheduleEvent } from '@/server/types/ScheduleTypes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, startOfWeek, isSameDay, parseISO, isWithinInterval } from 'date-fns';

// Import shared event colors utility
import { getEventColor } from '@/utils/eventColors';

const Schedule = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [scheduleData, setScheduleData] = useState<ScheduleEvent[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Handle add event
  const handleAddEvent = () => {
    navigate('/add-event');
  };

  // Handle event click
  const handleEventClick = (event: ScheduleEvent) => {
    // Navigate to edit event page with event data
    navigate('/edit-event', { 
      state: { 
        event,
        from: location.pathname 
      } 
    });
  };

  // Get the week days for the current week view
  const weekDays = Array.from({ length: 7 }).map((_, index) => 
    addDays(currentWeekStart, index)
  );

  // Handle schedule data from navigation state or localStorage
  useEffect(() => {
    const loadSchedule = () => {
      try {
        console.log('Loading schedule. Location state:', location.state);
        
        // First check for schedule in navigation state
        if (location.state?.schedule) {
          const schedule = location.state.schedule;
          console.log('Schedule from location state:', schedule);
          
          if (!Array.isArray(schedule)) {
            console.error('Expected schedule to be an array, got:', typeof schedule);
            throw new Error('Invalid schedule format: expected an array of events');
          }
          
          setScheduleData(schedule);
          // Save to localStorage for persistence
          localStorage.setItem('generatedSchedule', JSON.stringify(schedule));
          
          // Show success message if it exists
          if (location.state.message) {
            toast({
              title: 'Success',
              description: location.state.message,
            });
          }
        } else {
          // Fallback to localStorage
          const savedSchedule = localStorage.getItem('generatedSchedule');
          if (savedSchedule) {
            setScheduleData(JSON.parse(savedSchedule));
          }
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
        toast({
          title: 'Error',
          description: 'Failed to load schedule',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [location.state, toast]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
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

  // Navigate between weeks
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date()));
    setSelectedDate(new Date());
  };

  const formatTime = (hour: number): string => {
    // Handle edge cases
    if (hour < 0) hour = 0;
    if (hour >= 24) hour = hour % 24;

    const hourPart = Math.floor(hour);
    const minutePart = Math.round((hour - hourPart) * 60);
    const period = hourPart >= 12 ? 'PM' : 'AM';
    const hour12 = hourPart % 12 === 0 ? 12 : hourPart % 12;
    return `${hour12}:${minutePart.toString().padStart(2, '0')} ${period}`;
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    if (!scheduleData || scheduleData.length === 0) {
      return [];
    }

    const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const events = scheduleData
      .filter(event => event.day === dayOfWeek)
      .map(event => {
        // Create a mutable copy to avoid side effects
        const newEvent = { ...event };
        
        if (newEvent.hour !== undefined) {
          const eventDate = new Date(day);
          eventDate.setHours(Math.floor(newEvent.hour), (newEvent.hour % 1) * 60, 0, 0);
          newEvent.startTime = eventDate.toISOString();
          
          if (newEvent.duration) {
            const endDate = new Date(eventDate.getTime() + newEvent.duration * 60 * 60 * 1000);
            newEvent.endTime = endDate.toISOString();
          }
        }
        return newEvent;
      })
      .sort((a, b) => {
        // Sort by start time
        const timeA = a.hour !== undefined ? a.hour * 60 + ((a.hour % 1) * 60) : 0;
        const timeB = b.hour !== undefined ? b.hour * 60 + ((b.hour % 1) * 60) : 0;
        return timeA - timeB;
      });

    return events;
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Week Navigation */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={goToToday}>
          Today
        </Button>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleAddEvent}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Weekly Schedule View */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={index} className="border rounded-lg overflow-hidden">
              <div className={`p-3 text-center ${isToday ? 'bg-blue-50' : 'bg-gray-50'} border-b`}>
                <div className="text-sm font-medium text-gray-500">
                  {format(day, 'EEE')}
                </div>
                <div className={`mt-1 text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            
            <div className="p-2 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
              {dayEvents.length > 0 ? (
                dayEvents.map((event, eventIndex) => {
                  return (
                    <Card
                      key={eventIndex}
                      className={`${getEventColor(event.type)} border transition-all duration-200 hover:shadow-md`}
                    >
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
                          <span className="px-2 py-1 text-xs rounded-full bg-white bg-opacity-50 capitalize">
                            {event.type.replace('-', ' ')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                  })
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No events</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day View for Selected Date */}
      {selectedDate && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h2>
          </div>
          
          <div className="space-y-3">
            {getEventsForDay(selectedDate).length > 0 ? (
              getEventsForDay(selectedDate).map((event, index) => {
                return (
                  <Card
                    key={index}
                    className={`${getEventColor(event.type)} border transition-all duration-200 hover:shadow-md`}
                  >
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
                        <span className="px-2 py-1 text-xs rounded-full bg-white bg-opacity-50 capitalize">
                          {event.type.replace('-', ' ')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No events scheduled for this day.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
