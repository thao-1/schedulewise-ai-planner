
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

    // Add validation for preferences
    if (!preferences) {
      return new Response(
        JSON.stringify({ error: 'Missing preferences in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the received preferences for debugging
    console.log("Received preferences:", JSON.stringify(preferences));

    const prompt = `You are an AI scheduler specialized in creating realistic weekly work schedules that optimize productivity and work-life balance.

Based on these user preferences:
- Work hours: ${preferences.workHours}
- Deep work hours needed: ${preferences.deepWorkHours} hours per day
- Personal activities: ${preferences.personalActivities.join(', ')}
- Workout time preference: ${preferences.workoutTime}
- Meeting preference: ${preferences.meetingPreference}
- Meetings per day: ${preferences.meetingsPerDay}
- Auto-reschedule preference: ${preferences.autoReschedule ? 'Yes' : 'No'}
- Additional custom preferences: ${preferences.customPreferences || 'None specified'}

PRIORITY INSTRUCTIONS:
1. If there are specific requests in the "Additional custom preferences" field, PRIORITIZE and FOLLOW those requests above all other preferences.
2. Create a realistic work schedule for Monday through Friday (weekdays).
3. Include lighter schedules for Saturday and Sunday (weekends) with more personal time.

SCHEDULE STRUCTURE:
- Morning routine starts at 6:00 AM with wake-up activities
- Default sleep schedule: 10:00 PM to 6:00 AM (8 hours) unless custom preferences specify otherwise
- Include realistic commute times if work is not remote
- Schedule meals at appropriate times: breakfast (7-8 AM), lunch (12-1 PM), dinner (6-7 PM)
- Distribute deep work blocks according to user's specified hours per day
- Position meetings according to user's meeting preference
- Include the requested personal activities at appropriate times
- Add short breaks between intensive work sessions

WEEKDAY SCHEDULE (Monday-Friday):
- 6:00 AM: Wake up
- 7:00-8:00 AM: Morning routine + breakfast
- Work hours as specified by user
- Include specified deep work hours within work time
- Schedule meetings according to preference
- Include lunch break
- End work day according to specified work hours
- Evening: dinner, personal activities, relaxation
- 10:00 PM: Sleep (unless custom preferences specify different bedtime)

WEEKEND SCHEDULE (Saturday-Sunday):
- More flexible timing
- Focus on personal activities, relaxation, and hobbies
- Lighter schedule with more free time
- Still include meals and adequate sleep

Using users' answers to create a schedule based on their preferences.

Generate a complete week with all necessary activities for a balanced, productive schedule.`;

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
