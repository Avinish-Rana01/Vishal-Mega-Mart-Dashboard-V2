import React, { useMemo } from 'react';
import { useSaleDashboard, useVoidDashboard, useReturnDashboard } from '../../hooks/useDashboardData';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SalesCharts() {
  const { data: saleData, totals: saleTotals, isLoading: saleLoading } = useSaleDashboard();
  const { data: voidData, totals: voidTotals, isLoading: voidLoading } = useVoidDashboard();
  const { data: returnData, totals: returnTotals, isLoading: returnLoading } = useReturnDashboard();

  const isLoading = saleLoading || voidLoading || returnLoading;

  // Aggregate Pie Chart Data (Totals)
  const pieData = useMemo(() => {
    const s = parseInt(saleTotals?.TOTAL_DPOS_SALE?.replace(/,/g, '') || 0, 10);
    const v = parseInt(voidTotals?.VOID_QTY?.replace(/,/g, '') || 0, 10);
    const r = parseInt(returnTotals?.RETURN_QTY?.replace(/,/g, '') || 0, 10);
    return [
      { name: 'Total Sales', value: s, color: '#3b82f6' },
      { name: 'Total Voids', value: v, color: '#ef4444' },
      { name: 'Total Returns', value: r, color: '#f59e0b' }
    ].filter(d => d.value > 0);
  }, [saleTotals, voidTotals, returnTotals]);

  // Aggregate Bar Chart Data (Store vs Qty)
  const barData = useMemo(() => {
    // Map stores to their sales
    if (!saleData || saleData.length === 0) return [];
    
    // Sort by Total DPOS Sale descending
    const sorted = [...saleData].sort((a, b) => {
      const valA = Number(a.TOTAL_DPOS_SALE) || 0;
      const valB = Number(b.TOTAL_DPOS_SALE) || 0;
      return valB - valA;
    });

    return sorted.slice(0, 15).map(row => ({
      name: row.STORE || row.STORE_NAME || 'Unknown',
      Sales: Number(row.TOTAL_DPOS_SALE) || 0,
      RFID: Number(row.TOTAL_RFID_CHECKOUT) || 0,
      Voids: Number(row.TOTAL_VOID) || 0
    }));
  }, [saleData]);

  if (isLoading) {
    return (
      <div className="vmm-skeleton-table" style={{ height: '400px', borderRadius: '12px', background: 'white' }}>
        <div className="vmm-shimmer" style={{ width: '100%', height: '100%', borderRadius: '12px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
      
      {/* Pie Chart Card */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>Sales vs Voids vs Returns</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value) => value.toLocaleString('en-IN')} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart Card */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b' }}>Top 15 Stores by Performance</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
              <Legend />
              <Bar dataKey="Sales" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="RFID" stackId="a" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Voids" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
