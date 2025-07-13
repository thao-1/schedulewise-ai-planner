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
      throw new Error('OpenAI API key is not configured');
    }

    // Add user context to the prompt if available
    const userContext = [];
    if (preferences.userName) userContext.push(`Name: ${preferences.userName}`);
    if (preferences.userEmail) userContext.push(`Email: ${preferences.userEmail}`);
    if (preferences.userId) userContext.push(`User ID: ${preferences.userId}`);

    const systemPrompt = `You are an AI scheduler specialized in creating optimized weekly schedules to improve productivity and work-life balance.`;

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        { 
          role: 'user', 
          content: userPrompt + '\n\nReturn the schedule as a JSON array of events with the following structure: ' +
            '[' +
            '  {' +
            '    "id": "unique-id",' +
            '    "title": "Event title",' +
            '    "description": "Event description",' +
            '    "startTime": "HH:MM",' +
            '    "endTime": "HH:MM",' +
            '    "day": 0,' +
            '    "type": "work|break|meeting|personal|other",' +
            '    "priority": "high|medium|low",' +
            '    "isRecurring": false,' +
            '    "duration": 60' +
            '  }' +
            ']' +
            '\n\nReturn ONLY the JSON array, no other text.'
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Try to parse the response as JSON
    let schedule;
    try {
      const parsed = JSON.parse(content);
      // Handle different possible response formats
      if (Array.isArray(parsed)) {
        schedule = parsed;
      } else if (parsed?.schedule && Array.isArray(parsed.schedule)) {
        schedule = parsed.schedule;
      } else if (parsed?.events && Array.isArray(parsed.events)) {
        schedule = parsed.events;
      } else {
        // If we can't find an array in the response, throw an error
        throw new Error('Could not find schedule data in response');
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse schedule from AI response');
    }

    // Validate and normalize the schedule
    return schedule.map((event: any) => ({
      id: event.id || `event-${Math.random().toString(36).substr(2, 9)}`,
      title: event.title || 'Untitled Event',
      description: event.description || '',
      startTime: event.startTime || '09:00',
      endTime: event.endTime || '10:00',
      day: typeof event.day === 'number' ? Math.min(Math.max(0, event.day), 6) : 0,
      type: ['work', 'break', 'meeting', 'personal', 'other'].includes(event.type) 
        ? event.type 
        : 'other',
      priority: ['high', 'medium', 'low'].includes(event.priority) 
        ? event.priority 
        : 'medium',
      isRecurring: Boolean(event.isRecurring),
      duration: typeof event.duration === 'number' 
        ? Math.max(5, Math.min(1440, event.duration)) // Clamp between 5min and 24h
        : 60,
      recurringPattern: event.recurringPattern || undefined
    }));
  } catch (error) {
    console.error('Error generating schedule:', error);
    throw new Error(`Failed to generate schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default {
  generateSchedule
};
