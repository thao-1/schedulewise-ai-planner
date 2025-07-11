
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Onboarding from "./pages/Onboarding";
import AddEvent from "./pages/AddEvent";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const queryClient = new QueryClient();

const App = () => {
  const [authChecked, setAuthChecked] = useState(true); // Set to true by default since we're not using auth for now
  
  // Check for Google Auth redirects
  useEffect(() => {
    // Handle auth redirect and show appropriate toast
    const handleAuthRedirect = async () => {
      try {
        // Check URL for Google auth parameters
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        const hasGoogleParams = params.has('provider') || (hash && hash.includes('access_token'));
        
        console.log('Auth redirect detected:', {
          hasGoogleParams,
          hash,
          params: Object.fromEntries(params.entries())
        });
        
        if (hasGoogleParams) {
          // Successfully logged in with Google
          toast.success('Successfully connected with Google!');
          console.log('Google auth successful');
          
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
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
