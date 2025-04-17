
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json();

    const prompt = `Based on these user preferences:
    - Work hours: ${preferences.workHours}
    - Deep work hours needed: ${preferences.deepWorkHours}
    - Personal activities: ${preferences.personalActivities.join(', ')}
    - Workout time: ${preferences.workoutTime}
    - Meeting preference: ${preferences.meetingPreference}
    - Meetings per day: ${preferences.meetingsPerDay}
    - Custom preferences: ${preferences.customPreferences}

    Generate a weekly schedule that optimizes for productivity and work-life balance. Return the response as a JSON array of events with these properties: day (0-6), hour (8-19), title, duration (in hours), and type (meeting/deep-work/workout/meals/learning/relaxation).`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI scheduler that creates optimized weekly schedules based on user preferences. Return only valid JSON arrays of schedule events.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }),
    });

    const data = await response.json();
    const schedule = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify({ schedule }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-schedule function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
