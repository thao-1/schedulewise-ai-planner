import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './dashboard';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { Settings } from './pages/settings/Settings';
import "./App.css";

// This would be replaced with actual auth check
const isAuthenticated = true;

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" />} />
        
        {/* Protected routes */}
        <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          {/* Add more protected routes here */}
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
