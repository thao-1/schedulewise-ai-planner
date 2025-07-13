import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

// Environment variables configuration
const config = {
  // Server Configuration
  port: parseInt(process.env.VITE_SERVER_PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.VITE_CLIENT_URL || 'http://localhost:8082',
  
  // OpenAI Configuration
  openai: {
    // Get API key from environment variables
    // Always use OPENAI_API_KEY for server-side configuration
    apiKey: (() => {
      const key = process.env.OPENAI_API_KEY;
      if (!key) {
        console.error('❌ OPENAI_API_KEY is not set in your .env file');
        console.error('Please add the following to your .env file:');
        console.error('OPENAI_API_KEY=your_actual_openai_api_key_here');
      } else if (key === 'your_actual_openai_api_key_here') {
        console.error('❌ Please replace the placeholder with your actual OpenAI API key in the .env file');
      }
      return key || '';
    })(),
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10)
  },
  
  // Google OAuth Configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
  },
  
  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    cookieMaxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '86400000', 10), // 24 hours
  },
  
  // CORS Configuration
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // List of allowed origins
      const allowedOrigins = [
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:8082',
        process.env.VITE_CLIENT_URL,
        process.env.CORS_ORIGIN
      ].filter(Boolean) as string[];
      
      // For development, allow any localhost with any port
      if (process.env.NODE_ENV === 'development' && 
          (origin.includes('localhost:') || origin.includes('127.0.0.1:'))) {
        return callback(null, true);
      }
      
      // Check against the list of allowed origins
      if (allowedOrigins.some(allowedOrigin => 
        origin.startsWith(allowedOrigin) || 
        origin === allowedOrigin
      )) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  },
};

// Validate required environment variables
const requiredVars = [
  { key: 'VITE_OPENAI_API_KEY', value: config.openai.apiKey },
  { key: 'GOOGLE_CLIENT_ID', value: config.google.clientId },
  { key: 'GOOGLE_CLIENT_SECRET', value: config.google.clientSecret },
  { key: 'SESSION_SECRET', value: config.session.secret },
];

const missingVars = requiredVars.filter(v => !v.value);
if (missingVars.length > 0) {
  console.error('Error: The following required environment variables are missing:');
  missingVars.forEach(v => console.error(`- ${v.key}`));
  process.exit(1);
}

// Log configuration in development
if (config.nodeEnv === 'development') {
  console.log('Server Configuration:', {
    ...config,
    openai: { ...config.openai, apiKey: '***' },
    google: { ...config.google, clientSecret: '***' },
    session: { ...config.session, secret: '***' },
  });
}

// Export the config object
export { config };

// Export default for backward compatibility
export default config;
