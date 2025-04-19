import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  PlusCircle, 
  Award, 
  BarChart3, 
  Calendar as CalendarIcon
} from 'lucide-react';
import { useTheme } from 'next-themes';

const Dashboard = () => {
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    { name: 'Deep Work Hours', value: '0 hrs', icon: Clock, color: 'bg-blue-100' },
    { name: 'Weekly Events', value: '0', icon: CalendarIcon, color: 'bg-amber-100' },
    { name: 'Productivity Score', value: '0%', icon: BarChart3, color: 'bg-green-100' },
    { name: 'Work-Life Balance', value: 'N/A', icon: Award, color: 'bg-purple-100' },
  ]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    const fetchScheduleFromStorage = async () => {
      try {
        const savedSchedule = localStorage.getItem('generatedSchedule');
        if (savedSchedule) {
          const parsedSchedule = JSON.parse(savedSchedule);
          setScheduleData(parsedSchedule);
          
          // Calculate metrics
          calculateMetrics(parsedSchedule);
          
          // Get upcoming events
          getUpcomingEvents(parsedSchedule);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setIsLoading(false);
      }
    };

    fetchScheduleFromStorage();
  }, []);
  
  const calculateMetrics = (schedule: any[]) => {
    if (!schedule || schedule.length === 0) return;
    
    // Deep Work Hours calculation
    const deepWorkEvents = schedule.filter(event => 
      event.type === 'deep-work' || 
      event.title.toLowerCase().includes('deep work')
    );
    
    const deepWorkHours = deepWorkEvents.reduce((total, event) => 
      total + event.duration, 0);
    
    // Weekly Events count
    const eventCount = schedule.length;
    
    // Work-Life Balance calculation
    const workEvents = schedule.filter(event => 
      ['work', 'deep-work', 'meeting'].includes(event.type) || 
      event.title.toLowerCase().includes('work') || 
      event.title.toLowerCase().includes('meeting')
    );
    
    const personalEvents = schedule.filter(event => 
      ['workout', 'meals', 'relaxation', 'sleep'].includes(event.type) ||
      event.title.toLowerCase().includes('personal') ||
      event.title.toLowerCase().includes('workout') ||
      event.title.toLowerCase().includes('meal') ||
      event.title.toLowerCase().includes('relax') ||
      event.title.toLowerCase().includes('sleep')
    );
    
    const totalEventHours = schedule.reduce((total, event) => total + event.duration, 0);
    const workHours = workEvents.reduce((total, event) => total + event.duration, 0);
    const personalHours = personalEvents.reduce((total, event) => total + event.duration, 0);
    
    // Calculate work percentage
    const workPercentage = totalEventHours > 0 ? Math.round((workHours / totalEventHours) * 100) : 0;
    const personalPercentage = totalEventHours > 0 ? Math.round((personalHours / totalEventHours) * 100) : 0;
    const learningEvents = schedule.filter(event => event.type === 'learning');
    const learningPercentage = totalEventHours > 0 ? Math.round((learningEvents.reduce((total, event) => total + event.duration, 0) / totalEventHours) * 100) : 0;
    const restEvents = schedule.filter(event => event.type === 'sleep' || event.type === 'relaxation');
    const restPercentage = totalEventHours > 0 ? Math.round((restEvents.reduce((total, event) => total + event.duration, 0) / totalEventHours) * 100) : 0;
    
    // Productivity score - a simple metric based on deep work time and overall schedule balance
    const balanceScore = Math.min(100, Math.max(0, 100 - Math.abs(workPercentage - 40)));
    const deepWorkScore = Math.min(100, (deepWorkHours / 15) * 100); // Assuming 15 hours of deep work per week is optimal
    const productivityScore = Math.round((balanceScore * 0.4) + (deepWorkScore * 0.6));
    
    // Work-life balance rating
    let balanceRating = 'Poor';
    if (balanceScore >= 80) balanceRating = 'Excellent';
    else if (balanceScore >= 60) balanceRating = 'Good';
    else if (balanceScore >= 40) balanceRating = 'Average';
    
    setStats([
      { name: 'Deep Work Hours', value: `${deepWorkHours.toFixed(1)} hrs`, icon: Clock, color: 'bg-blue-100' },
      { name: 'Weekly Events', value: `${eventCount}`, icon: CalendarIcon, color: 'bg-amber-100' },
      { name: 'Productivity Score', value: `${productivityScore}%`, icon: BarChart3, color: 'bg-green-100' },
      { name: 'Work-Life Balance', value: balanceRating, icon: Award, color: 'bg-purple-100' },
    ]);
    
    // Set work-life balance percentages for the chart at the bottom
    window.workLifeBalanceData = {
      work: workPercentage,
      personal: personalPercentage,
      learning: learningPercentage,
      rest: restPercentage
    };
  };
  
  const getUpcomingEvents = (schedule: any[]) => {
    // Get today's date and day of week (0-6, where 0 is Sunday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const currentHour = today.getHours() + (today.getMinutes() / 60);
    
    // Filter events for today and upcoming
    const todayEvents = schedule.filter(event => event.day === currentDay && (event.hour + event.duration) > currentHour);
    const sortedEvents = todayEvents.sort((a, b) => a.hour - b.hour);
    
    // Just take the next 4 events
    const upcomingEvents = sortedEvents.slice(0, 4).map(event => {
      // Format the time
      const hour = Math.floor(event.hour);
      const minute = Math.round((event.hour - hour) * 60);
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      const timeString = `${hour12}:${minute < 10 ? '0' + minute : minute} ${period}`;
      
      return {
        id: `${event.day}-${event.hour}`,
        name: event.title,
        time: timeString,
        type: event.type,
        color: getEventColor(event.type)
      };
    });
    
    // If we have less than 4 events today, look for events in the coming days
    if (upcomingEvents.length < 4) {
      for (let nextDay = 1; nextDay <= 6; nextDay++) {
        if (upcomingEvents.length >= 4) break;
        
        const futureDayIndex = (currentDay + nextDay) % 7;
        const futureDayEvents = schedule
          .filter(event => event.day === futureDayIndex)
          .sort((a, b) => a.hour - b.hour)
          .slice(0, 4 - upcomingEvents.length)
          .map(event => {
            const hour = Math.floor(event.hour);
            const minute = Math.round((event.hour - hour) * 60);
            const period = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 === 0 ? 12 : hour % 12;
            const timeString = `${hour12}:${minute < 10 ? '0' + minute : minute} ${period}`;
            const dayName = getDayName(futureDayIndex);
            
            return {
              id: `${event.day}-${event.hour}`,
              name: event.title,
              time: `${dayName}, ${timeString}`,
              type: event.type,
              color: getEventColor(event.type)
            };
          });
          
        upcomingEvents.push(...futureDayEvents);
      }
    }
    
    setUpcomingEvents(upcomingEvents);
  };
  
  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };
  
  const getEventColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'meeting': 'bg-red-100',
      'deep-work': 'bg-green-100',
      'workout': 'bg-yellow-100',
      'meals': 'bg-orange-100',
      'learning': 'bg-purple-100',
      'relaxation': 'bg-blue-100',
      'work': 'bg-indigo-100',
      'commute': 'bg-gray-100',
      'sleep': 'bg-slate-100',
    };
    return colors[type] || 'bg-gray-100';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome to ScheduleWise, your AI-powered scheduling assistant.</p>
        </div>
        <Button asChild>
          <Link to="/onboarding">
            <PlusCircle className="mr-2 h-4 w-4" />
            Setup Preferences
          </Link>
        </Button>
      </div>

      {/* Stats section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="schedule-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visualization section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 schedule-card">
          <CardHeader>
            <CardTitle>Weekly Schedule Overview</CardTitle>
            <CardDescription>Your optimized schedule for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {scheduleData.length > 0 ? (
                <div className="w-full h-64 p-4 rounded-lg bg-accent">
                  <div className="grid grid-cols-7 h-full gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map(day => (
                      <div key={day} className="flex flex-col h-full">
                        <div className="text-xs font-medium mb-1 text-center">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                        </div>
                        <div className="flex-1 bg-card rounded relative overflow-hidden">
                          {scheduleData
                            .filter(event => event.day === day)
                            .map(event => (
                              <div 
                                key={`${event.day}-${event.hour}-${event.title}`}
                                className={`absolute w-full ${getEventColor(event.type)} border-l-2 border-${event.type === 'meeting' ? 'red' : event.type === 'deep-work' ? 'green' : 'blue'}-400`}
                                style={{
                                  top: `${((event.hour - 6) / 18) * 100}%`,
                                  height: `${(event.duration / 18) * 100}%`,
                                }}
                                title={`${event.title} (${Math.floor(event.hour)}:${Math.round((event.hour % 1) * 60).toString().padStart(2, '0')})`}
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <img 
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80" 
                  alt="Schedule visualization" 
                  className="rounded-lg max-h-64 object-cover"
                />
              )}
            </div>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link to="/schedule">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Full Schedule
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 schedule-card">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events for today and upcoming days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className={`p-3 rounded-md ${event.color} flex justify-between items-center`}>
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-muted-foreground">{event.time}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded bg-white bg-opacity-50`}>
                      {event.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-muted-foreground mb-2">No upcoming events found</p>
                <p className="text-sm text-muted-foreground">Generate a schedule to see your upcoming events</p>
              </div>
            )}
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/add-event">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Event
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work-life balance section */}
      <Card className="schedule-card">
        <CardHeader>
          <CardTitle>Work-Life Balance</CardTitle>
          <CardDescription>A visual representation of your activities</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {scheduleData.length > 0 ? (
            <div className="flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Work-life balance" 
                className="rounded-lg max-h-64 object-cover"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Work-life balance" 
                className="rounded-lg max-h-64 object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Add a global property to Window interface
declare global {
  interface Window {
    workLifeBalanceData?: {
      work: number;
      personal: number;
      learning: number;
      rest: number;
    };
  }
}

export default Dashboard;
