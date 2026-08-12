import React, { useMemo } from 'react';
import { useLiveStock, useCycleCount, useVendorDiscrepancy } from '../../hooks/useDashboardData';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function InventoryCharts() {
  const { data: liveStockData, isLoading: liveStockLoading } = useLiveStock();
  const { data: cycleData, isLoading: cycleLoading } = useCycleCount();
  
  const isLoading = liveStockLoading || cycleLoading;

  // Process Live Stock Data for Area Chart
  const stockChartData = useMemo(() => {
    if (!liveStockData || liveStockData.length === 0) return [];
    
    // Sort by largest SAP Stock
    const sorted = [...liveStockData].sort((a, b) => {
      return (Number(b.SAP_STOCK) || 0) - (Number(a.SAP_STOCK) || 0);
    });

    return sorted.slice(0, 15).map(row => ({
      name: row.STORE_CODE || row.STORE_NAME || 'Unknown',
      'SAP Stock': Number(row.SAP_STOCK) || 0,
      'RFID Stock': Number(row.RFID_STOCK) || 0,
      'Difference': Number(row.DIFFERENCE) || 0
    }));
  }, [liveStockData]);

  // Process Cycle Count for Bar Chart
  const cycleChartData = useMemo(() => {
    if (!cycleData || cycleData.length === 0) return [];
    
    // Take top 15 recent cycle counts
    return cycleData.slice(0, 15).map(row => ({
      name: row.STORE_CODE || 'Unknown',
      'System Stock': Number(row.SYSTEM_STOCK) || 0,
      'Scanned Qty': Number(row.SCANNED_QTY) || 0,
      'Net Diff': Number(row.NET_DIFF) || 0
    }));
  }, [cycleData]);

  if (isLoading) {
    return (
      <div className="vmm-skeleton-table" style={{ height: '400px', borderRadius: '12px', background: 'white' }}>
        <div className="vmm-shimmer" style={{ width: '100%', height: '100%', borderRadius: '12px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Live Stock Area Chart */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>Live Stock (SAP vs RFID)</h3>
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={stockChartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRfid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <RechartsTooltip />
              <Legend />
              <Area type="monotone" dataKey="SAP Stock" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSap)" />
              <Area type="monotone" dataKey="RFID Stock" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorRfid)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cycle Count Chart */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>Cycle Count Accuracy</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cycleChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="System Stock" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Scanned Qty" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
