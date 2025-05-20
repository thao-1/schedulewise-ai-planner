
import { useState } from 'react';
import { Preferences, PreferencesKey } from '@/types/OnboardingTypes';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define steps here to resolve the undefined error
const steps = [
  { id: 'work-hours' },
  { id: 'deep-work' },
  { id: 'personal-activities' },
  { id: 'workout-time' },
  { id: 'meeting-preference' },
  { id: 'meetings-per-day' },
  { id: 'auto-reschedule' }
];

export const useOnboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>({
    workHours: '9-5',
    deepWorkHours: '4',
    personalActivities: [],
    workoutTime: '',
    meetingPreference: '',
    meetingsPerDay: '',
    autoReschedule: false,
    customPreferences: ''
  });

  const handleInputChange = (field: PreferencesKey, value: string | boolean | string[]) => {
    setPreferences(prev => {
      // Type-safe handling of different input types
      if (field === 'personalActivities' && Array.isArray(value)) {
        return { ...prev, [field]: value };
      }
      if (field === 'autoReschedule' && typeof value === 'boolean') {
        return { ...prev, [field]: value };
      }
      if (typeof value === 'string') {
        return { ...prev, [field]: value };
      }
      return prev;
    });
  };

  const handleCheckboxChange = (field: 'personalActivities', value: string, checked: boolean) => {
    setPreferences(prev => {
      const currentValues = [...prev[field]];
      
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

  return {
    currentStep,
    preferences,
    steps, // Export steps to be used in the Onboarding component
    handleInputChange,
    handleCheckboxChange,
    handleNext,
    handleBack
  };
};
