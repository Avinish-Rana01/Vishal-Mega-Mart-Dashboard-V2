import React, { useState, Suspense, lazy } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { 
  Package, ClipboardList, ShoppingCart, XCircle, 
  RotateCcw, AlertTriangle, CheckSquare, BarChart2, 
  Tags, Store, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import '../TagManagement/TagManagement.css';
import './Dashboard.css';

// Lazy load each tab's content for performance (only active tab fires APIs)
const LiveStockSection        = lazy(() => import('./sections/LiveStockSection'));
const CycleCountSection       = lazy(() => import('./sections/CycleCountSection'));
const SaleDashboardSection    = lazy(() => import('./sections/SaleDashboardSection'));
const VoidDashboardSection    = lazy(() => import('./sections/VoidDashboardSection'));
const ReturnDashboardSection  = lazy(() => import('./sections/ReturnDashboardSection'));
const DcValidationSection     = lazy(() => import('./sections/DcValidationSection'));
const DcEncodingSection       = lazy(() => import('./sections/DcEncodingSection'));
const TagManagementSection    = lazy(() => import('./sections/TagManagementSection'));
const VendorDiscrepancySection = lazy(() => import('./sections/VendorDiscrepancySection'));
const StoreValidationSection  = lazy(() => import('./sections/StoreValidationSection'));

// Tab definition
const TABS = [
  { id: 'livestock', label: 'LiveStock', icon: <Package size={16} /> },
  { id: 'cycle-count', label: 'Cycle Count', icon: <ClipboardList size={16} /> },
  { id: 'sale', label: 'Sale Dashboard', icon: <ShoppingCart size={16} /> },
  { id: 'void', label: 'Void Dashboard', icon: <XCircle size={16} /> },
  { id: 'return', label: 'Return Dashboard', icon: <RotateCcw size={16} /> },
  { id: 'vendor', label: 'Vendor Discrepancy', icon: <AlertTriangle size={16} /> },
  { id: 'dc-valid', label: 'DC Validation', icon: <CheckSquare size={16} /> },
  { id: 'dc-encode', label: 'DC Encoding', icon: <BarChart2 size={16} /> },
  { id: 'tags', label: 'Tag Management', icon: <Tags size={16} /> },
  { id: 'store-ops', label: 'Store Validation', icon: <Store size={16} /> },
];

// Tab loading fallback
function TabLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
      {[150, 300, 200].map((h, i) => (
        <div key={i} style={{ borderRadius: '20px', background: 'white', height: h, overflow: 'hidden', position: 'relative', border: '1px solid #f1f5f9' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmerAnim 1.5s infinite',
          }} />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('livestock');
  const scrollContainerRef = React.useRef(null);

  const scroll = (offset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="vmm-dashboard-layout">
      <Sidebar />
      <div className="vmm-main-wrapper">
        <Header />
        <main className="vmm-dashboard-body">

          {/* Tab Navigation Bar Wrapper */}
          <div className="vmm-tab-nav-wrapper">
            <button className="vmm-tab-scroll-btn left" onClick={() => scroll(-250)}>
              <ChevronsLeft size={24} />
            </button>
            <div className="vmm-tab-nav" ref={scrollContainerRef}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`vmm-tab-btn ${activeTab === tab.id ? 'vmm-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            <button className="vmm-tab-scroll-btn right" onClick={() => scroll(250)}>
              <ChevronsRight size={24} />
            </button>
          </div>

          {/* Tab Content */}
          <div className="vmm-tab-content">
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'livestock' && <LiveStockSection />}
              {activeTab === 'cycle-count' && <CycleCountSection />}
              {activeTab === 'sale' && <SaleDashboardSection />}
              {activeTab === 'void' && <VoidDashboardSection />}
              {activeTab === 'return' && <ReturnDashboardSection />}
              {activeTab === 'vendor' && <VendorDiscrepancySection />}
              {activeTab === 'dc-valid' && <DcValidationSection />}
              {activeTab === 'dc-encode' && <DcEncodingSection />}
              {activeTab === 'tags' && <TagManagementSection />}
              {activeTab === 'store-ops' && <StoreValidationSection />}
            </Suspense>
          </div>

        </main>
        <Footer />
      </div>
    </div>
  );
}
