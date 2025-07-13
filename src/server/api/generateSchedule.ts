// API function to generate a schedule
import { type Request, type Response } from 'express';
import { type Preferences } from '../utils/openai.js';
import openai from '../utils/openai.js';

type AuthenticatedRequest = Request & { 
  isAuthenticated: () => boolean;
  user?: {
    id: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
  };
};

export const generateScheduleHandler = async (
  req: AuthenticatedRequest, 
  res: Response
) => {
  try {
    // Check authentication
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authenticated' 
      });
    }

    const { preferences } = req.body as { preferences: Preferences };
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in session'
      });
    }

    if (!preferences) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing preferences in request body' 
      });
    }

    console.log('Generating schedule with preferences:', JSON.stringify(preferences, null, 2));
    
    // Generate schedule with user context
    const schedule = await openai.generateSchedule({
      ...preferences,
      userId,
      userName: req.user?.displayName,
      userEmail: req.user?.emails?.[0]?.value
    });
    
    // In a real app, you might want to save the generated schedule to a database here
    // await saveUserSchedule(userId, schedule);
    
    // Return the schedule directly as an array to match frontend expectations
    res.json(schedule);
    
  } catch (error: any) {
    console.error('Error generating schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to generate schedule. Please try again.'
    });
  }
};