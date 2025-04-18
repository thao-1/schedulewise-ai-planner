
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useScheduleGeneration } from '@/hooks/useScheduleGeneration';

const Settings = () => {
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const { syncScheduleToGoogle, isSyncingToGoogle } = useScheduleGeneration();
  
  // Check if user is connected to Google on component mount
  useEffect(() => {
    const checkGoogleConnection = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.provider === 'google') {
        setIsGoogleCalendarConnected(true);
        
        // Check if this is a redirect from Google auth
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('provider') === 'google') {
          toast.success('Successfully connected with Google Calendar!');
          // Auto-trigger sync
          setTimeout(() => {
            handleSyncCalendar();
          }, 1000);
        }
      }
    };
    
    checkGoogleConnection();
  }, []);

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      // Authenticate with Google using Supabase with explicit calendar scopes
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/settings`
        }
      });

      if (error) {
        toast.error('Failed to connect Google Calendar', {
          description: error.message
        });
      }
    } catch (error) {
      toast.error('Failed to connect Google Calendar', {
        description: (error as Error).message
      });
    }
  };

  // Add this function to sync calendar when already connected
  const handleSyncCalendar = async () => {
    await syncScheduleToGoogle();
  };

  // This function would disconnect the Google Calendar in a real implementation
  const handleDisconnectGoogleCalendar = () => {
    setIsGoogleCalendarConnected(false);
    toast.success('Google Calendar disconnected');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Card className="schedule-card">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Customize your ScheduleWise experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Theme & Appearance</h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-mode">Color Theme</Label>
                <Select defaultValue="light">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="animations">Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable animations for a smoother experience
                  </p>
                </div>
                <Switch id="animations" defaultChecked />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Calendar Integration</h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Google Calendar</Label>
                  <p className="text-sm text-muted-foreground">
                    {isGoogleCalendarConnected ? 'Connected - sync events automatically' : 'Connect to sync events'}
                  </p>
                </div>
                {isGoogleCalendarConnected ? (
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSyncCalendar}
                      disabled={isSyncingToGoogle}
                    >
                      {isSyncingToGoogle ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleDisconnectGoogleCalendar}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleConnectGoogleCalendar}>Connect</Button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Outlook Calendar</Label>
                  <p className="text-sm text-muted-foreground">
                    Connect to sync events
                  </p>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive schedule updates via email
                  </p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive real-time alerts in your browser
                  </p>
                </div>
                <Switch id="push-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notification-frequency">Notification Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">AI Preferences</h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-rescheduling">AI Auto-Rescheduling</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow AI to reschedule events when conflicts arise
                  </p>
                </div>
                <Switch id="ai-rescheduling" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-suggestions">AI Suggestions</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive AI-powered schedule improvement suggestions
                  </p>
                </div>
                <Switch id="ai-suggestions" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-aggressiveness">AI Aggressiveness</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
        <div className="p-6 pt-0 flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </Card>

      <Card className="schedule-card">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <h4 className="font-medium">Email Address</h4>
                <p className="text-sm text-muted-foreground">user@example.com</p>
              </div>
              <Button variant="outline" size="sm">Change Email</Button>
            </div>
            <Separator />
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <h4 className="font-medium">Password</h4>
                <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
              </div>
              <Button variant="outline" size="sm">Change Password</Button>
            </div>
            <Separator />
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" size="sm">Delete Account</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
