import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import LiveStockTableView from '../Dashboard/sections/components/LiveStockTableView';

export default function LiveStockReportPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract initial parameters passed from dashboard chart click
  const { store: initialStore = 'HD44', date: initialDate = new Date().toISOString().split('T')[0] } = location.state || {};

  return (
    <AppLayout 
      headerProps={{
        breadcrumb: <>HOME - PAGES - REPORT - <span className="active">LIVE STOCK REPORT</span></>,
        showBackButton: true,
        onBackClick: () => navigate('/dashboard')
      }}
      mainClassName="flex-col-main"
    >
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
        <LiveStockTableView initialStore={initialStore} initialDate={initialDate} />
      </div>
    </AppLayout>
  );
}
