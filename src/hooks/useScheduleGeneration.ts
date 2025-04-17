
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Preferences } from '@/types/OnboardingTypes';

export const useScheduleGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSchedule = async (preferences: Preferences) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: { preferences }
      });

      if (error) throw error;
      
      return data.schedule;
    } catch (error) {
      toast.error('Failed to generate schedule', {
        description: error.message
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateSchedule,
    isGenerating
  };
};
