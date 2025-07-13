import { Router, type Request, type Response, type NextFunction } from 'express';
import passport from 'passport';
import { config } from '../config.js';

type AuthenticatedRequest = Request & { user?: Express.User };

const router = Router();

// Google OAuth login route
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account',
}));

// Google OAuth callback route
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${config.clientUrl}/login?error=auth_failed`,
    successRedirect: `${config.clientUrl}/dashboard`,
  })
);

// Logout route
router.get('/logout', (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect(config.clientUrl);
  });
});

// Check authentication status
router.get('/status', (req: AuthenticatedRequest, res: Response) => {
  res.json({ 
    isAuthenticated: req.isAuthenticated(),
    user: req.user || null,
  });
});

export const authRoutes = router;
