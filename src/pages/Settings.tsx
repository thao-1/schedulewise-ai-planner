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
import { useTheme } from 'next-themes';
import { Calendar, AlertCircle, ExternalLink } from 'lucide-react';

const Settings = () => {
  const [animations, setAnimations] = useState(true);
  const { theme, setTheme } = useTheme();
  const { 
    syncScheduleToGoogle, 
    isSyncingToGoogle,
    isGoogleConnected: hookIsGoogleConnected
  } = useScheduleGeneration();
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
      console.log("Iframe detection: ", window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
      console.log("Access to parent window restricted, assuming iframe");
    }
  }, []);
  
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        console.log("Checking Google authentication status");
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Current session:", session ? "Found" : "None");
        
        if (session) {
          const provider = session.user?.app_metadata?.provider;
          console.log("Auth provider:", provider);
          
          if (provider === 'google') {
            setIsGoogleCalendarConnected(true);
            console.log("Google connection detected");
            
            const params = new URLSearchParams(window.location.search);
            if (params.has('provider') && params.get('provider') === 'google') {
              toast.success('Successfully connected with Google Calendar!');
              
              const url = new URL(window.location.href);
              url.search = '';
              window.history.replaceState({}, document.title, url.toString());
              
              setTimeout(() => {
                handleSyncCalendar();
              }, 1000);
            }
          }
        }
      } catch (err) {
        console.error('Error checking Google authentication:', err);
        setGoogleAuthError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    checkGoogleConnection();
    
    const savedAnimations = localStorage.getItem('useAnimations');
    if (savedAnimations !== null) {
      setAnimations(savedAnimations === 'true');
    }
  }, []);

  useEffect(() => {
    setIsGoogleCalendarConnected(hookIsGoogleConnected);
  }, [hookIsGoogleConnected]);

  const handleSave = () => {
    localStorage.setItem('useAnimations', animations.toString());
    if (animations) {
      document.body.classList.add('use-animations');
    } else {
      document.body.classList.remove('use-animations');
    }
    toast.success('Settings saved successfully!');
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      setGoogleAuthError(null);
      
      if (isInIframe) {
        setGoogleAuthError('Google authentication cannot run in an iframe. Please open this page directly in a new tab.');
        toast.error('Cannot authenticate in iframe', {
          description: 'Please open this page in a new browser tab to connect with Google.'
        });
        return;
      }
      
      console.log('Attempting Google integration with Supabase');
      
      localStorage.setItem('returnPathAfterGoogleAuth', '/settings');
      
      await supabase.auth.signOut({ scope: 'local' });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/settings`,
        }
      });

      if (error) {
        console.error('Google integration error:', error);
        setGoogleAuthError(error.message);
        toast.error('Failed to connect with Google', {
          description: error.message
        });
      } else {
        toast.success('Connecting to Google Calendar...');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Google integration error caught:', errorMessage);
      setGoogleAuthError(errorMessage);
      toast.error('Failed to connect with Google', {
        description: errorMessage
      });
    }
  };

  const handleSyncCalendar = async () => {
    await syncScheduleToGoogle();
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      await supabase.auth.signOut();
      setIsGoogleCalendarConnected(false);
      toast.success('Google Calendar disconnected');
    } catch (error) {
      toast.error('Failed to disconnect from Google Calendar');
    }
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  const handleAnimationsToggle = (checked: boolean) => {
    setAnimations(checked);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Card className="schedule-card">
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>Connect your calendar services to sync events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInIframe && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-orange-800 font-medium">Cannot authenticate in iframe</p>
                <p className="text-orange-600 text-sm">
                  Google authentication will not work in an iframe for security reasons. 
                  Please open this page directly in a new browser tab.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open(window.location.href, '_blank')}
                >
                  Open in new tab
                </Button>
              </div>
            </div>
          )}
          
          {googleAuthError && !isInIframe && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Google Integration Error</p>
                <p className="text-red-600 text-sm">{googleAuthError}</p>
              </div>
            </div>
          )}
            
          <div className="space-y-4">
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
                    {isSyncingToGoogle ? 'Syncing...' : (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Sync Now
                      </>
                    )}
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleConnectGoogleCalendar}
                  disabled={isInIframe}
                >
                  Connect
                </Button>
              )}
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">Google Calendar Integration Guide</h4>
              <ul className="text-sm text-blue-700 space-y-2 list-disc pl-5">
                <li>You may need to set up Google OAuth in the Supabase dashboard</li>
                <li>Ensure you've configured <code>https://app.supabase.io</code> as an authorized JavaScript origin</li>
                <li>Add <code>https://xdqfmoouljpyidavrofb.supabase.co/auth/v1/callback</code> as an authorized redirect URI</li>
                <li>Make sure you've enabled the Google Calendar API in your Google Cloud Console</li>
              </ul>
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-800 mt-2"
                onClick={() => window.open('https://supabase.com/docs/guides/auth/social-login/auth-google', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" /> 
                View Supabase Google Auth docs
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
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
        </CardContent>
      </Card>
      
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
                <Select value={theme} onValueChange={handleThemeChange}>
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
                <Switch id="animations" checked={animations} onCheckedChange={handleAnimationsToggle} />
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
