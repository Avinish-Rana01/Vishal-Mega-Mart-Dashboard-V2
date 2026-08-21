import React from 'react';

// Custom tooltip for the aggregate pie chart (Moved outside render to prevent recreation)
export const AccuracyTooltip = React.memo(({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const name = item.name || item.payload?.name;
  const value = item.value;
  const fill = item.payload?.fill || item.fill || '#0f172a';

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', minWidth: '140px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '6px' }}>{name}</div>
      <div style={{ fontSize: '13px', color: '#475569' }}>
        Stores: <span style={{ fontWeight: 700, color: fill, marginLeft: '6px' }}>{value}</span>
      </div>
    </div>
  );
});

// Custom tooltip for the store performance bar chart
export const StoreBarTooltip = React.memo(({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', minWidth: '180px' }}>
      <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
        {data.fullName || label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#64748b' }}>Accuracy:</span>
          <span style={{ fontWeight: 700, color: data.PERCENTAGE >= 95 ? '#16a34a' : data.PERCENTAGE >= 80 ? '#d97706' : '#dc2626' }}>
            {Number(data.PERCENTAGE).toFixed(2)}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></div>
            SAP Stock:
          </span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{Number(data.SAP_STOCK || 0).toLocaleString()}</span>
        </div>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.fill === 'url(#striped-bar)' ? '#ff5c5c' : '#406bde' }}></div>
              {entry.name}:
            </span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
