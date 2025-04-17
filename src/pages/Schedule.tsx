
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';

const Schedule = () => {
  const [currentView, setCurrentView] = useState('week');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { generateSchedule } = useScheduleGeneration();

  // Function to fetch schedule on component mount
  useEffect(() => {
    const fetchScheduleFromStorage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        
        // Try to get schedule from localStorage
        const savedSchedule = localStorage.getItem('generatedSchedule');
        if (savedSchedule) {
          setScheduleData(JSON.parse(savedSchedule));
          setIsLoading(false);
          return;
        }
        
        // If no schedule in localStorage, display default view with empty schedule
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast.error('Failed to load schedule');
        setIsLoading(false);
      }
    };

    fetchScheduleFromStorage();
  }, []);

  // Function to navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentWeek(newDate);
  };

  // Function to regenerate schedule
  const handleRegenerateSchedule = async () => {
    try {
      setIsLoading(true);
      toast.info('Regenerating your schedule...');
      
      // Navigate back to onboarding to regenerate schedule
      window.location.href = '/onboarding';
    } catch (error) {
      toast.error('Failed to regenerate schedule');
      setIsLoading(false);
    }
  };

  // Get week range for display
  const getWeekRange = () => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay());
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const startMonth = start.toLocaleString('default', { month: 'short' });
    const endMonth = end.toLocaleString('default', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }
  };

  // Generate days of the week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Generate hours for the day (expanded to cover more of the day)
  const hoursOfDay = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

  // Get color based on event type
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

  // Function to add a new event
  const handleAddEvent = () => {
    window.location.href = '/add-event';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Schedule</h2>
          <p className="text-muted-foreground">View and manage your AI-generated schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleAddEvent}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRegenerateSchedule}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Select value={currentView} onValueChange={setCurrentView}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="schedule-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>{getWeekRange()}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>Your optimized weekly schedule</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : scheduleData.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-center">
              <p className="text-muted-foreground mb-4">No schedule available yet. Generate one from onboarding.</p>
              <Button onClick={() => window.location.href = '/onboarding'}>
                Go to Onboarding
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Calendar header with days */}
                <div className="grid grid-cols-8 gap-1">
                  <div className="p-2 font-medium text-center"></div>
                  {daysOfWeek.map((day, index) => (
                    <div key={day} className="p-2 font-medium text-center bg-secondary rounded-md">
                      <div>{day}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(new Date(currentWeek).setDate(
                          currentWeek.getDate() - currentWeek.getDay() + index
                        )).getDate()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calendar body with hours and events */}
                <div className="grid grid-cols-8 gap-1 mt-1">
                  {/* Hours column */}
                  <div className="space-y-1">
                    {hoursOfDay.map((hour) => (
                      <div key={hour} className="h-20 p-2 text-xs text-center flex items-center justify-center">
                        {hour % 12 === 0 ? '12' : hour % 12} {hour < 12 ? 'AM' : 'PM'}
                      </div>
                    ))}
                  </div>

                  {/* Days columns with events */}
                  {Array.from({ length: 7 }, (_, dayIndex) => (
                    <div key={dayIndex} className="space-y-1">
                      {hoursOfDay.map((hourBlock) => {
                        // Find events that start within this hour
                        const eventsAtThisTime = scheduleData.filter(
                          event => event.day === dayIndex && Math.floor(event.hour) === hourBlock
                        );

                        return (
                          <div key={hourBlock} className="h-20 p-1 border border-dashed border-gray-200 rounded-md relative">
                            {eventsAtThisTime.map(event => {
                              // Calculate offset for partial hours (e.g., 10.5)
                              const fractionalPart = event.hour - Math.floor(event.hour);
                              const topOffset = fractionalPart * 100;
                              
                              return (
                                <div 
                                  key={`${event.day}-${event.hour}-${event.title}`} 
                                  className={`absolute rounded-md border ${getEventColor(event.type)} overflow-hidden`}
                                  style={{ 
                                    top: `${topOffset}%`, 
                                    height: `${event.duration * 100}%`,
                                    left: '0',
                                    right: '0',
                                    margin: '1px'
                                  }}
                                >
                                  <div className="p-1">
                                    <div className="font-medium text-xs line-clamp-1">{event.title}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {Math.floor(event.hour) % 12 === 0 ? '12' : Math.floor(event.hour) % 12}:
                                      {(event.hour % 1) * 60 < 10 ? '0' : ''}
                                      {Math.round((event.hour % 1) * 60)} 
                                      {event.hour < 12 ? 'AM' : 'PM'}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend for event types */}
      <Card>
        <CardHeader>
          <CardTitle>Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-300 rounded"></div>
              <span>Meeting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span>Deep Work</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-300 rounded"></div>
              <span>Workout</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-300 rounded"></div>
              <span>Meals</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-300 rounded"></div>
              <span>Learning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300 rounded"></div>
              <span>Relaxation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-300 rounded"></div>
              <span>Work</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>Commute</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-300 rounded"></div>
              <span>Sleep</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
