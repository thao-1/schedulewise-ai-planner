import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.displayName || user?.email || 'User'}!
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <h3 className="font-medium">Upcoming Events</h3>
          <p className="text-2xl font-bold mt-2">3</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <h3 className="font-medium">Tasks Due</h3>
          <p className="text-2xl font-bold mt-2">5</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <h3 className="font-medium">Completed</h3>
          <p className="text-2xl font-bold mt-2">12</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <h3 className="font-medium">Productivity</h3>
          <p className="text-2xl font-bold mt-2">85%</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <h3 className="font-medium mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <div>
                <p className="text-sm font-medium">Team Meeting</p>
                <p className="text-sm text-muted-foreground">10:00 AM - 11:00 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium">Lunch Break</p>
                <p className="text-sm text-muted-foreground">12:30 PM - 1:30 PM</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <h3 className="font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 text-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <div className="text-lg mb-1">📅</div>
              <span className="text-sm">New Event</span>
            </button>
            <button className="p-3 text-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <div className="text-lg mb-1">✅</div>
              <span className="text-sm">Add Task</span>
            </button>
            <button className="p-3 text-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
              <div className="text-lg mb-1">📊</div>
              <span className="text-sm">Reports</span>
            </button>
            <button className="p-3 text-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
              <div className="text-lg mb-1">⚙️</div>
              <span className="text-sm">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
