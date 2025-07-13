
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
import { getEventColorVars } from '@/utils/eventColors';

const Schedule = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [scheduleData, setScheduleData] = useState<Array<Omit<ScheduleEvent, 'startTime' | 'endTime'> & { startTime: string; endTime?: string }>>([]);
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

  // Format time to h:mm a (e.g., 2:30 PM)
  const formatTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateTimeString);
        return 'Invalid time';
      }
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    if (!scheduleData || scheduleData.length === 0) {
      return [];
    }
    
    const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const events = scheduleData
      .filter(event => {
        // First check if the event is for this day of the week
        if (event.day !== dayOfWeek) {
          return false;
        }
        
        // Then verify the date is valid
        if (!event.startTime) {
          console.warn('Event missing startTime:', event);
          return false;
        }
        
        try {
          const eventDate = new Date(event.startTime);
          if (isNaN(eventDate.getTime())) {
            console.warn('Invalid date for event:', event);
            return false;
          }
          
          // Check if the event date matches the target day
          return isSameDay(eventDate, day);
        } catch (error) {
          console.error('Error processing event:', event, error);
          return false;
        }
      })
      .sort((a, b) => {
        // Sort by start time
        const timeA = a.hour * 60 + ((a.hour % 1) * 60);
        const timeB = b.hour * 60 + ((b.hour % 1) * 60);
        return timeA - timeB;
      });
    
    return events;
  };

  // Debug log for event types
  useEffect(() => {
    if (scheduleData && scheduleData.length > 0) {
      console.log('Schedule Data:', scheduleData);
      console.log('Unique Event Types:', [...new Set(scheduleData.map(e => e.type))]);
      // Log the computed colors for each event type
      const uniqueTypes = [...new Set(scheduleData.map(e => e.type))];
      uniqueTypes.forEach(type => {
        const colors = getEventColorVars(type);
        console.log(`Event type "${type}" colors:`, colors);
      });
    }
  }, [scheduleData]);

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
                  const colors = getEventColorVars(event.type);
                  // Format time range
                  const timeRange = event.endTime 
                    ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                    : formatTime(event.startTime);
                  return (
                    <div 
                      key={eventIndex}
                      className={`p-3 rounded-md mb-2 cursor-pointer hover:shadow-md transition-all duration-200 ${colors.bg} ${colors.border} ${colors.text}`}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{event.title}</div>
                          <div className="flex items-center text-xs mt-1">
                            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{timeRange}</span>
                          </div>
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-xs mt-2 line-clamp-2 text-gray-700">
                          {event.description}
                        </p>
                      )}
                      </div>
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
                const colors = getEventColorVars(event.type || 'other');
                return (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border-l-4 ${colors.bg} ${colors.border} ${colors.text} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div className="flex items-center text-sm mt-1 opacity-90">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </div>
                    {event.description && (
                      <p className="text-sm mt-2 opacity-90">{event.description}</p>
                    )}
                  </div>
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
