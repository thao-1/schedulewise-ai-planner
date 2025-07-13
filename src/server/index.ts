import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { config } from './config.js';
import scheduleRoutes from './routes/schedule.routes.js';
import { authRoutes } from './routes/auth.routes.js';

declare global {
  namespace Express {
    interface User extends Profile {}
  }
}

const app = express();
const PORT = config.port;

// Middleware
app.use(express.json());

// Handle preflight requests
app.options('*', cors(config.cors));

// Apply CORS middleware
app.use(cors(config.cors));

// Set CORS headers manually for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
  next();
});

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: config.session.cookieMaxAge,
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
}));

// Initialize Passport and session
app.use(passport.initialize());
app.use(passport.session());

// Passport Google OAuth2.0 Strategy
passport.use(new GoogleStrategy(
  {
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackUrl,
    scope: ['profile', 'email'],
  },
  (_accessToken, _refreshToken, profile, done) => {
    // This function is called when a user is authenticated
    // You can save the user to your database here
    return done(null, profile);
  }
));

// Serialize/Deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API Routes
app.use('/api/schedule', scheduleRoutes);
app.use('/api/auth', authRoutes);

// Simple route to check if user is authenticated
app.get('/api/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`CORS enabled for: ${config.cors.origin}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`OpenAI Configured: ${!!config.openai.apiKey}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Consider whether to exit the process here in production
  // process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// For testing purposes
export { app };
