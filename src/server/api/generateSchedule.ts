import { type Request, type Response } from 'express';
import { type Preferences } from '../utils/openai.js';
import ScheduleService from '../services/schedule.service';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type AuthenticatedRequest = Request & { 
  isAuthenticated: () => boolean;
  user?: {
    id: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
  };
};

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
    
    // Log user info for debugging
    console.log('User info:', { userId, userName, isAuthenticated });
    
    console.log('Processing schedule generation request', {
      isAuthenticated,
      userId,
      userName
    });

    if (!preferences) {
      const error = 'Missing preferences in request body';
      console.error(error);
      return res.status(400).json({ 
        success: false, 
        error
      });
    }

    try {
      console.log('Starting schedule generation with preferences:', JSON.stringify(preferences, null, 2));
      
      // Get user ID from the request
      const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
      const user = isAuthenticated ? req.user : null;
      const userId = user?.id || 'anonymous';
      
      console.log('Generating schedule for user:', userId);
      
      const result = await generateSchedule(preferences, userId);
      
      if (!result.success || !result.data) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Failed to generate schedule',
          message: result.message
        });
      }
      
      console.log(`Successfully generated ${result.data.length} schedule events`);
      
      // Return the schedule data
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
 * @param userId - ID of the user generating the schedule
 * @returns Generated schedule or error object
 */
async function generateSchedule(preferences: Preferences, userId: string = 'anonymous'): Promise<ScheduleResponse> {
  try {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured. Please check your environment variables.');
    }
    
    // Add validation for preferences
    if (!preferences) {
      throw new Error('Preferences are required');
    }

    console.log("Sending request to OpenAI with preferences:", JSON.stringify(preferences, null, 2));
    console.log("OpenAI API Key exists:", !!OPENAI_API_KEY);
    console.log('Sending request to OpenAI API with model: gpt-4-turbo-preview');

    const systemPrompt = `You are an AI scheduler specialized in creating realistic weekly work schedules. 

    USER PREFERENCES:
    - Work Hours: ${preferences.workHours}
    - Deep Work Hours: ${preferences.deepWorkHours} hours per day
    - Personal Activities: ${preferences.personalActivities?.join(', ') || 'None'}
    - Workout Time: ${preferences.workoutTime || 'Not specified'}
    - Meeting Preference: ${preferences.meetingPreference}
    - Meetings Per Day: ${preferences.meetingsPerDay || 'Not specified'}
    - Additional Preferences: ${preferences.customPreferences || 'None'}

    RESPONSE FORMAT REQUIREMENTS:
    - Return ONLY a valid JSON object with a 'schedule' array
    - Each event must have these exact properties:
      * title: string (descriptive name)
      * day: number (1=Monday, 2=Tuesday, ..., 7=Sunday)
      * hour: number (0-23, can be decimal like 7.5 for 7:30)
      * duration: number (in hours, can be decimal like 1.5 for 90 minutes)
      * type: one of: work, meeting, deep-work, workout, meals, break, personal, learning, relaxation, commute, sleep
      * description: string (optional)

    EXAMPLE RESPONSE:
    {
      "schedule": [
        {
          "day": 1,
          "hour": 8,
          "duration": 1,
          "title": "Morning Standup",
          "type": "meeting",
          "description": "Daily team sync"
        },
        {
          "day": 1,
          "hour": 9,
          "duration": 2.5,
          "title": "Deep Work",
          "type": "deep-work",
          "description": "Focus on project tasks"
        }
      ]
    }`;

    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Generate a weekly schedule based on these preferences: ${JSON.stringify(preferences, null, 2)}`
            }
          ],
          temperature: 0.2,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenAI API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        });
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('OpenAI API response received');
      
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error('No content in OpenAI response:', JSON.stringify(data, null, 2));
        throw new Error('No content in OpenAI response');
      }
      
      console.log('Raw OpenAI response content:', content);
      
      // Parse the response content
      let parsedContent;
      try {
        // First, try to parse the content directly
        parsedContent = JSON.parse(content);
        console.log('Successfully parsed OpenAI response');
      } catch (e) {
        console.error('Initial parse failed, trying to clean the response');
        
        // If direct parse fails, try to extract JSON from the response
        try {
          // Try to find the first { and last } in the content
          const firstBrace = content.indexOf('{');
          const lastBrace = content.lastIndexOf('}');
          
          if (firstBrace >= 0 && lastBrace > firstBrace) {
            const jsonString = content.substring(firstBrace, lastBrace + 1);
            console.log('Extracted JSON string:', jsonString);
            
            // Try to fix common JSON issues
            let fixedJson = jsonString
              .replace(/([}"\w])\s*\n\s*([{"\w-])/g, '$1,\n$2')  // Add missing commas
              .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')  // Add missing quotes
              .replace(/'/g, '"')  // Replace single quotes with double quotes
              .replace(/,\s*([}\]])/g, '$1');  // Remove trailing commas
            
            console.log('Attempting to parse fixed JSON...');
            parsedContent = JSON.parse(fixedJson);
            console.log('Successfully parsed after fixing JSON');
          } else {
            throw new Error('No valid JSON object found in response');
          }
        } catch (parseError) {
          console.error('Failed to parse response after cleaning:', parseError);
          
          // Try to find the problematic line in the content
          if (parseError instanceof SyntaxError && 'position' in parseError) {
            const position = (parseError as any).position;
            if (typeof position === 'number') {
              const start = Math.max(0, position - 50);
              const end = Math.min(content.length, position + 50);
              const context = content.substring(start, end);
              console.error(`JSON parse error near: ...${context}...`);
            }
          }
          
          // As a last resort, try to find and extract just the schedule array
          try {
            const scheduleMatch = content.match(/"schedule"\s*:\s*(\[.*?\])/s);
            if (scheduleMatch && scheduleMatch[1]) {
              console.log('Attempting to extract just the schedule array...');
              parsedContent = { schedule: JSON.parse(scheduleMatch[1]) };
              console.log('Successfully extracted schedule array');
            } else {
              throw new Error('Could not extract schedule array from response');
            }
          } catch (e) {
            console.error('Failed to extract schedule array:', e);
            throw new Error('AI response could not be parsed as valid JSON');
          }
        }
      }
      
      // Extract the schedule array from the response
      const schedule = parsedContent?.schedule;
      
      if (!Array.isArray(schedule)) {
        console.error('Invalid schedule format in response:', parsedContent);
        throw new Error('Invalid schedule format in response');
      }
      
      console.log(`Successfully parsed ${schedule.length} schedule events`);
      
      // Validate and normalize the schedule data
      const validatedSchedule = schedule.map((event: any) => ({
        title: event.title || 'Untitled',
        day: typeof event.day === 'number' ? event.day : 1,
        hour: typeof event.hour === 'number' ? event.hour : 9,
        duration: typeof event.duration === 'number' ? event.duration : 1,
        type: [
          'work', 'meeting', 'deep-work', 'workout', 'meals', 
          'break', 'personal', 'learning', 'relaxation', 'commute', 'sleep'
        ].includes(event.type) ? event.type : 'work',
        description: event.description || ''
      }));
      
      // Log the validated schedule
      console.log('Generated schedule:', JSON.stringify(validatedSchedule, null, 2));
      
      try {
        // Save the generated schedule to the database
        const savedSchedule = await ScheduleService.saveGeneratedSchedule(
          userId,
          validatedSchedule,
          preferences,
          'Generated Schedule - ' + new Date().toLocaleDateString()
        );
        
        console.log('Schedule saved to database with ID:', savedSchedule._id);
        
        return {
          success: true,
          data: validatedSchedule
        };
      } catch (dbError) {
        console.error('Error saving schedule to database:', dbError);
        // Even if database save fails, still return the generated schedule
        return {
          success: true,
          data: validatedSchedule,
          message: 'Schedule generated but not saved to database',
          error: dbError instanceof Error ? dbError.message : 'Unknown database error'
        };
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in generateSchedule:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to generate schedule. Please check your preferences and try again.'
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Unexpected error in generateSchedule:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      message: 'Failed to generate schedule due to an unexpected error.'
    };
  }
}