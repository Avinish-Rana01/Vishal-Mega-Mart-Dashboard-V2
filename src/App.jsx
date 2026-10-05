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
import TagCleaningReportPage from './pages/Report/TagCleaningReportPage';
import StockTakeReportPage from './pages/Report/StockTakeReportPage';
import StoreCounterStatusPage from './pages/Store/StoreCounterStatusPage';
import DispatchMasterUploadPage from './pages/Dispatch/DispatchMasterUploadPage';
import DispatchReportPage from './pages/Dispatch/DispatchReportPage';
import PicklistCreationPage from './pages/Dispatch/PicklistCreationPage';
import { UserRegistrationPage, StoreRegistrationPage, WarehouseRegistrationPage } from './pages/Authentication';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import DevelopmentInProgressPage from './pages/DevelopmentInProgress/DevelopmentInProgressPage';
import ErrorBoundary from './components/common/ErrorBoundary';
import './App.css';

function HomeRedirect() {
  const { getDefaultRoute } = useAuth();
  return <Navigate to={getDefaultRoute()} replace />;
}

function DashboardRoute() {
  const { hasDashboardAccess, getDefaultRoute } = useAuth();
  if (!hasDashboardAccess) {
    return <Navigate to={getDefaultRoute()} replace />;
  }
  return <DashboardPage />;
}

function DispatchRoute({ children }) {
  const { hasSection, getDefaultRoute } = useAuth();
  if (!hasSection('dispatch_tracking')) {
    return <Navigate to={getDefaultRoute()} replace />;
  }
  return children;
}

function PicklistRoute({ children }) {
  const { hasSection, getDefaultRoute } = useAuth();
  if (!hasSection('picklist_creation')) {
    return <Navigate to={getDefaultRoute()} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Layout Route - Persistent Header, Sidebar & Footer */}
            <Route 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/dashboard-old" element={<DashboardOldPage />} />

              {/* Reports Module */}
              <Route path="/reports/live-stock" element={<LiveStockReportPage />} />
              <Route path="/reports/grc" element={<GrcReportPage />} />
              <Route path="/reports/store-grc" element={<StoreGrcReportPage />} />
              <Route path="/reports/cycle-count" element={<CycleCountReportPage />} />
              <Route path="/reports/store-sale" element={<StoreSaleReportPage />} />
              <Route path="/reports/sale" element={<TotalDposSalePage />} />
              <Route path="/reports/void-details" element={<VoidDetailsReportPage />} />
              <Route path="/reports/void-reconciliation" element={<VoidReconciliationReportPage />} />
              <Route path="/reports/return-details" element={<ReturnDetailsReportPage />} />
              <Route path="/reports/return-reconciliation" element={<ReturnReconciliationReportPage />} />
              <Route path="/reports/dc-report" element={<DcReportPage />} />
              <Route path="/reports/hu-report" element={<HuReportPage />} />
              <Route path="/reports/allocated-store-report" element={<AllocatedStoreReportPage />} />
              <Route path="/reports/encoding-store-report" element={<Navigate to="/reports/allocated-store-report" replace />} />
              <Route path="/reports/dc-encoding-summary" element={<WHEncodingSummaryPage />} />
              <Route path="/reports/hu-summary" element={<HuSummaryReportPage />} />
              <Route path="/reports/tag-distribution" element={<TagInventoryDistributionPage />} />
              <Route path="/reports/vendor-discrepancy-summary" element={<VendorDiscrepancySummaryPage />} />
              <Route path="/reports/total-dpos-sale" element={<TotalDposSalePage />} />
              <Route path="/reports/sales" element={<Navigate to="/reports/sale" replace />} />
              <Route path="/reports/tag-cleaning" element={<TagCleaningReportPage />} />
              <Route path="/reports/stock-take" element={<StockTakeReportPage />} />

              {/* Dispatch Tracking Module - Exclusive to Dispatch Admin */}
              <Route path="/dispatch" element={<Navigate to="/dispatch/master-upload" replace />} />
              <Route path="/dispatch/master-upload" element={<DispatchRoute><DispatchMasterUploadPage /></DispatchRoute>} />
              <Route path="/dispatch/view-report" element={<DispatchRoute><DispatchReportPage /></DispatchRoute>} />

              {/* Picklist Creation Module - Exclusive to Dispatch Admin */}
              <Route path="/picklist" element={<Navigate to="/picklist/creation" replace />} />
              <Route path="/picklist/creation" element={<PicklistRoute><PicklistCreationPage /></PicklistRoute>} />

              {/* Stores Module */}
              <Route path="/stores" element={<DevelopmentInProgressPage title="Store Reports" />} />
              <Route path="/stores/counter-status" element={<StoreCounterStatusPage />} />

              {/* Tags Module */}
              <Route path="/tags" element={<TagInventoryDistributionPage />} />
              <Route path="/tag-management/distribution" element={<TagInventoryDistributionPage />} />

              {/* Authentication / Master Registration Sub-routes */}
              <Route path="/auth/user-registration" element={<UserRegistrationPage />} />
              <Route path="/auth/store-registration" element={<StoreRegistrationPage />} />
              <Route path="/auth/warehouse-registration" element={<WarehouseRegistrationPage />} />
              <Route path="/settings" element={<DevelopmentInProgressPage title="Settings" />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}