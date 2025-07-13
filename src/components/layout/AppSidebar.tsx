import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Home, Calendar, Settings, PlusCircle, UserPlus } from "lucide-react"

type NavItem = {
  name: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: "Schedule",
    href: "/schedule",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    name: "Add Event",
    href: "/add-event",
    icon: <PlusCircle className="h-5 w-5" />,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    name: "Onboarding",
    href: "/onboarding",
    icon: <UserPlus className="h-5 w-5" />,
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex-shrink-0 flex items-center px-4 mb-8">
            <h1 className="text-xl font-bold text-gray-900">ScheduleWise</h1>
          </div>
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <span
                    className={cn(
                      isActive ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 flex-shrink-0 h-6 w-6'
                    )}
                  >
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
