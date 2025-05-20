import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, Calendar, Check, Upload } from 'lucide-react';
import useScheduleGeneration from '@/hooks/useScheduleGeneration';
import { useNavigate } from 'react-router-dom';

interface ScheduleWithGoogleIntegrationProps {
  onComplete: () => void;
  onSkip: () => void;
  scheduleData: any[];
}

const ScheduleWithGoogleIntegration: React.FC<ScheduleWithGoogleIntegrationProps> = ({
  onComplete,
  onSkip,
  scheduleData
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { syncScheduleToGoogleCalendar, isLoading: isSyncingToGoogle } = useScheduleGeneration();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const provider = session.user?.app_metadata?.provider;

          if (provider === 'google') {
            setIsConnected(true);

            // Store the provider token if available
            if (session.provider_token) {
              localStorage.setItem('googleAccessToken', session.provider_token);
            }
          }
        }

        const hash = window.location.hash;
        const search = window.location.search;

        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          if (params.has('access_token')) {
            const accessToken = params.get('access_token');
            localStorage.setItem('googleAccessToken', accessToken || '');
            setIsConnected(true);
            toast.success('Successfully connected with Google!');
          }
        }

        const urlParams = new URLSearchParams(search);
        if (urlParams.get('provider') === 'google') {
          setIsConnected(true);
          toast.success('Successfully connected with Google!');
        }
      } catch (err) {
        console.error('Error checking Google authentication:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    checkGoogleAuth();
  }, []);

  const handleGoogleIntegration = async () => {
    try {
      if (isInIframe) {
        setError('Google authentication cannot run in an iframe. Please open this page directly in a new tab.');
        toast.error('Cannot authenticate in iframe', {
          description: 'Please open this page in a new browser tab to connect with Google.'
        });
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/onboarding`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        setError(error.message);
        toast.error('Failed to connect with Google', {
          description: error.message
        });
      } else {
        toast.success('Connecting to Google Calendar...');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to connect with Google', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSchedule = async () => {
    try {
      // Get user timezone or use default
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Get the current Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Authentication required', {
          description: 'Please sign in to use this feature'
        });
        return;
      }

      // Check if the user is authenticated with Google
      const provider = session.user?.app_metadata?.provider;
      console.log("Auth provider:", provider);

      if (provider !== 'google') {
        toast.error('Google authentication required', {
          description: 'Please connect with Google Calendar first'
        });
        return;
      }

      // Get the provider token (Google access token)
      const accessToken = session.provider_token;
      console.log("Provider token exists:", !!accessToken);

      if (!accessToken) {
        toast.error('Google token not found', {
          description: 'Please reconnect with Google Calendar'
        });

        // Prompt to reconnect
        const reconnect = confirm("Would you like to reconnect with Google Calendar now?");
        if (reconnect) {
          await handleGoogleIntegration();
        }
        return;
      }

      // Store the token for future use
      localStorage.setItem('googleAccessToken', accessToken);
      console.log("Using Google access token starting with:", accessToken.substring(0, 10) + "...");

      const success = await syncScheduleToGoogleCalendar(
        scheduleData,
        accessToken,
        timezone
      );

      if (success) {
        toast.success('Schedule synced to Google Calendar');
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (err) {
      console.error('Error syncing schedule:', err);
      toast.error('Failed to sync schedule', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  // Helper function to format time
  const formatTime = (hour: number) => {
    const hourPart = Math.floor(hour);
    const minutePart = Math.round((hour - hourPart) * 60);
    const period = hourPart >= 12 ? 'PM' : 'AM';
    const hour12 = hourPart % 12 === 0 ? 12 : hourPart % 12;
    return `${hour12}:${minutePart.toString().padStart(2, '0')} ${period}`;
  };

  // Helper function to get event color
  const getEventColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'meeting': 'bg-purple-50',
      'deep-work': 'bg-green-50',
      'workout': 'bg-orange-50',
      'meals': 'bg-red-50',
      'learning': 'bg-yellow-50',
      'relaxation': 'bg-blue-50',
      'work': 'bg-indigo-50',
      'commute': 'bg-gray-50',
      'sleep': 'bg-blue-100',
    };
    return colorMap[type] || 'bg-gray-50';
  };

  // Group events by day
  const eventsByDay: Record<number, any[]> = {};
  scheduleData.forEach(event => {
    if (!eventsByDay[event.day]) {
      eventsByDay[event.day] = [];
    }
    eventsByDay[event.day].push(event);
  });

  // Day names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Your Generated Schedule</h2>
        <p className="text-muted-foreground">
          Here's your AI-generated schedule based on your preferences
        </p>
      </div>

      {/* Google Integration Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <h3 className="font-medium">Google Calendar Integration</h3>
                <p className="text-sm text-blue-700">
                  Connect and sync your schedule with Google Calendar
                </p>
              </div>
            </div>

            {isConnected ? (
              <Button
                onClick={handleSyncSchedule}
                disabled={isSyncingToGoogle}
                size="sm"
              >
                {isSyncingToGoogle ? (
                  <>Syncing...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Sync to Google Calendar
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleGoogleIntegration}
                disabled={isLoading || isInIframe}
                size="sm"
              >
                {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
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

      {error && !isInIframe && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Google Integration Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Schedule Display */}
      <div className="space-y-6">
        {Object.keys(eventsByDay).map((day) => (
          <Card key={day} className="overflow-hidden">
            <CardHeader className="bg-gray-50 pb-3">
              <CardTitle>{dayNames[parseInt(day)]}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {eventsByDay[parseInt(day)]
                  .sort((a, b) => a.hour - b.hour)
                  .map((event, index) => (
                    <div key={index} className={`p-3 rounded-md ${getEventColor(event.type)} border`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          <p className="text-sm text-gray-600">
                            {formatTime(event.hour)} - {formatTime(event.hour + event.duration)}
                          </p>
                          {event.description && (
                            <p className="mt-1 text-sm">{event.description}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-white bg-opacity-50">
                          {event.type}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onSkip}>
          Skip Google Integration
        </Button>
        <Button onClick={onComplete}>
          Go to Schedule
        </Button>
      </div>
    </div>
  );
};

export default ScheduleWithGoogleIntegration;
