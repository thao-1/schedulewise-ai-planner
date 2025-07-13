import OpenAI from 'openai';
import { config } from '../config.js';

// Initialize the OpenAI client with the API key from config
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Interface for schedule events
export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  day: number; // 0-6 (Sunday-Saturday)
  type: 'work' | 'break' | 'meeting' | 'personal' | 'other';
  priority?: 'high' | 'medium' | 'low';
  isRecurring?: boolean;
  duration?: number; // in minutes
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
    daysOfWeek?: number[];
  };
}

export interface Preferences {
  // Schedule preferences
  workHours: string;
  deepWorkHours: string;
  personalActivities: string[];
  workoutTime?: string;
  meetingPreference?: string;
  meetingsPerDay?: number | string;
  autoReschedule?: boolean;
  customPreferences?: string;
  
  // User context (optional)
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export async function generateSchedule(preferences: Preferences): Promise<ScheduleEvent[]> {
  try {
    // Validate OpenAI API key
    if (!config.openai.apiKey) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    // Add user context to the prompt if available
    const userContext = [];
    if (preferences.userName) userContext.push(`Name: ${preferences.userName}`);
    if (preferences.userEmail) userContext.push(`Email: ${preferences.userEmail}`);
    if (preferences.userId) userContext.push(`User ID: ${preferences.userId}`);

    const systemPrompt = `You are an AI scheduler specialized in creating optimized weekly schedules to improve productivity and work-life balance.
    
    Your task is to generate a weekly schedule based on the user's preferences. The schedule should be realistic, balanced, and tailored to the user's needs.
    
    IMPORTANT: Return ONLY a valid JSON array of schedule events. Do not include any other text or explanation.`;

    const userPrompt = `
User context:
${userContext.length > 0 ? userContext.join('\n') : 'No additional user context provided'}

Based on these user preferences:
- Work hours: ${preferences.workHours}
- Deep work hours: ${preferences.deepWorkHours || 'Not specified'}
- Personal activities: ${preferences.personalActivities?.join(', ') || 'None specified'}
- Workout time: ${preferences.workoutTime || 'Not specified'}
- Meeting preference: ${preferences.meetingPreference || 'Not specified'}
- Meetings per day: ${preferences.meetingsPerDay || 'Not specified'}
- Auto-reschedule: ${preferences.autoReschedule ? 'Enabled' : 'Disabled'}
- Custom preferences: ${preferences.customPreferences || 'None'}

Generate a comprehensive weekly schedule that optimizes for productivity and work-life balance. Include all daily activities from wake-up time to bedtime, with appropriate time blocks for:
- Sleep (recommend 8 hours)
- Meals (breakfast, lunch, dinner)
- Work tasks with clear deep work blocks
- Meetings positioned according to their preference
- Personal activities (${preferences.personalActivities?.join(', ') || 'None'})
- Workout time
- Breaks and relaxation periods

Return ONLY a valid JSON array of events with these properties: 
- day (0-6, where 0 is Sunday)
- hour (integer, 24-hour format)
- title (string, descriptive of the activity)
- duration (in hours, can be fractional like 0.5)
- type (one of: sleep/work/meeting/deep-work/workout/meals/learning/relaxation/commute)
- description (optional, more details about the activity)`;

    console.log('Sending request to OpenAI with prompt:', userPrompt);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        { 
          role: 'user', 
          content: `Generate a weekly schedule based on the following preferences. Return ONLY a valid JSON object with a single property called "schedule" that contains an array of events with the specified structure.\n\n${userPrompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    console.log('OpenAI response:', JSON.stringify(response, null, 2));

    // Extract the content and parse it as JSON
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Extract the schedule array from the response
    const schedule = parsedContent.schedule;
    if (!Array.isArray(schedule)) {
      console.error('Invalid schedule format from OpenAI:', parsedContent);
      throw new Error('Invalid schedule format from OpenAI');
    }

    // Map the response to the ScheduleEvent interface
    const events: ScheduleEvent[] = schedule.map((event: any) => ({
      id: event.id || `event-${Math.random().toString(36).substr(2, 9)}`,
      title: event.title || 'Untitled Event',
      description: event.description || '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      day: typeof event.day === 'number' ? event.day : 0,
      type: ['work', 'break', 'meeting', 'personal', 'other'].includes(event.type) 
        ? event.type as 'work' | 'break' | 'meeting' | 'personal' | 'other'
        : 'other',
      isRecurring: Boolean(event.isRecurring),
      duration: typeof event.duration === 'number' ? event.duration : 1,
      recurringPattern: event.recurringPattern
    }));

    return events;
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw new Error(`Failed to generate schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default {
  generateSchedule
};
