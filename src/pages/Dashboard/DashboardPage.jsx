import React from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import '../TagManagement/TagManagement.css';
import './Dashboard.css';

// Direct imports for all sections (no lazy loading)
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
          <div className="vmm-dashboard-grid">
            <div className="vmm-grid-cell">
              <LiveStockSection />
            </div>
            <div className="vmm-grid-cell">
              <CycleCountSection />
            </div>
            <div className="vmm-grid-cell">
              <StoreValidationSection />
            </div>
            <div className="vmm-grid-cell">
              <SaleDashboardSection />
            </div>
            <div className="vmm-grid-cell">
              <VoidDashboardSection />
            </div>
            <div className="vmm-grid-cell">
              <ReturnDashboardSection />
            </div>
            <div className="vmm-grid-cell">
              <DcValidationSection />
            </div>
            {/* <div className="vmm-grid-cell">
              <DcEncodingSection />
            </div> */}
            {/* <div className="vmm-grid-cell" style={{ gridColumn: '1 / -1' }}>
              <TagManagementSection />
            </div>
            <div className="vmm-grid-cell" style={{ gridColumn: '1 / -1' }}>
              <VendorDiscrepancySection />
            </div> */}
          </div>

        </main>
        <Footer />
      </div>
    </div>
  );
}
