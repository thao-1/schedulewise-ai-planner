
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import CustomPreferences from '@/components/CustomPreferences';
import StepProgressBar from '@/components/onboarding/StepProgressBar';
import { useOnboarding } from '@/hooks/useOnboarding';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import useScheduleGeneration from '@/hooks/useScheduleGeneration';

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Onboarding component that renders a series of steps to help users configure their schedule.
 * The steps are:
 * 1. What are your work hours?
 * 2. How many hours of deep work do you prefer daily?
 * 3. What personal activities do you want to schedule?
 * 4. When do you prefer to workout?
 * 5. What is your meeting preference?

/*******  42e9bf3d-d70c-4b06-9180-c0d6f3f874b4  *******/
const Onboarding = () => {
  const {
    currentStep,
    preferences,
    steps,
    handleInputChange,
    handleCheckboxChange,
    handleNext,
    handleBack
  } = useOnboarding();
  const { generateSchedule, isLoading: isGenerating } = useScheduleGeneration();
  const navigate = useNavigate();
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationAttempted, setGenerationAttempted] = useState(false);

  const handleComplete = async () => {
    setGenerationError(null);
    setGenerationAttempted(true);

    try {
      // Here you would typically save preferences to your backend
      console.log('Preferences to save:', preferences);
      
      // Simulate API call to save preferences
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate schedule with the preferences
      await generateSchedule({
        preferences: {
          workHours: preferences.workHours || '9-5',
          deepWorkHours: preferences.deepWorkHours || '2',
          personalActivities: preferences.personalActivities || [],
          workoutTime: preferences.workoutTime,
          meetingPreference: preferences.meetingPreference,
          meetingsPerDay: preferences.meetingsPerDay,
          autoReschedule: preferences.autoReschedule,
          customPreferences: preferences.customPreferences
        },
        onSuccess: () => {
          toast.success('Schedule generated successfully!');
          navigate('/dashboard');
        },
        onError: (error) => {
          setGenerationError(error.message || 'Unknown error');
          toast.error('Failed to generate schedule');
        }
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setGenerationError('An unexpected error occurred. Please try again.');
      toast.error('Failed to complete onboarding');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">What are your work hours?</h3>
            <RadioGroup
              value={preferences.workHours}
              onValueChange={(value) => handleInputChange('workHours', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="9-5" id="9-5" />
                <Label htmlFor="9-5">9:00 AM - 5:00 PM</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="8-4" id="8-4" />
                <Label htmlFor="8-4">8:00 AM - 4:00 PM</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="10-6" id="10-6" />
                <Label htmlFor="10-6">10:00 AM - 6:00 PM</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flexible" id="flexible" />
                <Label htmlFor="flexible">Flexible hours</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">How many hours of deep work do you prefer daily?</h3>
            <RadioGroup
              value={preferences.deepWorkHours}
              onValueChange={(value) => handleInputChange('deepWorkHours', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="2hours" />
                <Label htmlFor="2hours">2 hours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="4hours" />
                <Label htmlFor="4hours">4 hours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="6" id="6hours" />
                <Label htmlFor="6hours">6 hours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="8" id="8hours" />
                <Label htmlFor="8hours">8 hours</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">What personal activities do you want to schedule?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="meals"
                  checked={preferences.personalActivities.includes('meals')}
                  onCheckedChange={(checked) => handleCheckboxChange('personalActivities', 'meals', checked === true)}
                />
                <Label htmlFor="meals">Meals</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="workout"
                  checked={preferences.personalActivities.includes('workout')}
                  onCheckedChange={(checked) => handleCheckboxChange('personalActivities', 'workout', checked === true)}
                />
                <Label htmlFor="workout">Workout</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="learning"
                  checked={preferences.personalActivities.includes('learning')}
                  onCheckedChange={(checked) => handleCheckboxChange('personalActivities', 'learning', checked === true)}
                />
                <Label htmlFor="learning">Learning</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="relaxation"
                  checked={preferences.personalActivities.includes('relaxation')}
                  onCheckedChange={(checked) => handleCheckboxChange('personalActivities', 'relaxation', checked === true)}
                />
                <Label htmlFor="relaxation">Relaxation</Label>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">When do you prefer to workout?</h3>
            <RadioGroup
              value={preferences.workoutTime}
              onValueChange={(value) => handleInputChange('workoutTime', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="morning" id="morning" />
                <Label htmlFor="morning">Morning</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lunch" id="lunch" />
                <Label htmlFor="lunch">Lunch Break</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="evening" id="evening" />
                <Label htmlFor="evening">Evening</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none">I don't workout regularly</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">What is your meeting preference?</h3>
            <RadioGroup
              value={preferences.meetingPreference}
              onValueChange={(value) => handleInputChange('meetingPreference', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="morning" id="morning-meetings" />
                <Label htmlFor="morning-meetings">Morning Meetings</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="afternoon" id="afternoon-meetings" />
                <Label htmlFor="afternoon-meetings">Afternoon Meetings</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grouped" id="grouped-meetings" />
                <Label htmlFor="grouped-meetings">Group Meetings Together</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spread" id="spread-meetings" />
                <Label htmlFor="spread-meetings">Spread Throughout Day</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">How many meetings per day do you prefer?</h3>
            <RadioGroup
              value={preferences.meetingsPerDay}
              onValueChange={(value) => handleInputChange('meetingsPerDay', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0-1" id="0-1-meetings" />
                <Label htmlFor="0-1-meetings">0-1 meetings</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2-3" id="2-3-meetings" />
                <Label htmlFor="2-3-meetings">2-3 meetings</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4-5" id="4-5-meetings" />
                <Label htmlFor="4-5-meetings">4-5 meetings</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="6+" id="6+-meetings" />
                <Label htmlFor="6+-meetings">6+ meetings</Label>
              </div>
            </RadioGroup>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Would you like AI to automatically reschedule events when conflicts arise?</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-reschedule"
                checked={preferences.autoReschedule}
                onCheckedChange={(checked) => handleInputChange('autoReschedule', checked)}
              />
              <Label htmlFor="auto-reschedule">
                Enable automatic rescheduling
              </Label>
            </div>
            <CustomPreferences
              value={preferences.customPreferences}
              onChange={(value) => handleInputChange('customPreferences', value)}
            />
          </div>
        );
    }

    return null;
  };

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in">
      <h2 className="text-3xl font-bold tracking-tight mb-6">Setup Your Preferences</h2>

      <Card className="schedule-card mb-4">
        <CardContent className="p-6">
          <div className="mt-4 p-4 border rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Google Calendar integration will be available in a future update.
            </p>
          </div>
        </CardContent>
      </Card>

      <StepProgressBar steps={steps} currentStep={currentStep} />

      <Card className="schedule-card">
        <CardHeader>
          <CardTitle>Step {currentStep + 1}: {steps[currentStep]?.id?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</CardTitle>
          <CardDescription>
            Help us understand your preferences for an optimized schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isGenerating}
          >
            Back
          </Button>
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={isGenerating}
              className="min-w-[100px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : 'Finish'}
            </Button>
          ) : (
            <Button onClick={handleNext}>Next</Button>
          )}
        </CardFooter>
      </Card>

      {generationAttempted && generationError && (
        <Card className="mt-4 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium text-red-800">Unable to generate schedule</h3>
            <p className="text-red-600 mt-2">
              There was an error generating your schedule. Please try again or contact support.
            </p>
            <Button
              variant="destructive"
              className="mt-4"
              onClick={handleComplete}
              disabled={isGenerating}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Onboarding;
