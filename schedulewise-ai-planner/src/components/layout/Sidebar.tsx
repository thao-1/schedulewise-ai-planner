
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar as SidebarComponent, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from '@/components/ui/sidebar';
import Logo from '@/components/Logo';
import { 
  CalendarCheck, 
  Home, 
  Settings, 
  UserPlus, 
  LogOut, 
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'My Schedule', path: '/schedule', icon: CalendarCheck },
    { name: 'Add Event', path: '/add-event', icon: PlusCircle },
    { name: 'Onboarding', path: '/onboarding', icon: UserPlus },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <SidebarComponent>
      <SidebarHeader className="p-4">
        <Logo />
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={item.path} 
                      className={`flex items-center gap-3 ${location.pathname === item.path ? 'bg-accent text-accent-foreground' : ''}`}
                    >
                      <item.icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="p-4 mt-auto border-t">
        <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
          <Link to="/logout" className="flex items-center gap-3 text-muted-foreground">
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </Button>
      </div>
    </SidebarComponent>
  );
};

export default Sidebar;
