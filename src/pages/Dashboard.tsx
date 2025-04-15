
import React from 'react';
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

const Dashboard = () => {
  // Mock data for dashboard statistics
  const stats = [
    { name: 'Deep Work Hours', value: '12 hrs', icon: Clock, color: 'bg-blue-100' },
    { name: 'Weekly Events', value: '24', icon: CalendarIcon, color: 'bg-amber-100' },
    { name: 'Productivity Score', value: '85%', icon: BarChart3, color: 'bg-green-100' },
    { name: 'Work-Life Balance', value: 'Good', icon: Award, color: 'bg-purple-100' },
  ];

  // Mock upcoming events
  const upcomingEvents = [
    { id: 1, name: 'Team Meeting', time: '10:00 AM', type: 'meeting', color: 'bg-red-100' },
    { id: 2, name: 'Deep Work Session', time: '1:00 PM', type: 'deep-work', color: 'bg-green-100' },
    { id: 3, name: 'Workout', time: '5:30 PM', type: 'workout', color: 'bg-yellow-100' },
    { id: 4, name: 'Family Dinner', time: '7:00 PM', type: 'meals', color: 'bg-orange-100' },
  ];

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
              <img 
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80" 
                alt="Schedule visualization" 
                className="rounded-lg max-h-64 object-cover"
              />
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
            <CardDescription>Events for today</CardDescription>
          </CardHeader>
          <CardContent>
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
          <div className="flex justify-center mb-6">
            <img 
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
              alt="Work-life balance" 
              className="rounded-lg max-h-64 object-cover"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            <div className="flex flex-col items-center p-2 bg-blue-100 rounded-md">
              <span className="font-medium">Work</span>
              <span className="text-xl font-bold">40%</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-green-100 rounded-md">
              <span className="font-medium">Personal</span>
              <span className="text-xl font-bold">30%</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-yellow-100 rounded-md">
              <span className="font-medium">Health</span>
              <span className="text-xl font-bold">15%</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-purple-100 rounded-md">
              <span className="font-medium">Rest</span>
              <span className="text-xl font-bold">15%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
