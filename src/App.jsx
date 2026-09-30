import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import DashboardOldPage from './pages/DashboardOld/DashboardOldPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import LiveStockReportPage from './pages/Report/LiveStockReportPage';
import GrcReportPage from './pages/Report/GrcReportPage';
import StoreGrcReportPage from './pages/Report/StoreGrcReportPage';
import CycleCountReportPage from './pages/Report/CycleCountReportPage';
import StoreSaleReportPage from './pages/Report/StoreSaleReportPage';
import TotalDposSalePage from './pages/Report/TotalDposSalePage';
import VoidDetailsReportPage from './pages/Report/VoidDetailsReportPage';
import VoidReconciliationReportPage from './pages/Report/VoidReconciliationReportPage';
import ReturnDetailsReportPage from './pages/Report/ReturnDetailsReportPage';
import ReturnReconciliationReportPage from './pages/Report/ReturnReconciliationReportPage';
import DcReportPage from './pages/Report/DcReportPage';
import HuReportPage from './pages/Report/HuReportPage';
import AllocatedStoreReportPage from './pages/Report/AllocatedStoreReportPage';
import WHEncodingSummaryPage from './pages/Report/WHEncodingSummaryPage';
import HuSummaryReportPage from './pages/Report/HuSummaryReportPage';
import TagInventoryDistributionPage from './pages/Report/TagInventoryDistributionPage';
import VendorDiscrepancySummaryPage from './pages/Report/VendorDiscrepancySummaryPage';
import StoreCounterStatusPage from './pages/Store/StoreCounterStatusPage';
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
              path="/dashboard-old" 
              element={
                <ProtectedRoute>
                  <DashboardOldPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
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
              path="/reports/store-sale" 
              element={
                <ProtectedRoute>
                  <StoreSaleReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/sale" 
              element={
                <ProtectedRoute>
                  <TotalDposSalePage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/void-details" 
              element={
                <ProtectedRoute>
                  <VoidDetailsReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/void-reconciliation" 
              element={
                <ProtectedRoute>
                  <VoidReconciliationReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/return-details" 
              element={
                <ProtectedRoute>
                  <ReturnDetailsReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/return-reconciliation" 
              element={
                <ProtectedRoute>
                  <ReturnReconciliationReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/dc-report" 
              element={
                <ProtectedRoute>
                  <DcReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/hu-report" 
              element={
                <ProtectedRoute>
                  <HuReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/allocated-store-report" 
              element={
                <ProtectedRoute>
                  <AllocatedStoreReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/encoding-store-report" 
              element={<Navigate to="/reports/allocated-store-report" replace />} 
            />

            <Route 
              path="/reports/dc-encoding-summary" 
              element={
                <ProtectedRoute>
                  <WHEncodingSummaryPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/hu-summary" 
              element={
                <ProtectedRoute>
                  <HuSummaryReportPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tag-management/distribution" 
              element={
                <ProtectedRoute>
                  <TagInventoryDistributionPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/tag-distribution" 
              element={
                <ProtectedRoute>
                  <TagInventoryDistributionPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/vendor-discrepancy-summary" 
              element={
                <ProtectedRoute>
                  <VendorDiscrepancySummaryPage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/total-dpos-sale" 
              element={
                <ProtectedRoute>
                  <TotalDposSalePage />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports/sales" 
              element={<Navigate to="/reports/sale" replace />} 
            />

            {/* Store Sub-routes */}
            <Route 
              path="/stores" 
              element={
                <ProtectedRoute>
                  <DevelopmentInProgressPage title="Store Reports" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/stores/counter-status" 
              element={
                <ProtectedRoute>
                  <StoreCounterStatusPage />
                </ProtectedRoute>
              } 
            />

            {/* Reports Sub-routes */}
            <Route 
              path="/reports/tag-cleaning" 
              element={
                <ProtectedRoute>
                  <DevelopmentInProgressPage title="Tag Cleaning" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports/stock-take" 
              element={
                <ProtectedRoute>
                  <DevelopmentInProgressPage title="Stock Take" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tags" 
              element={
                <ProtectedRoute>
                  <TagInventoryDistributionPage />
                </ProtectedRoute>
              } 
            />

            {/* Authentication / Admin Sub-routes */}
            <Route 
              path="/auth/user-registration" 
              element={
                <ProtectedRoute>
                  <DevelopmentInProgressPage title="User Registration" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/auth/store-registration" 
              element={
                <ProtectedRoute>
                  <DevelopmentInProgressPage title="Store Registration" />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/auth/warehouse-registration" 
              element={
                <ProtectedRoute>
                  <DevelopmentInProgressPage title="Warehouse Registration" />
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