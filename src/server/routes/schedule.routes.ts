import { Router, type Request, type Response, type NextFunction } from 'express';
import { generateScheduleHandler } from '../api/generateSchedule.js';

const router = Router();

type AuthenticatedRequest = Request & { user?: Express.User };

// Authentication middleware
const ensureAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Generate a new schedule (protected route)
router.post('/generate', ensureAuthenticated, generateScheduleHandler);

// Get user's schedules (example of a protected route)
router.get('/', ensureAuthenticated, (req: AuthenticatedRequest, res: Response) => {
  // In a real app, you would fetch schedules for the authenticated user
  res.json({ 
    message: 'List of user schedules',
    userId: req.user?.id,
    // Add actual schedule data here
  });
});

export default router;
