// src/dashboard/index.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, Clock, Users, CheckCircle, MoreHorizontal } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Thao!</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button>+ New Task</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tasks"
          value="128"
          icon={<CheckCircle className="h-6 w-6" />}
          description="+12% from last month"
        />
        <StatsCard
          title="Team Members"
          value="24"
          icon={<Users className="h-6 w-6" />}
          description="+2 from last month"
        />
        <StatsCard
          title="Upcoming Events"
          value="5"
          icon={<Calendar className="h-6 w-6" />}
          description="2 meetings tomorrow"
        />
        <StatsCard
          title="Hours Tracked"
          value="1,234"
          icon={<Clock className="h-6 w-6" />}
          description="+8% from last week"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Tasks */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <RecentTasks />
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingEvents />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, description }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-6 w-6 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// Recent Tasks Component
function RecentTasks() {
  const tasks = [
    {
      id: 1,
      title: "Complete project proposal",
      priority: "high",
      dueDate: "2025-07-15",
      assignedTo: "John D.",
    },
    {
      id: 2,
      title: "Review code changes",
      priority: "medium",
      dueDate: "2025-07-14",
      assignedTo: "You",
    },
    {
      id: 3,
      title: "Team sync meeting",
      priority: "low",
      dueDate: "2025-07-13",
      assignedTo: "Sarah M.",
    },
  ];

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
        >
          <div className="space-y-1">
            <p className="font-medium leading-none">{task.title}</p>
            <p className="text-sm text-muted-foreground">
              Due {task.dueDate} • {task.assignedTo}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                task.priority === "high"
                  ? "bg-red-100 text-red-800"
                  : task.priority === "medium"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {task.priority}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Upcoming Events Component
function UpcomingEvents() {
  const events = [
    {
      id: 1,
      title: "Team Standup",
      time: "10:00 AM - 10:30 AM",
      date: "Tomorrow",
    },
    {
      id: 2,
      title: "Client Call",
      time: "2:00 PM - 3:00 PM",
      date: "Jul 14",
    },
    {
      id: 3,
      title: "Sprint Planning",
      time: "11:00 AM - 12:30 PM",
      date: "Jul 15",
    },
  ];

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start space-x-4 rounded-lg p-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 space-y-1">
            <p className="font-medium leading-none">{event.title}</p>
            <p className="text-sm text-muted-foreground">{event.time}</p>
          </div>
          <div className="text-sm text-muted-foreground">{event.date}</div>
        </div>
      ))}
      <Button variant="outline" className="w-full mt-4">
        <Calendar className="h-4 w-4 mr-2" />
        Add Event
      </Button>
    </div>
  );
}