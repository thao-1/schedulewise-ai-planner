import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { generateSchedule } from '@/api/schedule';
import { useAuth } from '@/contexts/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' '); // Join scopes with a space

interface GoogleIntegrationStepProps {
  onScheduleGenerated: (schedule: any) => void;
}

const GoogleIntegrationStep: React.FC<GoogleIntegrationStepProps> = ({ onScheduleGenerated }) => {
  const [googleAuthUrl, setGoogleAuthUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams()[0];
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: generateSchedule,
    onSuccess: (data) => {
      localStorage.setItem('generatedSchedule', JSON.stringify(data));
      onScheduleGenerated(data);
      toast({
        title: "Schedule Generated",
        description: "Your schedule has been generated successfully.",
      })
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error("Failed to generate schedule:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Failed to generate schedule. Please try again.",
      })
    },
  });

  useEffect(() => {
    const generateAuthUrl = () => {
      setIsLoading(true);
      try {
        const redirectUri = `${window.location.origin}/onboarding`;
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${GOOGLE_SCOPES}`;
        setGoogleAuthUrl(authUrl);
      } catch (error) {
        console.error("Failed to generate Google Auth URL:", error);
      } finally {
        setIsLoading(false);
      }
    };

    generateAuthUrl();
  }, []);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setIsLoading(true);
      mutation.mutate({ googleAuthCode: code, userId: user?.id });
      setIsLoading(false);
    }
  }, [searchParams, mutation, user]);

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Integrate with Google Calendar</CardTitle>
        <CardDescription>Connect your Google Calendar to automatically sync your schedule.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Authorization</Label>
          <Input type="text" id="email" value={googleAuthUrl ? 'Authorized' : 'Not Authorized'} readOnly />
        </div>
      </CardContent>
      <CardFooter>
        <Button disabled={isLoading} onClick={() => {
          if (googleAuthUrl) {
            window.location.href = googleAuthUrl;
          }
        }}>
          {isLoading ? 'Loading ...' : 'Authorize Google Calendar'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GoogleIntegrationStep;
