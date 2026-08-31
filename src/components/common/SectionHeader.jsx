import React from 'react';

/**
 * Reusable header component for Dashboard sections.
 * 
 * @param {string} title - The main heading (e.g., "Live Stock")
 * @param {React.ReactNode} rightContent - Optional content for the right side (like a date badge or refresh button)
 */
export default function SectionHeader({ title, subtitle, icon, rightContent }) {
  return (
    <div className="ds-header" style={{ padding: '4px 0 20px 0', width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '8px' }}>
      <div className="ds-header-text" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        {icon && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <h1 className="ds-section-title" style={{ 
            fontWeight: '700', 
            color: '#0f172a', 
            margin: 0, 
            textTransform: 'uppercase', 
            letterSpacing: '0.03em',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {title}
          </h1>
          {subtitle && (
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {rightContent && (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {rightContent}
        </div>
      )}
    </div>
  );
}

/**
 * A standard date badge component to be used inside rightContent
 * when a section simply needs to display the current date.
 */
export function DateBadge() {
  const dateObj = new Date();
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dateFormatted = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="ds-date-badge" style={{
      color: '#475569',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      border: 'solid 1px #e2e8f0',
      whiteSpace: 'nowrap'
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span>
        <span className="hide-on-mobile">{weekday}, </span>
        {dateFormatted}
      </span>
    </div>
  );
}
