
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Preferences } from '@/types/OnboardingTypes';

export const useScheduleGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const generateSchedule = async (preferences: Preferences) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      toast.info('Generating your personalized schedule...', {
        description: 'This may take up to 30 seconds',
        duration: 5000
      });
      
      console.log('Sending preferences to generate schedule:', preferences);
      
      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: { preferences }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate schedule');
      }
      
      if (!data || !data.schedule) {
        console.error('Invalid response from generate-schedule:', data);
        throw new Error('Invalid response from schedule generator');
      }
      
      console.log('Schedule generated successfully:', data.schedule);
      
      // Store the generated schedule in localStorage
      localStorage.setItem('generatedSchedule', JSON.stringify(data.schedule));
      
      return data.schedule;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Schedule generation error:', errorMessage);
      
      setGenerationError(errorMessage);
      toast.error('Failed to generate schedule', {
        description: errorMessage
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateSchedule,
    isGenerating,
    generationError
  };
};
