import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Login } from '@/pages/auth/Login';
import { Signup } from '@/pages/auth/Signup';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { Settings } from '@/pages/settings/Settings';
import TestAuthPage from '@/pages/test-auth';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import "./App.css";
import React from 'react';

// Public layout wrapper - shows the main layout for all routes
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <MainLayout>{children}</MainLayout>
);

// Auth pages wrapper - only shows when user is not authenticated
const AuthPages = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

// Protected route component - handles both loading and auth states
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Store the intended destination before redirecting to login
    return <Navigate to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} replace />;
  }
  
  return <>{children}</>;
};

// Wrapper components for auth pages
function LoginPage() {
  return <Login />;
}

function SignupPage() {
  return <Signup />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <AuthPages>
              <LoginPage />
            </AuthPages>
          } />
          
          <Route path="/signup" element={
            <AuthPages>
              <SignupPage />
            </AuthPages>
          } />
          
          {/* Protected routes */}
          <Route element={
            <ProtectedRoute>
              <PublicLayout>
                <Outlet />
              </PublicLayout>
            </ProtectedRoute>
          }>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/test-auth" element={<TestAuthPage />} />
            
            {/* 404 - Not Found for protected routes */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-[80vh]">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">404</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Page not found</p>
                <button 
                  onClick={() => window.history.back()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            } />
          </Route>
          
          {/* Fallback route for non-existent public routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;