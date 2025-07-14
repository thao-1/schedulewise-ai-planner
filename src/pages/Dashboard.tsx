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
import type { ScheduleEvent, EventType } from '@/server/types/ScheduleTypes';

const WeeklyScheduleOverview = () => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  
  const eventTypes: EventType[] = [
    'meeting',
    'work',
    'learning',
    'workout',
    'relaxation'
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      <CardHeader className="bg-background">
        <CardTitle className="text-foreground">Weekly Schedule</CardTitle>
        <CardDescription>Your schedule for this week</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 bg-background">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Weekly Schedule Overview
          </h1>
          <p className="text-muted-foreground">
            Your optimized schedule for this week
          </p>
        </div>

        <div className="bg-accent/10 rounded-lg p-4 mb-6 border border-border">
          <div className="flex space-x-1">
            {daysOfWeek.map((day, index) => (
              <div key={index} className="flex-1 text-center text-sm font-medium text-foreground">
                {day}
              </div>
            ))}
          </div>
          
          <div className="mt-2 flex space-x-1">
            {daysOfWeek.map((_, dayIndex) => {
              const eventType = eventTypes[dayIndex % eventTypes.length];
              return (
                <div 
                  key={dayIndex} 
                  className={`h-2 rounded-full flex-1 ${getEventColor(eventType)}`}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto bg-background border-t">
        <Button variant="outline" className="w-full" asChild>
          <Link to="/schedule" className="flex items-center justify-center gap-2 text-foreground hover:text-primary">
            <Calendar size={16} />
            View Full Schedule
          </Link>
        </Button>
      </CardFooter>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [scheduleData, setScheduleData] = useState<ScheduleEvent[]>([]);
  const [stats, setStats] = useState<{ name: string; value: string; icon: React.ElementType; type: EventType }[]>([
    { name: 'Deep Work Hours', value: '0 hrs', icon: Clock, type: 'deep-work' },
    { name: 'Weekly Events', value: '0', icon: Calendar, type: 'meeting' },
    { name: 'Productivity Score', value: '0%', icon: BarChart3, type: 'work' },
    { name: 'Work-Life Balance', value: 'N/A', icon: Award, type: 'relaxation' },
  ]);
  
  const workLifeBalanceData: { type: EventType; value: number }[] = [
    { type: 'work', value: 40 },
    { type: 'personal', value: 30 },
    { type: 'learning', value: 20 },
    { type: 'relaxation', value: 10 },
  ];

  useEffect(() => {
    const fetchScheduleFromStorage = () => {
      try {
        const savedSchedule = localStorage.getItem('generatedSchedule');
        if (savedSchedule) {
          const parsedSchedule = JSON.parse(savedSchedule);
          setScheduleData(parsedSchedule);
          
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to ScheduleWise, your AI-powered scheduling assistant.
          </p>
        </div>
        <Button asChild>
          <Link to="/onboarding" className="flex items-center">
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
                  <div 
                    className={`p-3 rounded-lg ${getEventColor(stat.type)}`}
                  >
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
        
        <Card className="flex flex-col bg-card">
          <CardHeader className="bg-card">
            <CardTitle className="text-card-foreground">Upcoming Events</CardTitle>
            <CardDescription>Your upcoming schedule today</CardDescription>
          </CardHeader>
          <CardContent className="bg-card">
            {scheduleData.length > 0 ? (
              <div className="space-y-3">
                {scheduleData
                  .filter(event => {
                    const eventDate = new Date(event.startTime!);
                    const today = new Date();
                    return (
                      eventDate >= today && 
                      eventDate.getDate() === today.getDate() &&
                      eventDate.getMonth() === today.getMonth() &&
                      eventDate.getFullYear() === today.getFullYear()
                    );
                  })
                  .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())
                  .slice(0, 5)
                  .map((event, index) => {
                    const eventDate = new Date(event.startTime!);
                    const endTime = new Date(eventDate.getTime() + (event.duration * 60 * 60 * 1000));
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-3 rounded-md shadow-sm hover:shadow-md transition-all duration-200 border ${getEventColor(event.type)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm opacity-80">
                              {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span 
                            className="text-xs px-2 py-1 rounded-full capitalize"
                          >
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
                  const eventDate = new Date(event.startTime!);
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
          <CardFooter className="bg-card border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/schedule" className="text-foreground hover:text-primary">
                View All Events
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Work-life Balance Section */}
      <Card className="bg-card">
        <CardHeader className="bg-card">
          <CardTitle className="text-card-foreground">Work-life Balance</CardTitle>
          <CardDescription>Your weekly time distribution across different areas</CardDescription>
        </CardHeader>
        <CardContent className="bg-card">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {workLifeBalanceData.map((item, index) => {
              return (
                <Card key={index} className={`relative overflow-hidden bg-card ${getEventColor(item.type)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-card-foreground">{item.type}</span>
                      <span className="font-bold text-card-foreground">{item.value}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${item.value}%`
                        }}
                      />
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full mr-2 border"
                      />
                      <span className="capitalize text-card-foreground">{item.type}</span>
                      <span className="ml-auto font-medium text-card-foreground">{item.value}%</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="flex justify-center p-4 bg-accent/10 rounded-lg border border-border">
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
