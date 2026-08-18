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
// Generate a very light pastel color using HSL (Hue, Saturation, Lightness)
const randomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 85%, 92%)`;

export default function KpiCard({ title, value, subtext, badge, badgeVariant = 'default', icon }) {
  const badgeStyles = {
    default: { background: '#dcfce7', color: '#166534' },
    success: { background: '#dcfce7', color: '#15803d' },
    warning: { background: '#fef3c7', color: '#b45309' },
    danger: { background: '#fee2e2', color: '#b91c1c' },
    info: { background: '#eff6ff', color: '#1d4ed8' },
  };

  const [randomBg] = React.useState(() => randomColor());

  return (
    <div style={{
      background: randomBg,
      borderRadius: '10px',
      padding: '10px',
      boxShadow: '0 2px 8px -2px rgba(0,0,0,0.03)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #f1f5f9',
    }}>
      <h3 style={{ fontSize: '11px', fontWeight: '600', color: '#475569', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {title}
      </h3>

      <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1 }}>
        {value}
      </div>

      {/* <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b', flexWrap: 'wrap' }}>
        {badge && (
          <span style={{
            ...badgeStyles[badgeVariant],
            padding: '2px 4px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
          }}>
            {badge}
          </span>
        )}
        {subtext && <span>{subtext}</span>}
      </div> */}
      {/* 
      {icon && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e2e8f0',
          color: '#64748b',
        }}>
          {React.cloneElement(icon, { size: 14 })}
        </div>
      )} */}
    </div>
  );
}
