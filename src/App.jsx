import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DashboardPage2 from './pages/DashboardV2/DashboardPage2';
import LiveStockReportPage from './pages/Report/LiveStockReportPage';
import GrcReportPage from './pages/Report/GrcReportPage';
import StoreGrcReportPage from './pages/Report/StoreGrcReportPage';
import CycleCountReportPage from './pages/Report/CycleCountReportPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import DevelopmentInProgressPage from './pages/DevelopmentInProgress/DevelopmentInProgressPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/dashboard-2" 
              element={
                <ProtectedRoute>
                  <DashboardPage2 />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/reports/live-stock" 
              element={
                <ProtectedRoute>
                  <LiveStockReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/grc" 
              element={
                <ProtectedRoute>
                  <GrcReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/store-grc" 
              element={
                <ProtectedRoute>
                  <StoreGrcReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/cycle-count" 
              element={
                <ProtectedRoute>
                  <CycleCountReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/stores" 
              element={
                <ProtectedRoute>
                  <DevelopmentInProgressPage title="Store Reports" />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tags" 
              element={
                <ProtectedRoute>
                  <DevelopmentInProgressPage title="Tag Management" />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <DevelopmentInProgressPage title="Settings" />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/" 
              element={<Navigate to="/dashboard" replace />} 
            />
            
            <Route 
              path="*" 
              element={<NotFoundPage />} 
            />
          </Routes>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}