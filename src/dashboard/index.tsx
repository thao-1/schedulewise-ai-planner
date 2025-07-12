// src/dashboard/index.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Clock, Calendar, TrendingUp, Zap, Sun, Moon, Coffee, Utensils, Dumbbell, BookOpen, MoonStar, Sun as SunIcon, Clock4 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hello, Thao! 👋</h1>
              <p className="text-gray-600 dark:text-gray-400">Here's your schedule for today</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Setup Preferences
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatsCard
              title="Deep Work Hours"
              value="28.0 hrs"
              icon={<Clock className="h-6 w-6 text-blue-500" />}
              trend="+2.4h from last week"
              trendUp={true}
            />
            <StatsCard
              title="Weekly Events"
              value="98"
              icon={<Calendar className="h-6 w-6 text-purple-500" />}
              trend="+12 from last week"
              trendUp={true}
            />
            <StatsCard
              title="Productivity Score"
              value="94%"
              icon={<TrendingUp className="h-6 w-6 text-green-500" />}
              trend="+5% from last week"
              trendUp={true}
            />
            <StatsCard
              title="Work-Life Balance"
              value="Excellent"
              icon={<Zap className="h-6 w-6 text-amber-500" />}
              trend="Stable"
              trendUp={false}
            />
          </div>

          {/* Weekly Schedule */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Schedule Overview</CardTitle>
                  <CardDescription>Your schedule from Sun, Jul 7 - Sat, Jul 13</CardDescription>
                </div>
                <Button variant="outline" size="sm">View Full Schedule</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 h-full">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{day}</div>
                      <div className="flex-1 w-full bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 p-1">
                        {/* Sample events */}
                        {i === 1 && (
                          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs p-1 rounded mb-1">
                            Meeting
                          </div>
                        )}
                        {i === 3 && (
                          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs p-1 rounded mb-1">
                            Gym
                          </div>
                        )}
                        {i === 5 && (
                          <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs p-1 rounded mb-1">
                            Study
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work-Life Balance */}
          <Card>
            <CardHeader>
              <CardTitle>Work-Life Balance</CardTitle>
              <CardDescription>Your balance between work and personal life</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        65%
                      </div>
                      <span className="text-sm mt-2 text-gray-600 dark:text-gray-400">Work</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                        35%
                      </div>
                      <span className="text-sm mt-2 text-gray-600 dark:text-gray-400">Personal</span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">Healthy balance maintained</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your schedule for the next 24 hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EventItem 
                time="9:00 PM - 9:30 PM"
                title="Prepare for Sleep"
                type="relaxation"
                icon={<MoonStar className="h-4 w-4 text-purple-500" />}
              />
              <EventItem 
                time="9:30 PM - 6:00 AM"
                title="Sleep"
                type="sleep"
                icon={<Moon className="h-4 w-4 text-blue-500" />}
              />
              <EventItem 
                time="6:00 AM - 6:30 AM"
                title="Wake Up"
                type="wake"
                icon={<SunIcon className="h-4 w-4 text-amber-500" />}
              />
              <EventItem 
                time="6:30 AM - 7:00 AM"
                title="Breakfast"
                type="meals"
                icon={<Utensils className="h-4 w-4 text-emerald-500" />}
              />
              <EventItem 
                time="7:00 AM - 8:00 AM"
                title="Morning Exercise"
                type="exercise"
                icon={<Dumbbell className="h-4 w-4 text-rose-500" />}
              />
              <EventItem 
                time="9:00 AM - 12:00 PM"
                title="Deep Work Session"
                type="work"
                icon={<BookOpen className="h-4 w-4 text-indigo-500" />}
              />
            </CardContent>
            <div className="p-4 pt-0">
              <Button variant="outline" className="w-full gap-2">
                <Calendar className="h-4 w-4" />
                Add New Event
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, trend, trendUp }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <p className={`text-xs ${trendUp ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}

// Event Item Component
function EventItem({ time, title, type, icon }: { 
  time: string; 
  title: string; 
  type: string;
  icon: React.ReactNode;
}) {
  const typeStyles = {
    relaxation: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    sleep: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    wake: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    meals: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    work: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    exercise: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
    learning: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="mt-0.5">
        <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
      </div>
      <div className={`text-xs px-2 py-1 rounded-full ${typeStyles[type as keyof typeof typeStyles]}`}>
        <div className="flex items-center gap-1">
          {icon}
          <span className="capitalize">{type}</span>
        </div>
      </div>
    </div>
  );
}