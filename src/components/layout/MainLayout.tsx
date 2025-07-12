import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Home, Calendar, Settings, LogOut } from 'lucide-react';

export function MainLayout() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">ScheduleWise</h1>
          </div>
          <div className="flex flex-col flex-grow px-4 py-4 overflow-y-auto">
            <nav className="flex-1 space-y-1">
              <Link to="/dashboard">
                <Button
                  variant={isActive('/dashboard') ? 'secondary' : 'ghost'}
                  className={`w-full justify-start ${isActive('/dashboard') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                >
                  <Home className="mr-3 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/schedule">
                <Button
                  variant={isActive('/schedule') ? 'secondary' : 'ghost'}
                  className={`w-full justify-start ${isActive('/schedule') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                >
                  <Calendar className="mr-3 h-4 w-4" />
                  My Schedule
                </Button>
              </Link>
              <Link to="/settings">
                <Button
                  variant={isActive('/settings') ? 'secondary' : 'ghost'}
                  className={`w-full justify-start ${isActive('/settings') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </nav>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
