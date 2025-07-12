import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

type Analytics = any;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;
let analyticsInitialized = false;

const initAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window === 'undefined' || analyticsInitialized) {
    return analytics;
  }

  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    
    const isAnalyticsSupported = await isSupported();
    if (isAnalyticsSupported) {
      analytics = getAnalytics(app);
      analyticsInitialized = true;
    }
  } catch (error) {
    console.warn('Firebase Analytics could not be loaded:', error);
  }
  
  return analytics;
};

// Initialize analytics automatically in non-blocking way
if (typeof window !== 'undefined') {
  initAnalytics().catch(error => 
    console.error('Error initializing analytics:', error)
  );
}

export { auth, analytics, initAnalytics };
export default app;
