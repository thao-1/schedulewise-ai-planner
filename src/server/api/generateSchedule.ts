// API function to generate a schedule
import { type Request, type Response } from 'express';
import openai, { type Preferences } from '../utils/openai.js';

interface SchedulePreferences {
  // Define the structure of preferences based on your frontend
  [key: string]: any;
  // Add user context to preferences
  userId?: string;
  userName?: string;
  userEmail?: string;
}

type AuthenticatedRequest = Request & { 
  user?: {
    id?: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
    // Add other user properties as needed
  };
};

export const generateScheduleHandler = async (
  req: AuthenticatedRequest, 
  res: Response
) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { preferences } = req.body as { preferences: SchedulePreferences };
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!preferences) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing preferences in request body' 
      });
    }

    console.log('Generating schedule with preferences:', JSON.stringify(preferences, null, 2));
    
    // Include user context in the preferences
    const schedule = await openai.generateSchedule({
      ...preferences,
      userId,
      userName: req.user?.displayName || 'User',
      userEmail: req.user?.emails?.[0]?.value
    } as Preferences);
    
    // In a real app, you might want to save the generated schedule to a database here
    // await saveUserSchedule(userId, schedule);
    
    res.json({
      success: true,
      schedule,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Error generating schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to generate schedule. Please try again.'
    });
  }
};