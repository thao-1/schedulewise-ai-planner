import { Button } from '@/components/ui/button';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Loader2 } from 'lucide-react';

interface GoogleCalendarSyncProps {
  schedule: any[];
  onSyncComplete?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function GoogleCalendarSync({ schedule, onSyncComplete, onError }: GoogleCalendarSyncProps) {
  const { isAuthenticated, isLoading, error, login, syncSchedule } = useGoogleCalendar();

  const handleAuth = async () => {
    try {
      await login();
    } catch (err) {
      console.error('Error authenticating with Google:', err);
      if (onError) {
        onError(err);
      }
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncSchedule(schedule);
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (err) {
      console.error('Error syncing with Google Calendar:', err);
      if (onError) {
        onError(err);
      }
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <Button
        onClick={isAuthenticated ? handleSync : handleAuth}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isAuthenticated ? 'Syncing...' : 'Authenticating...'}
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.166,15.139,1,12.545,1C7.021,1,2.543,5.477,2.543,11s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
            </svg>
            {isAuthenticated ? 'Sync with Google Calendar' : 'Connect Google Calendar'}
          </>
        )}
      </Button>
      
      {isAuthenticated && (
        <p className="text-sm text-muted-foreground">
          Connected to Google Calendar. Your events will be added to your "ScheduleWise" calendar.
        </p>
      )}
    </div>
  );
}
