import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import LiveStockTableView from '../Dashboard/sections/components/LiveStockTableView';

export default function LiveStockReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract initial parameters passed from dashboard chart click
  const { store: initialStore = 'HD44', date: initialDate = new Date().toISOString().split('T')[0] } = location.state || {};

  return (
    <div className="vmm-dashboard-layout">
      <Sidebar />

      <div className="vmm-main-wrapper">
        <Header 
          breadcrumb={<>HOME - PAGES - REPORT - <span className="active">LIVE STOCK REPORT</span></>}
          showBackButton={true}
          onBackClick={() => navigate('/dashboard')}
        />

        <main className="vmm-dashboard-body" style={{ display: 'flex', flexDirection: 'column' }}>
          <LiveStockTableView initialStore={initialStore} initialDate={initialDate} />
        </main>

        <Footer />
      </div>
    </div>
  );
}
