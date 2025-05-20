import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables if available, otherwise fallback to hardcoded values
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xdqfmoouljpyidavrofb.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkcWZtb291bGpweWlkYXZyb2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDc1MTgsImV4cCI6MjA2MDMyMzUxOH0.eHNIlzynvLaD_U7riJ36P0XyNZZfOqvSkPvhGzKIe9E";

// Google OAuth credentials
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "535234825329-h97pbhq5hfjpb8fnpp6e01inuvfnvuk4.apps.googleusercontent.com";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'schedulewise-ai-planner',
    },
  },
});