
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Onboarding from "./pages/Onboarding";
import AddEvent from "./pages/AddEvent";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { toast } from "sonner";

const queryClient = new QueryClient();

const App = () => {
  const [authChecked, setAuthChecked] = useState(false);
  
  // Check for Google Auth redirects
  useEffect(() => {
    // Handle auth redirect and show appropriate toast
    const handleAuthRedirect = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Check URL for Google auth parameters
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        const hasGoogleParams = params.has('provider') || (hash && hash.includes('access_token'));
        
        console.log('Auth redirect detected:', {
          hasGoogleParams,
          session: !!session,
          hash,
          params: Object.fromEntries(params.entries())
        });
        
        if (hasGoogleParams && session) {
          // Successfully logged in with Google
          toast.success('Successfully connected with Google!');
          console.log('Google auth successful, session:', session);
          
          // Get return path (if any)
          const returnPath = localStorage.getItem('returnPathAfterGoogleAuth') || '/';
          
          // Clean up URL without refreshing the page
          const url = new URL(window.location.href);
          url.search = '';
          url.hash = '';
          window.history.replaceState({}, document.title, url.toString());
          
          // If we're not already on the return path, redirect to it
          if (window.location.pathname !== returnPath) {
            console.log(`Redirecting to saved return path: ${returnPath}`);
            window.location.href = returnPath;
            return;
          }
        } else if (hasGoogleParams && !session) {
          // Failed to login with Google
          toast.error('Google authentication failed', {
            description: 'Please try again or check console for details'
          });
          console.error('Google params detected but no session available');
        }
        
        setAuthChecked(true);
      } catch (error) {
        console.error('Error handling auth redirect:', error);
        setAuthChecked(true);
      }
    };
    
    handleAuthRedirect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="schedule" element={<Schedule />} />
                  <Route path="onboarding" element={<Onboarding />} />
                  <Route path="add-event" element={<AddEvent />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
