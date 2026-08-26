import React, { useMemo } from 'react';

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

let currentHue = 0.5; // Start at a specific hue for determinism (around cyan/blue)
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
const colorMap = new Map();

function getCardColor(title) {
  if (!title) return { border: '#5ea6f1', bg: '#f9f9fb' };
  if (colorMap.has(title)) return colorMap.get(title);

  // Generate a mathematically unique hue using the golden ratio sequence
  currentHue += GOLDEN_RATIO_CONJUGATE;
  currentHue %= 1; // Keep it between 0 and 1

  const h = Math.floor(currentHue * 360);

  const color = {
    border: `hsl(${h}, 85%, 55%)`,
    bg: `hsl(${h}, 85%, 96%)`
  };

  colorMap.set(title, color);
  return color;
}

export default function KpiCard({ title, value, subtext, badge, badgeVariant = 'default', icon }) {
  const cardColor = useMemo(() => getCardColor(title), [title]);
  const badgeStyles = {
    default: { background: '#dcfce7', color: '#166534' },
    success: { background: '#dcfce7', color: '#15803d' },
    warning: { background: '#fef3c7', color: '#b45309' },
    danger: { background: '#fee2e2', color: '#b91c1c' },
    info: { background: '#eff6ff', color: '#1d4ed8' },
  };

  return (
    <div style={{
      background: cardColor.bg,
      borderRadius: '10px',
      padding: '10px 0 10px 10px',
      boxShadow: '0 2px 8px -2px rgba(0,0,0,0.03)',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #f1f5f9',
      borderTop: `4px solid ${cardColor.border}`,
    }}>
      <h3 style={{ fontSize: '9px', fontWeight: '600', color: '#475569', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {title}
      </h3>

      <div style={{ fontSize: 'clamp(18px, 4vw, 19px)', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}
