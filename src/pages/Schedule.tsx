
import React, { useState } from 'react';
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

const Schedule = () => {
  const [currentView, setCurrentView] = useState('week');
  const [currentWeek, setCurrentWeek] = useState(new Date());

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
  
  // Generate hours for the day
  const hoursOfDay = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

  // Mock schedule data
  const scheduleData = [
    { id: 1, day: 1, hour: 10, title: 'Team Meeting', duration: 1, type: 'meeting' },
    { id: 2, day: 1, hour: 13, title: 'Deep Work Session', duration: 2, type: 'deep-work' },
    { id: 3, day: 2, hour: 9, title: 'Client Call', duration: 1, type: 'meeting' },
    { id: 4, day: 2, hour: 16, title: 'Workout', duration: 1, type: 'workout' },
    { id: 5, day: 3, hour: 12, title: 'Lunch Break', duration: 1, type: 'meals' },
    { id: 6, day: 4, hour: 14, title: 'Learning Session', duration: 2, type: 'learning' },
    { id: 7, day: 5, hour: 11, title: 'Project Review', duration: 1, type: 'meeting' },
    { id: 8, day: 5, hour: 17, title: 'Relaxation', duration: 1, type: 'relaxation' },
  ];

  // Get color based on event type
  const getEventColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'meeting': 'bg-red-100 border-red-300',
      'deep-work': 'bg-green-100 border-green-300',
      'workout': 'bg-yellow-100 border-yellow-300',
      'meals': 'bg-orange-100 border-orange-300',
      'learning': 'bg-purple-100 border-purple-300',
      'relaxation': 'bg-blue-100 border-blue-300',
    };
    return colors[type] || 'bg-gray-100 border-gray-300';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Schedule</h2>
          <p className="text-muted-foreground">View and manage your AI-generated schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
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
                    {hoursOfDay.map((hour) => {
                      const eventsAtThisTime = scheduleData.filter(
                        event => event.day === dayIndex && event.hour === hour
                      );

                      return (
                        <div key={hour} className="h-20 p-1 border border-dashed border-gray-200 rounded-md relative">
                          {eventsAtThisTime.map(event => (
                            <div 
                              key={event.id} 
                              className={`absolute inset-0 m-1 p-2 rounded-md border ${getEventColor(event.type)} overflow-hidden`}
                              style={{ height: `${event.duration * 100}%` }}
                            >
                              <div className="font-medium text-xs">{event.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {hour % 12 === 0 ? '12' : hour % 12}:00 {hour < 12 ? 'AM' : 'PM'}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
