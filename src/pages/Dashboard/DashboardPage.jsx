import React from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import '../TagManagement/TagManagement.css';
import './Dashboard.css';

// Import abstracted sections
import LiveStockSection from './sections/LiveStockSection';
import CycleCountSection from './sections/CycleCountSection';
import StoreValidationSection from './sections/StoreValidationSection';
import SaleDashboardSection from './sections/SaleDashboardSection';
import VoidDashboardSection from './sections/VoidDashboardSection';
import ReturnDashboardSection from './sections/ReturnDashboardSection';
import DcValidationSection from './sections/DcValidationSection';
import DcEncodingSection from './sections/DcEncodingSection';
import TagManagementSection from './sections/TagManagementSection';
import VendorDiscrepancySection from './sections/VendorDiscrepancySection';

export default function DashboardPage() {
  return (
    <div className="vmm-dashboard-layout">
      <Sidebar />
      <div className="vmm-main-wrapper">
        <Header />
        <main className="vmm-dashboard-body">
          <div className="vmm-cards-grid">
            <LiveStockSection />
            <CycleCountSection />
            <StoreValidationSection />
            <SaleDashboardSection />
            <VoidDashboardSection />
            <ReturnDashboardSection />
            <DcValidationSection />
            <DcEncodingSection />
            <TagManagementSection />
            <VendorDiscrepancySection />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
