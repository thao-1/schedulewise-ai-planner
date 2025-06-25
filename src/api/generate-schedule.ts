
import { SchedulePreferences } from '@/types/schedule';

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

export interface ScheduleEvent {
  title: string;
  day: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour: number; // 0-23, can be decimal like 7.5 for 7:30
  duration: number; // in hours, can be decimal
  type: 'work' | 'meeting' | 'deep-work' | 'workout' | 'meals' | 'break' | 'personal' | 'learning' | 'relaxation' | 'commute' | 'sleep';
  description?: string;
}

interface ScheduleResponse {
  success: boolean;
  data?: ScheduleEvent[];
  error?: string;
  message?: string;
}

/**
 * Generates a schedule based on user preferences using OpenAI
 * @param preferences - User preferences for schedule generation
 * @returns Generated schedule or error object
 */
export async function generateSchedule(preferences: SchedulePreferences): Promise<ScheduleResponse> {
  try {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured. Please check your environment variables.');
    }
    // Add validation for preferences
    if (!preferences) {
      throw new Error('Preferences are required');
    }

    // Construct the prompt for the AI
    const prompt = `You are an AI scheduler specialized in creating realistic weekly work schedules. 
Create a detailed schedule based on the following preferences:

Work Hours: ${preferences.workHours}
Deep Work Hours: ${preferences.deepWorkHours} hours per day
Personal Activities: ${preferences.personalActivities?.join(', ') || 'None'}
Workout Time: ${preferences.workoutTime || 'Not specified'}
Meeting Preference: ${preferences.meetingPreference}
Meetings Per Day: ${preferences.meetingsPerDay || 'Not specified'}
Auto-reschedule: ${preferences.autoReschedule ? 'Enabled' : 'Disabled'}
Additional Preferences: ${preferences.customPreferences || 'None'}

GUIDELINES:
- Distribute deep work blocks according to user's specified hours per day
- Position meetings according to user's meeting preference
- Include the requested personal activities at appropriate times
- Add short breaks between intensive work sessions
- Schedule meals at appropriate times (breakfast, lunch, dinner)
- Ensure 7-9 hours of sleep per night
- Include time for relaxation and personal activities
- Respect work-life balance

IMPORTANT: Return a JSON object with a 'schedule' property containing an array of events. Each event must have these properties:
- title: string (descriptive name of the activity)
- day: number (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday)
- hour: number (0-23, can be decimal like 7.5 for 7:30)
- duration: number (in hours, can be decimal like 1.5 for 90 minutes)
- type: string (work|meeting|deep-work|workout|meals|break|personal|learning|relaxation|commute|sleep)
- description: string (optional, additional details)

Example response format:
{
  "schedule": [
    {"day": 1, "hour": 6, "title": "Wake up", "duration": 0.5, "type": "relaxation", "description": "Morning routine"},
    {"day": 1, "hour": 7, "title": "Breakfast", "duration": 1, "type": "meals"},
    {"day": 1, "hour": 9, "title": "Deep Work", "duration": 3, "type": "deep-work"}
  ]
}`;

    console.log("Sending request to OpenAI with prompt");
    console.log("OpenAI API Key exists:", !!OPENAI_API_KEY);

    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates weekly schedules based on user preferences. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("OpenAI API Response received");

    // Extract the generated content
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response from OpenAI');
    }

    // Parse the JSON response
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      throw new Error('Failed to parse schedule from OpenAI response');
    }

    // Extract the schedule array from the response
    let schedule: ScheduleEvent[] = [];
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
        throw new Error('No schedule data found in the response');
      }
    }

    // Validate the schedule data
    if (!Array.isArray(schedule) || schedule.length === 0) {
      throw new Error('Invalid schedule data received from OpenAI');
    }

    // Validate each event in the schedule
    const validatedSchedule = schedule.map(event => ({
      title: event.title || 'Untitled',
      day: typeof event.day === 'number' ? event.day : 1,
      hour: typeof event.hour === 'number' ? event.hour : 9,
      duration: typeof event.duration === 'number' ? event.duration : 1,
      type: ['work', 'meeting', 'deep-work', 'workout', 'meals', 'break', 'personal', 'learning', 'relaxation', 'commute', 'sleep'].includes(event.type) 
        ? event.type 
        : 'work',
      description: event.description || ''
    }));

    console.log('Generated schedule:', JSON.stringify(validatedSchedule, null, 2));

    return {
      success: true,
      data: validatedSchedule
    };
  } catch (error) {
    console.error('Error in generateSchedule:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      message: 'Failed to generate schedule. Please check your preferences and try again.'
    };
  }
}
