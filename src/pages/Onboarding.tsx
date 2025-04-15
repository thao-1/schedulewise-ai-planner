import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import CustomPreferences from '@/components/CustomPreferences';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    workHours: '9-5',
    deepWorkHours: '4',
    personalActivities: [] as string[],
    workoutTime: '',
    meetingPreference: '',
    meetingsPerDay: '',
    autoReschedule: false,
    customPreferences: ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setPreferences(prev => {
      if (field === 'autoReschedule') {
        return { ...prev, [field]: !!value };
      }
      
      return { ...prev, [field]: value };
    });
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean | 'indeterminate') => {
    if (checked === 'indeterminate') return;
    
    setPreferences(prev => {
      const currentValues = [...prev[field as keyof typeof preferences]] as string[];
      
      if (checked) {
        return { ...prev, [field]: [...currentValues, value] };
      } else {
        return { ...prev, [field]: currentValues.filter(v => v !== value) };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Preferences saved:', preferences);
      toast.success('Preferences saved! Generating your schedule...');
      navigate('/schedule');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  const steps = [
    {
      id: 'work-hours',
      title: 'What are your preferred work hours?',
      description: 'Choose your ideal work schedule',
      content: (
        <RadioGroup
          value={preferences.workHours}
          onValueChange={(value) => handleInputChange('workHours', value)}
          className="grid grid-cols-1 gap-4"
        >
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="9-5" id="work-9-5" />
            <Label htmlFor="work-9-5" className="flex items-center cursor-pointer">
              <span className="mr-2">🕒</span> 9 AM – 5 PM
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="10-6" id="work-10-6" />
            <Label htmlFor="work-10-6" className="flex items-center cursor-pointer">
              <span className="mr-2">🕓</span> 10 AM – 6 PM
            </Label>
          </div>
        </RadioGroup>
      )
    },
    {
      id: 'deep-work',
      title: 'How many hours a day would you like to focus on deep work?',
      description: 'Select your preferred deep work time',
      content: (
        <RadioGroup
          value={preferences.deepWorkHours}
          onValueChange={(value) => handleInputChange('deepWorkHours', value)}
          className="grid grid-cols-1 gap-4"
        >
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="2" id="deep-2" />
            <Label htmlFor="deep-2" className="flex items-center cursor-pointer">
              <span className="mr-2">🔘</span> 2 hours
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="4" id="deep-4" />
            <Label htmlFor="deep-4" className="flex items-center cursor-pointer">
              <span className="mr-2">🔘</span> 4 hours
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="6" id="deep-6" />
            <Label htmlFor="deep-6" className="flex items-center cursor-pointer">
              <span className="mr-2">🔘</span> 6+ hours
            </Label>
          </div>
        </RadioGroup>
      )
    },
    {
      id: 'personal-activities',
      title: 'Do you want to include time for personal activities?',
      description: 'Select all that apply',
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <Checkbox 
              id="workout" 
              checked={preferences.personalActivities.includes('workout')}
              onCheckedChange={(checked) => {
                handleCheckboxChange('personalActivities', 'workout', checked);
              }}
            />
            <Label htmlFor="workout" className="flex items-center cursor-pointer">
              <span className="mr-2">🏋️‍♀️</span> Workout
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <Checkbox 
              id="learning" 
              checked={preferences.personalActivities.includes('learning')}
              onCheckedChange={(checked) => {
                handleCheckboxChange('personalActivities', 'learning', checked);
              }}
            />
            <Label htmlFor="learning" className="flex items-center cursor-pointer">
              <span className="mr-2">📚</span> Learning
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <Checkbox 
              id="meals" 
              checked={preferences.personalActivities.includes('meals')}
              onCheckedChange={(checked) => {
                handleCheckboxChange('personalActivities', 'meals', checked);
              }}
            />
            <Label htmlFor="meals" className="flex items-center cursor-pointer">
              <span className="mr-2">🍽️</span> Meals with family
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <Checkbox 
              id="relaxation" 
              checked={preferences.personalActivities.includes('relaxation')}
              onCheckedChange={(checked) => {
                handleCheckboxChange('personalActivities', 'relaxation', checked);
              }}
            />
            <Label htmlFor="relaxation" className="flex items-center cursor-pointer">
              <span className="mr-2">🧘</span> Relaxation
            </Label>
          </div>
        </div>
      )
    },
    {
      id: 'workout-time',
      title: 'Preferred time for workouts?',
      description: 'When do you prefer to exercise?',
      content: (
        <RadioGroup
          value={preferences.workoutTime}
          onValueChange={(value) => handleInputChange('workoutTime', value)}
          className="grid grid-cols-1 gap-4"
        >
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="morning" id="workout-morning" />
            <Label htmlFor="workout-morning" className="flex items-center cursor-pointer">
              <span className="mr-2">⏰</span> Morning
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="evening" id="workout-evening" />
            <Label htmlFor="workout-evening" className="flex items-center cursor-pointer">
              <span className="mr-2">🌇</span> Evening
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="skip" id="workout-skip" />
            <Label htmlFor="workout-skip" className="flex items-center cursor-pointer">
              <span className="mr-2">❌</span> Skip
            </Label>
          </div>
        </RadioGroup>
      )
    },
    {
      id: 'meeting-preference',
      title: 'When do you prefer meetings?',
      description: 'Select your preferred meeting time',
      content: (
        <RadioGroup
          value={preferences.meetingPreference}
          onValueChange={(value) => handleInputChange('meetingPreference', value)}
          className="grid grid-cols-1 gap-4"
        >
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="mid-morning" id="meeting-morning" />
            <Label htmlFor="meeting-morning" className="flex items-center cursor-pointer">
              <span className="mr-2">🕙</span> Mid-morning (10–12)
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="afternoon" id="meeting-afternoon" />
            <Label htmlFor="meeting-afternoon" className="flex items-center cursor-pointer">
              <span className="mr-2">🕑</span> Afternoon (1–4)
            </Label>
          </div>
        </RadioGroup>
      )
    },
    {
      id: 'meetings-per-day',
      title: 'How many meetings do you usually have per day?',
      description: 'Select the average number of meetings',
      content: (
        <RadioGroup
          value={preferences.meetingsPerDay}
          onValueChange={(value) => handleInputChange('meetingsPerDay', value)}
          className="grid grid-cols-1 gap-4"
        >
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="0-1" id="meetings-0-1" />
            <Label htmlFor="meetings-0-1" className="flex items-center cursor-pointer">
              <span className="mr-2">🔘</span> 0–1
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="2-3" id="meetings-2-3" />
            <Label htmlFor="meetings-2-3" className="flex items-center cursor-pointer">
              <span className="mr-2">🔘</span> 2–3
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
            <RadioGroupItem value="4+" id="meetings-4+" />
            <Label htmlFor="meetings-4+" className="flex items-center cursor-pointer">
              <span className="mr-2">🔘</span> 4+
            </Label>
          </div>
        </RadioGroup>
      )
    },
    {
      id: 'auto-reschedule',
      title: 'Would you like the AI to automatically reschedule tasks if priorities change?',
      description: 'Choose your preference for AI rescheduling',
      content: (
        <div className="space-y-6">
          <RadioGroup
            value={preferences.autoReschedule ? 'yes' : 'no'}
            onValueChange={(value) => handleInputChange('autoReschedule', value === 'yes')}
            className="grid grid-cols-1 gap-4 mb-6"
          >
            <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
              <RadioGroupItem value="yes" id="reschedule-yes" />
              <Label htmlFor="reschedule-yes" className="flex items-center cursor-pointer">
                <span className="mr-2">✅</span> Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-md hover:bg-accent">
              <RadioGroupItem value="no" id="reschedule-no" />
              <Label htmlFor="reschedule-no" className="flex items-center cursor-pointer">
                <span className="mr-2">❌</span> No
              </Label>
            </div>
          </RadioGroup>
          <CustomPreferences 
            value={preferences.customPreferences}
            onChange={(value) => handleInputChange('customPreferences', value)}
          />
        </div>
      )
    }
  ];

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in">
      <h2 className="text-3xl font-bold tracking-tight mb-6">Setup Your Preferences</h2>
      
      <div className="mb-8">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className={`flex items-center justify-center h-8 w-8 rounded-full ${
                  index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`h-1 w-full ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <Card className="schedule-card">
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          <CardDescription>{currentStepData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStepData.content}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? (
              <>
                Finish
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Onboarding;
