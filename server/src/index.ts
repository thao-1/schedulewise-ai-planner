import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import { serviceAccount } from './config/firebase-admin';

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Firebase admin initialization error', error);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected route example
app.get('/api/protected', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    res.json({ 
      message: 'Protected data', 
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      } 
    });
  } catch (error: unknown) {
    console.error('Error accessing protected route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(403).json({ error: 'Unauthorized', details: errorMessage });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
