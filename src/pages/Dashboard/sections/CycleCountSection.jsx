import React, { useState, useMemo } from 'react';
import { ClipboardList, Clock, AlertTriangle, Zap, Hourglass, Filter, Search, RefreshCw } from 'lucide-react';
import KpiCard from '../../../components/charts/KpiCard';
import DataTableCard from '../../../components/common/DataTableCard';
import CycleCountModal from '../../../components/modals/CycleCountModal';
import { useCycleCount } from '../../../hooks/useDashboardData';
import { useCycleCountMetrics } from '../../../hooks/useCycleCountMetrics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import '../../../components/charts/DashboardSection.css';

export default function CycleCountSection() {
  const { data, isLoading, error, refresh } = useCycleCount();
  const metrics = useCycleCountMetrics(data);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);

  // Client-side filtering state
  const [storeFilter, setStoreFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const handleRowClick = (row) => {
    setSelectedRowData(row);
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'DATE', label: 'Date' },
    { key: 'STORE_CODE', label: 'Store Code' },
    { key: 'STORE_NAME', label: 'Store Name' },
    { key: 'CYCLE_COUNT_TYPE', label: 'Type' },
    { key: 'REF_NO', label: 'Ref No' },
    { key: 'Start_DateTime', label: 'Start Time' },
    { key: 'END_DateTime', label: 'End Time' },
    { key: 'formattedDuration', label: 'Duration' },
    { key: 'status', label: 'Status', render: (val) => (
      <span style={{
        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
        background: val === 'Overtime' ? '#fef3c7' : '#dcfce7',
        color: val === 'Overtime' ? '#b45309' : '#15803d'
      }}>
        {val}
      </span>
    )}
  ];

  if (isLoading) {
    return <div className="ds-section"><div className="ds-shimmer" style={{ height: '400px' }}></div></div>;
  }
  if (error) {
    return <div className="ds-empty-state">Error loading cycle count data: {error}</div>;
  }
  if (!metrics.parsedData || metrics.parsedData.length === 0) {
    return <div className="ds-empty-state">No cycle count records found.</div>;
  }

  // Filter the data for the audit log
  const filteredData = metrics.parsedData.filter(row => {
    if (storeFilter && !row.STORE_CODE.toLowerCase().includes(storeFilter.toLowerCase())) return false;
    if (typeFilter && row.CYCLE_COUNT_TYPE !== typeFilter) return false;
    return true;
  });

  return (
    <div className="ds-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER & FILTERS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0f172a' }}>Cycle Count Operations</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Monitor store audit activity, duration and operational exceptions.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="text" 
              placeholder="Filter by Store..." 
              value={storeFilter}
              onChange={e => setStoreFilter(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#475569' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* SECTION 1 - KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <KpiCard title="TOTAL AUDITS" value={metrics.totalAudits} subtext="Audit records" icon={<ClipboardList size={24} color="#64748b" />} />
        <KpiCard title="AVG DURATION" value={metrics.avgDurationFormatted} subtext="Across all audits" icon={<Clock size={24} color="#64748b" />} />
        <KpiCard 
          title="OVERTIME AUDITS" 
          value={metrics.overtimeCount} 
          subtext="Above 4h threshold" 
          icon={<AlertTriangle size={24} color={metrics.overtimeCount > 0 ? "#dc2626" : "#64748b"} />} 
          badgeVariant={metrics.overtimeCount > 0 ? 'danger' : 'default'}
        />
        <KpiCard title="FASTEST AUDIT" value={metrics.fastestAuditFormatted} subtext={metrics.fastestStore} icon={<Zap size={24} color="#64748b" />} />
        <KpiCard title="LONGEST AUDIT" value={metrics.slowestAuditFormatted} subtext={metrics.slowestStore} icon={<Hourglass size={24} color="#64748b" />} />
      </div>

      {/* SECTION 2 & 3 - CHARTS & EXCEPTIONS */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* MAIN VISUALIZATION: BAR CHART */}
        <div className="ds-card" style={{ flex: '2 1 500px', padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0f172a' }}>Audit Duration by Store</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Sorted by duration (minutes)</p>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={metrics.storeDurations} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="STORE_CODE" type="category" tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(val, name, props) => [`${props.payload.formattedDuration} (${val}m)`, 'Duration']}
                />
                <ReferenceLine x={metrics.OVERTIME_THRESHOLD_MINS} stroke="#dc2626" strokeDasharray="3 3" label={{ position: 'top', value: '4h Threshold', fill: '#dc2626', fontSize: 12 }} />
                <Bar dataKey="durationMins" radius={[0, 4, 4, 0]} barSize={24}>
                  {metrics.storeDurations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isOvertime ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 3 - HEALTH & EXCEPTIONS */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Operational Health */}
          <div className="ds-card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>Operational Health</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
              <span style={{ color: '#15803d', fontWeight: 600 }}>NORMAL: {metrics.totalAudits - metrics.overtimeCount}</span>
              <span style={{ color: '#b45309', fontWeight: 600 }}>OVERTIME: {metrics.overtimeCount}</span>
            </div>
            
            {/* Segmented Bar */}
            <div style={{ width: '100%', height: '12px', display: 'flex', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ height: '100%', background: '#22c55e', width: `${((metrics.totalAudits - metrics.overtimeCount) / metrics.totalAudits) * 100}%` }}></div>
              <div style={{ height: '100%', background: '#f59e0b', width: `${(metrics.overtimeCount / metrics.totalAudits) * 100}%` }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>TOTAL: {metrics.totalAudits} audits</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{metrics.overtimeRate}%</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Overtime audit rate</div>
              </div>
            </div>
          </div>

          {/* Exceptions Panel */}
          <div className="ds-card" style={{ padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', flex: 1 }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#dc2626" /> Requires Attention
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Stores exceeding the 4h threshold</p>
            
            {metrics.exceptions.length === 0 ? (
              <div style={{ padding: '20px', background: '#f0fdf4', color: '#166534', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>
                No operational exceptions detected.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {metrics.exceptions.map((exc, idx) => (
                  <div key={idx} style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '8px' }}>{exc.storeName}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                      <div style={{ color: '#b45309' }}>Duration: <strong style={{ color: '#92400e' }}>{exc.durationFormatted}</strong></div>
                      <div style={{ color: '#b45309' }}>Threshold: <strong>4h</strong></div>
                      <div style={{ color: '#dc2626', gridColumn: '1 / -1', fontWeight: 500 }}>
                        Exceeds threshold by: {exc.exceedsByFormatted}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {isModalOpen && (
        <CycleCountModal 
          modalData={selectedRowData} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
