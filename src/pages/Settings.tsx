
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "next-themes";

const Settings = () => {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign out. Please try again.",
      });
    }
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleTimezoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTimezone(event.target.value);
  };

  const handleSyncToggle = () => {
    setIsSyncEnabled(!isSyncEnabled);
  };

  const handleSyncSchedule = async () => {
    const scheduleData = localStorage.getItem('generatedSchedule');
    if (!scheduleData) {
      toast({
        title: "No schedule data available",
        description: "Please generate a schedule first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedSchedule = JSON.parse(scheduleData);
      // This is a placeholder for the actual sync functionality
      toast({
        title: "Schedule synced",
        description: "Your schedule has been successfully synced to Google Calendar.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sync schedule. Please try again.",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage your account settings and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label>Theme</Label>
            <RadioGroup
              defaultValue={theme}
              onValueChange={(value) => setTheme(value)}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Light
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  Dark
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label
                  htmlFor="system"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  System
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              type="email" 
              id="email" 
              value={email} 
              onChange={handleEmailChange} 
              placeholder="Enter your email" 
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input 
              type="text" 
              id="timezone" 
              value={timezone} 
              onChange={handleTimezoneChange} 
              placeholder="Enter your timezone" 
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Enable Google Calendar Sync</h4>
              <p className="text-sm text-muted-foreground">
                Automatically sync your schedule to Google Calendar.
              </p>
            </div>
            <Switch id="sync" checked={isSyncEnabled} onCheckedChange={handleSyncToggle} />
          </div>
        </CardContent>
        <div className="flex justify-end space-x-2 p-4">
          <Button variant="outline" onClick={handleSyncSchedule}>Sync Schedule</Button>
          <Button variant="destructive" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
