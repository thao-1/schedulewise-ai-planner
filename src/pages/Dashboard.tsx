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
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  PlusCircle, 
  Award, 
  BarChart3 
} from 'lucide-react';
import { getEventColor } from '@/utils/eventColors';

const WeeklyScheduleOverview = () => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Different color blocks to represent different types of activities/time slots
  const colorBlocks = [
    'bg-purple-200',
    'bg-green-200', 
    'bg-blue-200',
    'bg-yellow-200',
    'bg-indigo-200'
  ];

  return (
    <div className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
        <CardDescription>Your schedule for this week</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Weekly Schedule Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your optimized schedule for this week
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-7 gap-1">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center font-medium text-gray-700 dark:text-gray-300 pb-2">
                {day}
              </div>
            ))}
            
            {daysOfWeek.map((day) => (
              <div key={`${day}-blocks`} className="space-y-1">
                {colorBlocks.map((colorClass, blockIndex) => (
                  <div
                    key={`${day}-${blockIndex}`}
                    className={`h-8 rounded ${colorClass} opacity-70`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button variant="outline" className="w-full" asChild>
          <Link to="/schedule" className="flex items-center justify-center gap-2">
            <Calendar size={16} />
            View Full Schedule
          </Link>
        </Button>
      </CardFooter>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { name: 'Deep Work Hours', value: '0 hrs', icon: Clock, color: 'bg-blue-100' },
    { name: 'Weekly Events', value: '0', icon: Calendar, color: 'bg-amber-100' },
    { name: 'Productivity Score', value: '0%', icon: BarChart3, color: 'bg-green-100' },
    { name: 'Work-Life Balance', value: 'N/A', icon: Award, color: 'bg-purple-100' },
  ]);
  
  useEffect(() => {
    const fetchScheduleFromStorage = () => {
      try {
        const savedSchedule = localStorage.getItem('generatedSchedule');
        if (savedSchedule) {
          const parsedSchedule = JSON.parse(savedSchedule);
          setScheduleData(parsedSchedule);
          
          // Calculate metrics based on the schedule
          const deepWorkHours = parsedSchedule
            .filter((event: any) => event.type === 'deep-work')
            .reduce((total: number, event: any) => total + (event.duration || 0), 0);
          
          setStats(prev => [
            { ...prev[0], value: `${deepWorkHours} hrs` },
            { ...prev[1], value: parsedSchedule.length.toString() },
            prev[2],
            prev[3]
          ]);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };

    fetchScheduleFromStorage();
  }, []);

  // Use the shared getEventColor utility
  const getDashboardEventColor = (eventType: string) => {
    const colorClass = getEventColor(eventType);
    // Extract the base color name from the class (e.g., 'red' from 'bg-red-100')
    const colorMatch = colorClass.match(/bg-(\w+)-\d+/);
    const colorName = colorMatch ? colorMatch[1] : 'gray';
    
    return {
      bg: `bg-${colorName}-50`,
      text: `text-${colorName}-800`,
      border: `border-l-4 border-${colorName}-500`,
      fullClass: colorClass
    };
  };

  // Remove the duplicate metrics calculation since we already calculate in fetchScheduleFromStorage

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to ScheduleWise, your AI-powered scheduling assistant.
          </p>
        </div>
        <Button asChild>
          <Link to="/onboarding">
            <PlusCircle className="mr-2 h-4 w-4" />
            Setup Preferences
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="schedule-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.name}
                    </p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <WeeklyScheduleOverview />
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Your upcoming schedule today</CardDescription>
          </CardHeader>
          <CardContent>
            {scheduleData.length > 0 ? (
              <div className="space-y-3">
                {scheduleData
                  .filter(event => {
                    const eventDate = new Date(event.startTime);
                    const today = new Date();
                    return (
                      eventDate >= today && 
                      eventDate.getDate() === today.getDate() &&
                      eventDate.getMonth() === today.getMonth() &&
                      eventDate.getFullYear() === today.getFullYear()
                    );
                  })
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 5)
                  .map((event, index) => {
                    const colors = getDashboardEventColor(event.type);
                    const eventDate = new Date(event.startTime);
                    const endTime = new Date(eventDate.getTime() + (event.duration * 60 * 1000));
                    
                    return (
                      <div 
                        key={index} 
                        className={`${colors.bg} ${colors.text} ${colors.border} p-3 rounded-md shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm opacity-80">
                              {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50 capitalize">
                            {event.type.replace('-', ' ')}
                          </span>
                        </div>
                        {event.description && (
                          <p className="mt-2 text-sm opacity-90 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                {scheduleData.filter(event => {
                  const eventDate = new Date(event.startTime);
                  const today = new Date();
                  return (
                    eventDate >= today && 
                    eventDate.getDate() === today.getDate() &&
                    eventDate.getMonth() === today.getMonth() &&
                    eventDate.getFullYear() === today.getFullYear()
                  );
                }).length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No events scheduled for today</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No events scheduled</p>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/schedule">View All Events</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Work-life Balance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Work-life Balance</CardTitle>
          <CardDescription>Your weekly time distribution across different areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {[
              { type: 'Work', color: 'bg-blue-500', value: 40 },
              { type: 'Personal', color: 'bg-green-500', value: 30 },
              { type: 'Learning', color: 'bg-purple-500', value: 20 },
              { type: 'Rest', color: 'bg-yellow-500', value: 10 },
            ].map((item, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.type}</span>
                    <span className="font-bold">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${item.color}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <img 
              src="/pic2.png" 
              alt="Work-life balance visualization" 
              className="rounded-lg w-full max-w-3xl h-auto object-contain"
              style={{ maxHeight: '400px' }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
