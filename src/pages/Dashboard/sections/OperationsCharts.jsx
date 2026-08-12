import React, { useMemo } from 'react';
import { useDcValidation, useVendorDiscrepancy } from '../../hooks/useDashboardData';
import { BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function OperationsCharts() {
  const { data: dcData, isLoading: dcLoading } = useDcValidation();
  const { data: vendorData, isLoading: vendorLoading } = useVendorDiscrepancy();
  
  const isLoading = dcLoading || vendorLoading;

  // Radar Chart for Vendor Discrepancy
  const vendorChartData = useMemo(() => {
    if (!vendorData || vendorData.length === 0) return [];
    
    return vendorData.slice(0, 6).map(row => ({
      subject: row.VENDOR_NAME ? row.VENDOR_NAME.substring(0, 10) + '...' : 'Unknown',
      'Actual Qty': Number(row.ACTUAL_QTY) || 0,
      'Scanned Qty': Number(row.SCANNED_QTY) || 0,
      'Difference': Math.abs(Number(row.DIFF_QTY)) || 0
    }));
  }, [vendorData]);

  // Bar Chart for DC Validation
  const dcChartData = useMemo(() => {
    if (!dcData || dcData.length === 0) return [];
    
    return dcData.slice(0, 15).map(row => ({
      name: row.STORE_NAME || 'Unknown',
      'Processed HU': Number(row.PROCESSED_HU) || 0,
      'Unprocessed HU': Number(row.UNPROCESSED_HU) || 0
    }));
  }, [dcData]);

  if (isLoading) {
    return (
      <div className="vmm-skeleton-table" style={{ height: '400px', borderRadius: '12px', background: 'white' }}>
        <div className="vmm-shimmer" style={{ width: '100%', height: '100%', borderRadius: '12px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
      
      {/* Vendor Discrepancy Radar */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>Vendor Discrepancy Profile</h3>
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={vendorChartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis />
              <Radar name="Actual Qty" dataKey="Actual Qty" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name="Scanned Qty" dataKey="Scanned Qty" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Legend />
              <RechartsTooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DC Validation Bar Chart */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>DC Validation Status</h3>
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dcChartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="Processed HU" stackId="a" fill="#10b981" />
              <Bar dataKey="Unprocessed HU" stackId="a" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
