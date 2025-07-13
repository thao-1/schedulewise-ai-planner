import { type Request, type Response } from 'express';
import { type Preferences } from '../utils/openai.js';
// Importing fetch for API calls to OpenAI
import fetch from 'node-fetch';

import { type ScheduleEvent, type ScheduleResponse, type EventType } from '../types/ScheduleTypes.js';

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
        error,
        data: []
      });
    }

    try {
      const result = await generateSchedule(preferences, userId);
      
      if (!result.success || !result.data) {
        console.error('Schedule generation failed:', result.error);
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to generate schedule',
          message: result.message,
          data: []
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
        message: 'Failed to generate schedule. Please check your preferences and try again.',
        data: []
      });
    }
    
  } catch (error: any) {
    console.error('Unexpected error in generateScheduleHandler:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
      message: 'Failed to generate schedule. Please try again.',
      data: []
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

    const systemPrompt = `You are an AI scheduler that creates detailed weekly schedules. Follow these steps:

1. FIRST, analyze the user's preferences and plan the schedule structure
2. THEN, create a schedule using the EXACT event types listed below
3. FINALLY, format the response as valid JSON

EVENT TYPES (USE THESE EXACT STRINGS):
- 'work': Regular work tasks
- 'deep-work': Focused work sessions
- 'meeting': Team or client meetings
- 'workout': Exercise time
- 'breakfast': Morning meal
- 'lunch': Midday meal
- 'dinner': Evening meal
- 'break': Short breaks (15-30 min)
- 'personal': Personal errands
- 'learning': Skill development
- 'relaxation': Leisure time
- 'commute': Travel time
- 'sleep': Night sleep

IMPORTANT:
- NEVER use 'other' or 'meals' as event types
- ALWAYS use the exact type strings above
- Include at least 8 different event types
- Format response as valid JSON with double quotes`;

    const currentDate = new Date();
    const userPrompt = `Create a 7-day schedule starting ${currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

PREFERENCES:
- Work Hours: ${preferences.workHours || '9 AM - 5 PM'}
- Deep Work: ${preferences.deepWorkHours || 2}h/day
- Activities: ${preferences.personalActivities?.join(', ') || 'None'}
- Workout: ${preferences.workoutTime || 'Not specified'}
- Meetings: ${preferences.meetingPreference || 'Flexible'}

RULES:
1. For EACH day, include these activities with EXACT types:
   - 3 meals: 'breakfast', 'lunch', 'dinner'
   - Work: 'work' (4-6h) + 'deep-work' (1-2h)
   - Breaks: 'break' (15min every 2h)
   - Exercise: 'workout' (30-60min)
   - Personal: 'personal' or 'learning' or 'relaxation' (1-2h)
   - Sleep: 'sleep' (7-9h)
   - Commute: 'commute' if needed
   - Meetings: 'meeting' as needed

2. NEVER use: 'other' or 'meals'
3. ALWAYS use the exact type strings provided
4. Vary activities to use at least 8 different types per day

SAMPLE DAY (as reference only):
{
  "schedule": [
    {"title":"Morning Routine","day":1,"hour":7,"duration":1,"type":"personal"},
    {"title":"Breakfast","day":1,"hour":8,"duration":0.5,"type":"breakfast"},
    {"title":"Deep Work","day":1,"hour":9,"duration":2,"type":"deep-work"},
    {"title":"Team Standup","day":1,"hour":11,"duration":0.5,"type":"meeting"},
    {"title":"Lunch Break","day":1,"hour":12,"duration":1,"type":"lunch"},
    {"title":"Project Work","day":1,"hour":13,"duration":3,"type":"work"},
    {"title":"Quick Break","day":1,"hour":15,"duration":0.25,"type":"break"},
    {"title":"Gym Session","day":1,"hour":17,"duration":1,"type":"workout"},
    {"title":"Dinner","day":1,"hour":18.5,"duration":0.75,"type":"dinner"},
    {"title":"Reading","day":1,"hour":19.5,"duration":1,"type":"learning"},
    {"title":"Wind Down","day":1,"hour":21,"duration":1,"type":"relaxation"},
    {"title":"Sleep","day":1,"hour":22,"duration":8,"type":"sleep"}
  ]
}

IMPORTANT: Return ONLY valid JSON with the schedule.`;

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
      console.error('Invalid response format from OpenAI:', parsedContent);
      throw new Error('The AI response format is invalid.');
    }

    // Check if we have a schedule array in the response
    if (!('schedule' in parsedContent)) {
      console.error('Missing schedule array in response:', parsedContent);
      throw new Error('The AI response is missing the schedule array.');
    }

    // Ensure the schedule is an array
    if (!Array.isArray(parsedContent.schedule)) {
      console.error('Schedule is not an array:', parsedContent.schedule);
      throw new Error('The schedule format is invalid. Expected an array of events.');
    }

    // Log the number of events received for debugging
    console.log(`Received ${parsedContent.schedule.length} events in the schedule`);

    // Check for required event types
    const requiredTypes = ['work', 'meeting', 'breakfast', 'lunch', 'dinner', 'sleep'];
    const recommendedTypes = ['deep-work', 'workout', 'break', 'personal', 'learning', 'relaxation', 'commute'];
    
    const foundTypes = new Set<string>();
    const allEvents = parsedContent.schedule as ScheduleEvent[];
    
    // Log first few events for debugging
    if (allEvents.length > 0) {
      console.log('First few events:', allEvents.slice(0, 3));
    }
    
    allEvents.forEach((event, index) => {
      if (!event.type) {
        console.error(`Event at index ${index} is missing type:`, event);
      } else {
        foundTypes.add(event.type);
      }
    });

    // Log all found types for debugging
    console.log('Found event types:', Array.from(foundTypes).join(', '));

    // Check for missing required types
    const missingRequiredTypes = requiredTypes.filter(type => !foundTypes.has(type));
    if (missingRequiredTypes.length > 0) {
      console.warn(`Missing required event types: ${missingRequiredTypes.join(', ')}`);
      // Don't throw an error, just log a warning
    }

    // Check for recommended types
    const missingRecommendedTypes = recommendedTypes.filter(type => !foundTypes.has(type));
    if (missingRecommendedTypes.length > 0) {
      console.log(`Consider adding these recommended event types: ${missingRecommendedTypes.join(', ')}`);
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
      
      // Validate hour is a number and within valid range
      if (typeof event.hour !== 'number' || isNaN(event.hour) || event.hour < 0 || event.hour > 23.75) {
        console.error(`Invalid hour value at index ${index}:`, event.hour);
        throw new Error(`Event hour at index ${index} must be a number between 0 and 23.75`);
      }
      
      // Ensure hour is in 15-minute increments (0, 0.25, 0.5, 0.75)
      const minutes = (event.hour % 1) * 60;
      if (minutes % 15 !== 0) {
        console.warn(`Hour value at index ${index} is not in 15-minute increments, rounding:`, event.hour);
        event.hour = Math.round(event.hour * 4) / 4; // Round to nearest 15 minutes
      }
      
      if (typeof event.duration !== 'number' || event.duration <= 0) {
        throw new Error(`Event duration at index ${index} must be a positive number`);
      }
      
      // Use the EventType from ScheduleTypes to ensure type safety
      const validTypes: EventType[] = [
        'work', 'meeting', 'deep-work', 'workout', 'breakfast', 'lunch', 
        'dinner', 'meals', 'break', 'personal', 'learning', 'relaxation', 
        'commute', 'sleep', 'other'
      ];
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
        id: `event-${index}-${Date.now()}`,
        title: event.title || 'Untitled Event',
        day: typeof event.day === 'number' ? event.day : 0,
        hour: typeof event.hour === 'number' ? event.hour : 9,
        duration: typeof event.duration === 'number' ? event.duration : 1,
        type: event.type || 'other',
        description: event.description || '',
        startTime: startTime,
        endTime: endTime
      };
    });

    // Log the final schedule for debugging
    console.log(`Returning ${validatedSchedule.length} validated events`);
    if (validatedSchedule.length > 0) {
      console.log('First validated event:', validatedSchedule[0]);
    }

    // Get unique event types for the response
    const eventTypes = Array.from(new Set(validatedSchedule.map(e => e.type)));
    console.log('Final event types:', eventTypes.join(', '));

    return {
      success: true,
      data: validatedSchedule,
      message: 'Schedule generated successfully',
      eventTypes: eventTypes
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error in generateSchedule:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
      message: 'Failed to generate schedule. Please try again.',
      data: []
    };
  }
}
