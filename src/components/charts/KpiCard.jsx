import React from 'react';

/**
 * KpiCard - A clean white stat card for secondary KPI metrics.
 * Use CurvedCard for the primary (dark-background) metric.
 *
 * @param {string} title - Label above the value
 * @param {string|number} value - The big number/text to display
 * @param {string} subtext - Small descriptive text below the value
 * @param {string} badge - Optional small colored pill text (e.g. "Live", "Gap")
 * @param {'default'|'success'|'warning'|'danger'|'info'} badgeVariant - Controls badge color
 * @param {React.ReactNode} icon - Optional icon in the top-right corner
 */
export default function KpiCard({ title, value, subtext, badge, badgeVariant = 'default', icon }) {
  const badgeStyles = {
    default: { background: '#dcfce7', color: '#166534' },
    success: { background: '#dcfce7', color: '#15803d' },
    warning: { background: '#fef3c7', color: '#b45309' },
    danger:  { background: '#fee2e2', color: '#b91c1c' },
    info:    { background: '#eff6ff', color: '#1d4ed8' },
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #f1f5f9',
    }}>
      <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#475569', margin: '0 0 12px 0', paddingRight: '40px' }}>
        {title}
      </h3>

      <div style={{ fontSize: '36px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0', lineHeight: 1 }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
        {badge && (
          <span style={{
            ...badgeStyles[badgeVariant],
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
          }}>
            {badge}
          </span>
        )}
        {subtext && <span>{subtext}</span>}
      </div>

      {icon && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e2e8f0',
          color: '#64748b',
        }}>
          {icon}
        </div>
      )}
    </div>
  );
}
