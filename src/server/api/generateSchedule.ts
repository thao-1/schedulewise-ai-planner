import { type Request, type Response } from 'express';
import { type Preferences } from '../utils/openai.js';
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

// Fallback schedule generator in case AI fails
function generateFallbackSchedule(preferences: Preferences): ScheduleEvent[] {
  console.log('Generating fallback schedule...');
  
  const fallbackSchedule: ScheduleEvent[] = [];
  const workStartHour = preferences.workHours?.includes('9') ? 9 : 8;
  const workEndHour = preferences.workHours?.includes('5') ? 17 : 18;
  
  // Generate schedule for each day (0 = Sunday, 1 = Monday, etc.)
  for (let day = 0; day < 7; day++) {
    const isWeekend = day === 0 || day === 6;
    let eventId = 0;
    
    // Morning routine
    fallbackSchedule.push({
      id: `fallback-${day}-${eventId++}`,
      title: 'Morning Routine',
      day,
      hour: 7,
      duration: 1,
      type: 'personal',
      description: 'Wake up and morning preparation',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    });
    
    // Breakfast
    fallbackSchedule.push({
      id: `fallback-${day}-${eventId++}`,
      title: 'Breakfast',
      day,
      hour: 8,
      duration: 0.5,
      type: 'meals',
      description: 'Morning meal',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    });
    
    if (!isWeekend) {
      // Work day schedule
      fallbackSchedule.push({
        id: `fallback-${day}-${eventId++}`,
        title: 'Morning Deep Work',
        day,
        hour: workStartHour,
        duration: 2,
        type: 'work',
        description: 'Focused work session',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      });
      
      fallbackSchedule.push({
        id: `fallback-${day}-${eventId++}`,
        title: 'Team Meeting',
        day,
        hour: workStartHour + 2,
        duration: 1,
        type: 'meeting',
        description: 'Team collaboration',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      });
      
      fallbackSchedule.push({
        id: `fallback-${day}-${eventId++}`,
        title: 'Break',
        day,
        hour: workStartHour + 3,
        duration: 0.25,
        type: 'personal',
        description: 'Short break',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      });
      
      fallbackSchedule.push({
        id: `fallback-${day}-${eventId++}`,
        title: 'Project Work',
        day,
        hour: workStartHour + 3.25,
        duration: 2.75,
        type: 'work',
        description: 'Regular work tasks',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      });
    } else {
      // Weekend schedule
      fallbackSchedule.push({
        id: `fallback-${day}-${eventId++}`,
        title: 'Weekend Learning',
        day,
        hour: 9,
        duration: 2,
        type: 'work',
        description: 'Skill development',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      });
      
      fallbackSchedule.push({
        id: `fallback-${day}-${eventId++}`,
        title: 'Personal Projects',
        day,
        hour: 11,
        duration: 2,
        type: 'personal',
        description: 'Personal tasks and errands',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      });
    }
    
    // Universal daily activities
    fallbackSchedule.push({
      id: `fallback-${day}-${eventId++}`,
      title: 'Lunch',
      day,
      hour: 12,
      duration: 1,
      type: 'meals',
      description: 'Midday meal',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    });
    
    fallbackSchedule.push({
      id: `fallback-${day}-${eventId++}`,
      title: 'Workout',
      day,
      hour: preferences.workoutTime?.includes('morning') ? 7 : 17,
      duration: 1,
      type: 'workout',
      description: 'Exercise session',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    });
    
    fallbackSchedule.push({
      id: `fallback-${day}-${eventId++}`,
      title: 'Dinner',
      day,
      hour: 18,
      duration: 1,
      type: 'meals',
      description: 'Evening meal',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    });
    
    fallbackSchedule.push({
      id: `fallback-${day}-${eventId++}`,
      title: 'Evening Relaxation',
      day,
      hour: 19,
      duration: 2,
      type: 'personal',
      description: 'Wind down time',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    });
    
    fallbackSchedule.push({
      id: `fallback-${day}-${eventId++}`,
      title: 'Sleep',
      day,
      hour: 22,
      duration: 8,
      type: 'sleep',
      description: 'Night rest',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    });
  }
  
  return fallbackSchedule;
}

// Improved JSON parsing with multiple fallback strategies
function parseAIResponse(content: string): any {
  console.log('Attempting to parse AI response...');
  console.log('Raw content length:', content.length);
  console.log('First 200 chars:', content.substring(0, 200));
  
  // Strategy 1: Direct JSON parse
  try {
    const parsed = JSON.parse(content);
    console.log('✓ Direct JSON parse successful');
    return parsed;
  } catch (error) {
    console.log('✗ Direct JSON parse failed:', error instanceof Error ? error.message : String(error));
  }
  
  // Strategy 2: Extract JSON from code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1]);
      console.log('✓ Code block extraction successful');
      return parsed;
    } catch (error) {
      console.log('✗ Code block extraction failed:', error instanceof Error ? error.message : String(error));
    }
  }
  
  // Strategy 3: Find JSON object boundaries
  const jsonStart = content.indexOf('{');
  const jsonEnd = content.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    try {
      const jsonString = content.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonString);
      console.log('✓ JSON boundary extraction successful');
      return parsed;
    } catch (error) {
      console.log('✗ JSON boundary extraction failed:', error instanceof Error ? error.message : String(error));
    }
  }
  
  // Strategy 4: Clean and fix common JSON issues
  try {
    let cleanContent = content
      .replace(/```json\s*|\s*```/g, '') // Remove code blocks
      .replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, '') // Trim whitespace
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Quote keys
      .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes
      .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
      .replace(/\n\s*/g, ' ') // Remove newlines
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    const parsed = JSON.parse(cleanContent);
    console.log('✓ JSON cleaning successful');
    return parsed;
  } catch (error) {
    console.log('✗ JSON cleaning failed:', error instanceof Error ? error.message : String(error));
  }
  
  // Strategy 5: Extract just the schedule array
  const scheduleMatch = content.match(/"schedule"\s*:\s*(\[[\s\S]*?\])/);
  if (scheduleMatch) {
    try {
      const scheduleArray = JSON.parse(scheduleMatch[1]);
      console.log('✓ Schedule array extraction successful');
      return { schedule: scheduleArray };
    } catch (error) {
      console.log('✗ Schedule array extraction failed:', error instanceof Error ? error.message : String(error));
    }
  }
  
  throw new Error('All JSON parsing strategies failed');
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
 * Generate a weekly schedule using OpenAI's API
 */
async function generateSchedule(preferences: Preferences, userId: string = 'anonymous'): Promise<ScheduleResponse> {
  console.log(`Generating schedule for user ${userId}`);
  
  // Validate preferences
  if (!preferences) {
    const error = 'Preferences are required to generate a schedule';
    console.error(error);
    return {
      success: false,
      error,
      message: 'Please provide your preferences to generate a schedule',
      data: []
    };
  }
  
  // Create system prompt
  const systemPrompt = `You are an AI scheduling assistant. Your task is to create a detailed 7-day schedule as a JSON object.

  Strict Rules:
  1.  JSON Output Only: The entire response must be a single, valid JSON object. Do not include any text, explanations, or code blocks before or after the JSON.
  2.  Schedule Array: The JSON object must contain a single key, "schedule", which is an array of event objects.
  3.  Event Object Structure: Each event object in the "schedule" array must have the following properties:
      - title: A string describing the event.
      - day: An integer from 0 (Sunday) to 6 (Saturday).
      - hour: A number from 0 to 23 representing the start hour.
      - duration: A number in hours (e.g., 1.5 for 90 minutes).
      - type: A string that must be one of the following exact values: 'work', 'meeting', 'personal', 'workout', 'sleep', 'breakfast', 'lunch', 'dinner', 'deep-work', 'learning', 'relaxation'.
      - description: A brief string describing the event.
  4.  Event Type Enforcement:
      - For all meals, use the specific types: 'breakfast', 'lunch', or 'dinner'.
      - Do not use the generic 'meals' type.
      - Do not create any new event types. Only use the types listed above.
  5.  Schedule Content:
      - Generate 8-12 events per day.
      - Create a balanced schedule that includes work, personal time, meals, and breaks.
      - Ensure there are no overlapping events.`;
  
  // Create user prompt with preferences
  // Handle optional properties with defaults
  const workHours = preferences.workHours || '9 AM - 5 PM';
  const workoutTime = preferences.workoutTime || 'evening';
  const meetingPreference = preferences.meetingPreference || 'afternoons';
  const personalActivities = Array.isArray(preferences.personalActivities) 
    ? preferences.personalActivities.join(', ')
    : 'reading, hobbies';
  
  const userPrompt = `Create a weekly schedule with these preferences:
  - Work hours: ${workHours}
  - Workout time: ${workoutTime}
  - Meeting preference: ${meetingPreference}
  - Personal activities: ${personalActivities}
  
  Return ONLY a valid JSON object with a 'schedule' array of events.`;
  
  try {
    console.log('Sending request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 4000, // Increased to ensure complete response
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = `OpenAI API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`;
      console.error(errorMessage);
      
      // Return fallback schedule on API error
      console.log('Using fallback schedule due to API error');
      const fallbackSchedule = generateFallbackSchedule(preferences);
      return {
        success: true,
        message: 'Generated fallback schedule due to API error',
        data: fallbackSchedule
      };
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response from OpenAI API');
    }
    
    console.log('Received response from OpenAI API');
    console.log('Response length:', content.length);
    
    // Parse the AI response with multiple fallback strategies
    let parsedResponse;
    try {
      parsedResponse = parseAIResponse(content);
      console.log('Successfully parsed AI response');
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Using fallback schedule due to parsing error');
      const fallbackSchedule = generateFallbackSchedule(preferences);
      return {
        success: true,
        message: 'Generated fallback schedule due to parsing error',
        data: fallbackSchedule
      };
    }
    
    // Extract schedule from parsed response
    const schedule = Array.isArray(parsedResponse?.schedule) ? parsedResponse.schedule : [];
    
    if (schedule.length === 0) {
      console.log('No schedule found in response, using fallback');
      const fallbackSchedule = generateFallbackSchedule(preferences);
      return {
        success: true,
        message: 'Generated fallback schedule (no valid schedule in response)',
        data: fallbackSchedule
      };
    }
    
    // Type guard to check if an object is a valid event
    const isValidEvent = (obj: any): obj is Partial<ScheduleEvent> => {
      return obj && typeof obj === 'object';
    };
    
    // Validate and normalize schedule events
    const validatedEvents: ScheduleEvent[] = [];
    const seenIds = new Set<string>();
    
    for (const rawEvent of schedule) {
      // Skip invalid events
      if (!isValidEvent(rawEvent)) continue;
      
      try {
        // At this point, rawEvent is guaranteed to be an object due to the type guard
        
        // Helper function to safely parse string or number to number with default
        const parseNumber = (value: unknown, defaultValue: number): number => {
          if (value === undefined || value === null) return defaultValue;
          if (typeof value === 'number') return value;
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') return defaultValue;
            const parsed = Number(trimmed);
            return isNaN(parsed) ? defaultValue : parsed;
          }
          return defaultValue;
        };
        
        // Helper function to safely get a string property with a default value
        const getString = (obj: any, prop: string, defaultValue: string): string => {
          const value = obj?.[prop];
          return typeof value === 'string' ? value.trim() : defaultValue;
        };
        
        // Normalize event data with proper type handling
        const rawType = rawEvent?.type;
        const eventType: EventType = (typeof rawType === 'string' && rawType.trim() !== '')
          ? rawType.trim().toLowerCase() as EventType
          : 'personal';
          
        // Safely extract and convert day, hour, and duration with proper type checking
        const dayValue = rawEvent?.day !== undefined ? parseNumber(rawEvent.day, 0) : 0;
        const hourValue = rawEvent?.hour !== undefined ? parseNumber(rawEvent.hour, 9) : 9;
        const durationValue = rawEvent?.duration !== undefined ? parseNumber(rawEvent.duration, 1) : 1;
        
        const eventDay = Math.min(6, Math.max(0, dayValue)); // Clamp to 0-6
        const eventHour = Math.min(23, Math.max(0, hourValue)); // Clamp to 0-23
        const eventDuration = Math.max(0.25, Math.min(24, durationValue)); // Clamp to 0.25-24
        
        // Ensure title and description are strings with proper type checking
        const eventTitle = getString(rawEvent, 'title', 'Untitled Event');
        const eventDescription = getString(rawEvent, 'description', '');
        
        const now = new Date();
        const today = now.getDay();
        const dayOffset = eventDay - today;
        
        const startDate = new Date(now.setDate(now.getDate() + dayOffset));
        startDate.setHours(eventHour, (eventHour % 1) * 60, 0, 0);

        const endDate = new Date(startDate.getTime() + eventDuration * 60 * 60 * 1000);

        let eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Ensure unique ID
        while (seenIds.has(eventId)) {
          eventId = `${eventId}-${Math.random().toString(36).substr(2, 4)}`;
        }
        seenIds.add(eventId);

        const normalizedEvent: ScheduleEvent = {
          id: eventId,
          title: eventTitle,
          day: eventDay,
          hour: eventHour,
          duration: eventDuration,
          type: eventType,
          description: eventDescription,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString()
        };
        
        validatedEvents.push(normalizedEvent);
      } catch (error) {
        console.warn('Skipping invalid event:', event, error);
      }
    }
    
    if (validatedEvents.length === 0) {
      console.log('No valid events after validation, using fallback');
      const fallbackSchedule = generateFallbackSchedule(preferences);
      return {
        success: true,
        message: 'Generated fallback schedule (no valid events after validation)',
        data: fallbackSchedule
      };
    }
    
    console.log(`Successfully generated ${validatedEvents.length} schedule events`);
    return {
      success: true,
      message: 'Successfully generated schedule',
      data: validatedEvents
    };
    
  } catch (error) {
    console.error('Error in generateSchedule:', error);
    
    // Return fallback schedule on any error
    console.log('Using fallback schedule due to error');
    const fallbackSchedule = generateFallbackSchedule(preferences);
    return {
      success: true,
      message: 'Generated fallback schedule due to error',
      data: fallbackSchedule
    };
  }
}


