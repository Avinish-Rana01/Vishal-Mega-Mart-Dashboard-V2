import React from 'react';

/**
 * ChartLegend — Renders a horizontal row of color-dot + label legend items.
 *
 * Props:
 *   items  {Array<{ color: string, label: string, borderColor?: string }>}
 *          — array of legend entries. borderColor is optional (for "outlined dot" style)
 *   align  {'left' | 'right'} — default 'right'
 *   style  {object}           — optional extra styles on the wrapper
 */
export default function ChartLegend({ items = [], align = 'right', style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        gap: '16px',
        padding: '4px 8px 6px',
        fontSize: '12px',
        color: '#475569',
        fontWeight: 500,
        borderBottom: '1px solid #e8eaf0',
        ...style,
      }}
    >
      {items.map(({ color, label, borderColor }, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '11px',
              height: '11px',
              borderRadius: '50%',
              background: color,
              ...(borderColor ? { border: `1.5px solid ${borderColor}` } : {}),
            }}
          />
          {label}
        </div>
      ))}
    </div>
  );
}
