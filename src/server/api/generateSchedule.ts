import { type Request, type Response } from 'express';
import { type Preferences } from '../utils/openai.js';
// Importing fetch for API calls to OpenAI
import fetch from 'node-fetch';

// Define the structure of a schedule event
type EventType = 'work' | 'meeting' | 'deep-work' | 'workout' | 'meals' | 'break' | 'personal' | 'learning' | 'relaxation' | 'commute' | 'sleep';

interface ScheduleEvent {
  title: string;
  day: number;
  hour: number;
  duration: number;
  type: EventType;
  description?: string;
}

export interface ScheduleResponse {
  success: boolean;
  data?: ScheduleEvent[];
  error?: string;
  message?: string;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

type AuthenticatedRequest = Request & { 
  isAuthenticated: () => boolean;
  user?: {
    id: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
  };
}

export const generateScheduleHandler = async (
  req: AuthenticatedRequest, 
  res: Response
) => {
  console.log('=== New Schedule Generation Request ===');
  
  try {
    const { preferences } = req.body as { preferences: Preferences };
    
    // Get user info if available, otherwise use defaults
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
    const user = isAuthenticated ? req.user : null;
    
    const userId = user?.id || 'anonymous';
    const userName = user?.displayName || 'Guest User';
    
    console.log('User info:', { userId, userName, isAuthenticated });
    console.log('Received preferences:', JSON.stringify(preferences, null, 2));

    if (!preferences) {
      const error = 'Missing preferences in request body';
      console.error(error);
      return res.status(400).json({ 
        success: false, 
        error
      });
    }

    try {
      const result = await generateSchedule(preferences, userId);
      
      if (!result.success || !result.data) {
        console.error('Schedule generation failed:', result.error);
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to generate schedule',
          message: result.message
        });
      }
      
      console.log(`Successfully generated ${result.data.length} schedule events`);
      
      // Return the schedule data directly (not wrapped in result object)
      return res.json(result.data);
      
    } catch (error: any) {
      console.error('Error in generateSchedule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during schedule generation';
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        message: 'Failed to generate schedule. Please check your preferences and try again.'
      });
    }
    
  } catch (error: any) {
    console.error('Unexpected error in generateScheduleHandler:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
      message: 'Failed to generate schedule. Please try again.'
    });
  }
};

/**
 * Generates a schedule based on user preferences using OpenAI
 * @param preferences - User preferences for schedule generation
 * @param _userId - ID of the user generating the schedule
 * @returns Generated schedule
 */
async function generateSchedule(preferences: Preferences, _userId: string = 'anonymous'): Promise<ScheduleResponse> {
  try {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured. Please check your environment variables.');
    }
    
    if (!preferences) {
      throw new Error('Preferences are required');
    }

    console.log("Sending request to OpenAI with preferences:", JSON.stringify(preferences, null, 2));
    console.log("OpenAI API Key exists:", !!OPENAI_API_KEY);

    // Enhanced system prompt with strict JSON formatting requirements
    const systemPrompt = [
      'You are a helpful assistant that creates optimized weekly schedules based on user preferences.',
      'The schedule should be returned as a VALID JSON object with the following structure:',
      '{"schedule":[{"title":"Event Title","day":0,"hour":9.5,"duration":1.5,"type":"work","description":"Brief description"}]}',
      '',
      '- day: 0-6 (0=Sunday, 1=Monday, etc.)',
      '- hour: 0-23.75 (e.g., 9.5 for 9:30 AM, 13.75 for 1:45 PM)',
      '- duration: in hours (e.g., 1.5 for 1 hour 30 minutes)',
      '- type: work|meeting|deep-work|workout|meals|break|personal|learning|relaxation|commute|sleep',
      '',
      'IMPORTANT RULES:',
      '1. Response MUST be valid JSON that can be parsed with JSON.parse()',
      '2. Use double quotes for all property names and string values',
      '3. Do NOT include any text before or after the JSON object',
      '4. Do NOT include markdown code block syntax (```json and ```)',
      '5. Include events for ALL 7 days of the week (Sunday to Saturday)',
      '6. Make sure all required fields are included for each event',
      '',
      'Schedule Guidelines:',
      '1. Generate a complete 7-day schedule (Sunday to Saturday)',
      '2. Each day should have a balanced mix of work, personal time, and rest',
      '3. Include appropriate breaks between different types of activities',
      '4. Schedule deep work during the user\'s most productive hours if known',
      '5. Add workout sessions based on the user\'s preferred time',
      '6. Allocate time for meals (breakfast, lunch, dinner)',
      '7. Ensure 7-9 hours of sleep per night',
      '8. Include commute times if applicable',
      '9. Account for personal activities and relaxation time'
    ].join('\n');

    const currentDate = new Date();
    const userPrompt = `Create a detailed 7-day weekly schedule based on the following preferences. The schedule starts on ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

User Preferences:
${JSON.stringify(preferences, null, 2)}

Please generate a complete 7-day schedule (Sunday to Saturday) following these guidelines:
1. Include all standard daily activities (sleep, meals, work, etc.)
2. Allocate time for the specific preferences mentioned above
3. Schedule deep work during the user's most productive hours if known
4. Add workout sessions based on the user's preferred time
5. Allocate time for meals (breakfast, lunch, dinner)
6. Ensure 7-9 hours of sleep per night
7. Make sure to include events for all 7 days of the week
8. For each day, include a good balance of work, personal time, and rest

Return the schedule as a JSON object with a "schedule" array containing all events.`;

    // Make API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    let parsedContent: any;
    
    // First, try to parse the content as is
    try {
      parsedContent = JSON.parse(content);
    } catch (initialError) {
      console.log('Initial JSON parse failed, trying to extract JSON from content');
      
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          // Clean up the JSON content
          const cleanedContent = jsonMatch[1]
            .replace(/^\s*[\r\n]+/g, '') // Remove empty lines at start
            .replace(/[\r\n]+$/g, '') // Remove empty lines at end
            .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
            .replace(/,\s*}/g, '}') // Remove trailing commas
            .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
            .replace(/([\w]+)(?=\s*:)/g, '"$1"') // Add quotes around unquoted keys
            .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double quotes
            .replace(/:\s*([^\s{\[\]},]+)(?=\s*[,\]}])/g, ':"$1"') // Add quotes around unquoted values
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim(); // Remove any leading/trailing spaces
          
          parsedContent = JSON.parse(cleanedContent);
        } catch (cleanError) {
          console.error('Error parsing cleaned JSON content:', cleanError);
          throw new Error('Failed to parse cleaned JSON content');
        }
      } else {
        // If no code block, try to parse the entire content as JSON
        try {
          parsedContent = JSON.parse(content);
        } catch (jsonError) {
          console.error('Error parsing raw JSON content:', jsonError);
          
          // Try to find JSON object/array in the content
          const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
          const jsonArrayMatch = content.match(/\[[\s\S]*\]/);
          
          try {
            if (jsonObjectMatch) {
              parsedContent = JSON.parse(jsonObjectMatch[0]);
            } else if (jsonArrayMatch) {
              parsedContent = { schedule: JSON.parse(jsonArrayMatch[0]) };
            } else {
              throw new Error('No valid JSON found in response');
            }
          } catch (fallbackError) {
            console.error('Fallback JSON parsing failed:', fallbackError);
            throw new Error('Failed to parse JSON content after multiple attempts');
          }
        }
      }
    }
    
    if (!parsedContent) {
      console.error('No valid JSON content could be extracted from:', content.substring(0, 500) + '...');
      throw new Error('No valid JSON content could be extracted from the AI response');
    }
  
    // Validate the parsed content
    if (!parsedContent || typeof parsedContent !== 'object') {
      console.error('Invalid content format in response:', parsedContent);
      throw new Error('The AI response did not contain valid content.');
    }
    
    if (!('schedule' in parsedContent) || !Array.isArray(parsedContent.schedule)) {
      console.error('Invalid schedule format in response:', parsedContent);
      throw new Error('The AI response did not contain a valid schedule format.');
    }

    const schedule = parsedContent.schedule;
    
    // Validate each event in the schedule
    const validatedSchedule: ScheduleEvent[] = schedule.map((event: any, index: number) => {
      if (!event || typeof event !== 'object') {
        throw new Error(`Event at index ${index} is not a valid object`);
      }

      const requiredFields = ['title', 'day', 'hour', 'duration', 'type'];
      const missingFields = requiredFields.filter(field => event[field] === undefined);
      
      if (missingFields.length > 0) {
        throw new Error(`Event at index ${index} is missing required fields: ${missingFields.join(', ')}`);
      }

      // Type validation
      if (typeof event.title !== 'string') {
        throw new Error(`Event title at index ${index} must be a string`);
      }
      
      if (typeof event.day !== 'number' || event.day < 0 || event.day > 6) {
        throw new Error(`Event day at index ${index} must be a number between 0 and 6`);
      }
      
      if (typeof event.hour !== 'number' || event.hour < 0 || event.hour > 23.75) {
        throw new Error(`Event hour at index ${index} must be a number between 0 and 23.75`);
      }
      
      if (typeof event.duration !== 'number' || event.duration <= 0) {
        throw new Error(`Event duration at index ${index} must be a positive number`);
      }
      
      const validTypes: EventType[] = ['work', 'meeting', 'deep-work', 'workout', 'meals', 'break', 'personal', 'learning', 'relaxation', 'commute', 'sleep'];
      if (!validTypes.includes(event.type)) {
        throw new Error(`Event type at index ${index} is not valid. Must be one of: ${validTypes.join(', ')}`);
      }
      
      // Create a date object for the event (using a fixed date as the base)
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + event.day);
      eventDate.setHours(Math.floor(event.hour), Math.round((event.hour % 1) * 60), 0, 0);
      
      // Format the time as ISO string
      const startTime = eventDate.toISOString();
      
      // Calculate end time based on duration
      const endDate = new Date(eventDate);
      endDate.setMinutes(endDate.getMinutes() + (event.duration * 60));
      const endTime = endDate.toISOString();
      
      // Return the validated event with startTime and endTime
      return {
        title: event.title,
        day: event.day,
        hour: event.hour,
        duration: event.duration,
        type: event.type as EventType,
        description: event.description || '',
        startTime: startTime,
        endTime: endTime
      };
    });
    return {
      success: true,
      data: validatedSchedule
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error in generateSchedule:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      message: 'Failed to generate schedule. Please try again.'
    };
  }
}
