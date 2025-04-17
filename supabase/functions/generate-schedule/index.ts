
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

    const prompt = `You are an AI scheduler specialized in creating optimized weekly schedules to improve productivity and work-life balance.

Based on these user preferences:
- Work hours: ${preferences.workHours}
- Deep work hours needed: ${preferences.deepWorkHours}
- Personal activities: ${preferences.personalActivities.join(', ')}
- Workout time: ${preferences.workoutTime}
- Meeting preference: ${preferences.meetingPreference}
- Meetings per day: ${preferences.meetingsPerDay}
- Auto-reschedule preference: ${preferences.autoReschedule ? 'Yes' : 'No'}
- Custom preferences: ${preferences.customPreferences}

Generate a comprehensive weekly schedule that optimizes for productivity and work-life balance. Include all daily activities from wake-up time to bedtime, with appropriate time blocks for:
- Sleep (recommend 8 hours)
- Meals (breakfast, lunch, dinner)
- Work tasks with clear deep work blocks
- Meetings positioned according to their preference
- Personal activities (${preferences.personalActivities.join(', ')})
- Commute time if relevant
- Breaks and relaxation periods

Return ONLY a valid JSON array of events with these properties: 
- day (0-6, where 0 is Sunday)
- hour (integer, 24-hour format)
- title (string, descriptive of the activity)
- duration (in hours, can be fractional like 0.5)
- type (one of: sleep/work/meeting/deep-work/workout/meals/learning/relaxation/commute)`;

    console.log("Sending request to OpenAI with prompt");
    
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
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    console.log("OpenAI response received");
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected OpenAI response structure:", JSON.stringify(data));
      throw new Error("Invalid response from OpenAI");
    }
    
    const content = data.choices[0].message.content;
    
    try {
      // Parse the JSON content from the OpenAI response
      const parsedContent = JSON.parse(content);
      
      // Extract the schedule array from the parsed content
      let schedule;
      if (Array.isArray(parsedContent)) {
        schedule = parsedContent;
      } else if (parsedContent.schedule && Array.isArray(parsedContent.schedule)) {
        schedule = parsedContent.schedule;
      } else if (parsedContent.events && Array.isArray(parsedContent.events)) {
        schedule = parsedContent.events;
      } else {
        // Look for any array property in the response
        const arrayProps = Object.keys(parsedContent).filter(key => 
          Array.isArray(parsedContent[key])
        );
        
        if (arrayProps.length > 0) {
          schedule = parsedContent[arrayProps[0]];
        } else {
          throw new Error("Could not find schedule array in response");
        }
      }
      
      console.log("Schedule parsed successfully with", schedule.length, "events");
      
      return new Response(JSON.stringify({ schedule }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError.message);
      console.error("Raw content:", content);
      throw new Error(`Failed to parse schedule: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error in generate-schedule function:', error.message);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "If this error persists, please contact support."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
