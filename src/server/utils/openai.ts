import OpenAI from 'openai';
import { config } from '../config.js';

// Validate API key on startup
if (!config.openai.apiKey) {
  console.error('❌ OPENAI_API_KEY is not configured. Please set it in your .env file');
  process.exit(1);
}

if (!config.openai.apiKey.startsWith('sk-')) {
  console.error('❌ Invalid OpenAI API key format. It should start with "sk-"');
  process.exit(1);
}

// Custom fetch with timeout
const fetchWithTimeout = async (url: string, options: any) => {
  const { timeout = 60000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  timeout: 60000,
  fetch: fetchWithTimeout as any,
});

console.log('✅ OpenAI client initialized with model:', config.openai.model);

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  day: number;
  type: 'work' | 'break' | 'meeting' | 'personal' | 'workout' | 'meal' | 'sleep' | 'other';
  priority: 'high' | 'medium' | 'low';
  isRecurring: boolean;
  duration: number;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
    daysOfWeek?: number[];
  };
}

export interface Preferences {
  workHours: string;
  deepWorkHours: string;
  personalActivities: string[];
  workoutTime?: string;
  meetingPreference?: string;
  meetingsPerDay?: number | string;
  autoReschedule?: boolean;
  customPreferences?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export async function generateSchedule(preferences: Preferences): Promise<ScheduleEvent[]> {
  const requestId = Math.random().toString(36).substring(2, 8);
  const startTime = Date.now();
  
  console.log(`[${requestId}] Starting schedule generation at ${new Date().toISOString()}`);
  console.log(`[${requestId}] Using model: ${config.openai.model}`);

  try {
    // Enhanced system prompt with strict JSON format
    const systemPrompt = `You are an AI scheduler. Return ONLY a valid JSON object with this exact structure:
    
    {
      "schedule": [
        {
          "day": 0-6,  // 0=Sunday, 1=Monday, etc.
          "title": "string",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "type": "work|break|meeting|personal|workout|meal|sleep|other",
          "description": "string",  // optional
          "isRecurring": boolean,   // optional
          "priority": "high|medium|low"  // optional
        }
      ]
    }
    
    Important:
    - Only include the JSON object, no other text
    - Times must be in 24-hour format (e.g., "14:30")
    - All fields except description, isRecurring, and priority are required`;

    // Build user context
    const userContext = [];
    if (preferences.userName) userContext.push(`Name: ${preferences.userName}`);
    if (preferences.userEmail) userContext.push(`Email: ${preferences.userEmail}`);
    
    // Structured user prompt
    const userPrompt = `Create a weekly schedule with these preferences:
${userContext.length > 0 ? userContext.join('\n') + '\n' : ''}
Preferences:
- Work hours: ${preferences.workHours || 'Not specified'}
- Deep work: ${preferences.deepWorkHours || 'Not specified'}
- Activities: ${preferences.personalActivities?.join(', ') || 'None'}
- Workout: ${preferences.workoutTime || 'Not specified'}
- Meetings: ${preferences.meetingPreference || 'Not specified'}
${preferences.customPreferences ? `- Notes: ${preferences.customPreferences}` : ''}

IMPORTANT: Return ONLY a valid JSON object with the schedule.`;

    console.log(`[${requestId}] Sending request to OpenAI...`);
    
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2, // Lower for more consistent results
      max_tokens: 1500, // Slightly higher to ensure complete response
      top_p: 0.95, // Better response quality
      frequency_penalty: 0.1, // Reduce repetition
      presence_penalty: 0.1 // Encourage topic diversity
    });

    const endTime = Date.now();
    console.log(`[${requestId}] Received response in ${(endTime - startTime) / 1000}s`);

    // Parse and validate the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error(`[${requestId}] Empty response from OpenAI`);
      throw new Error('No content in response');
    }

    // Log the raw response for debugging
    console.log(`[${requestId}] Raw response:`, content.substring(0, 500) + (content.length > 500 ? '...' : ''));

    let parsedResponse;
    try {
      // Try to parse the response
      const jsonString = content.trim().replace(/^```json\n|```$/g, '');
      parsedResponse = JSON.parse(jsonString);
      
      // Validate the response structure
      if (!parsedResponse.schedule || !Array.isArray(parsedResponse.schedule)) {
        throw new Error('Response missing required schedule array');
      }
    } catch (err) {
      const error = err as Error;
      console.error(`[${requestId}] Failed to parse response. Error:`, error.message);
      console.error(`[${requestId}] Response content:`, content);
      throw new Error(`Invalid response format from AI: ${error.message}`);
    }

    // Validate and transform the schedule
    if (!parsedResponse.schedule || !Array.isArray(parsedResponse.schedule)) {
      console.error(`[${requestId}] Invalid schedule format:`, parsedResponse);
      throw new Error('Invalid schedule format in response');
    }

    const schedule = parsedResponse.schedule.map((event: any, index: number) => ({
      id: `event-${index}-${Date.now()}`,
      title: event.title || 'Untitled Event',
      description: event.description || '',
      startTime: event.startTime || '09:00',
      endTime: event.endTime || '10:00',
      day: typeof event.day === 'number' ? Math.max(0, Math.min(6, event.day)) : 0,
      type: ['work', 'break', 'meeting', 'personal', 'workout', 'meal', 'sleep', 'other'].includes(event.type)
        ? event.type
        : 'other',
      priority: ['high', 'medium', 'low'].includes(event.priority) ? event.priority : 'medium',
      isRecurring: Boolean(event.isRecurring),
      duration: typeof event.duration === 'number' ? Math.max(1, event.duration) : 60,
      recurringPattern: event.recurringPattern
    }));

    console.log(`[${requestId}] Generated ${schedule.length} schedule events`);
    return schedule;

  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error.message);
    
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      throw new Error('Request timed out. Please try again.');
    } else if (error.code === 'ENOTFOUND' || error.message.includes('getaddrinfo')) {
      throw new Error('Could not connect to OpenAI API. Check your internet connection.');
    } else if (error.status === 401) {
      throw new Error('Invalid API key. Please check your OpenAI API key.');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    } else {
      throw new Error(`Failed to generate schedule: ${error.message}`);
    }
  }
}

export default {
  generateSchedule
};
