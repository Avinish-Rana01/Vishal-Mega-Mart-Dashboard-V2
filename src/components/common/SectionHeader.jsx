import React from 'react';

/**
 * Reusable header component for Dashboard sections.
 * 
 * @param {string} title - The main heading (e.g., "Live Stock")
 * @param {React.ReactNode} rightContent - Optional content for the right side (like a date badge or refresh button)
 */
export default function SectionHeader({ title, subtitle, icon, rightContent }) {
  return (
    <div className="ds-header" style={{ padding: '4px 8px 24px 8px', background: 'transparent', border: 'none', alignItems: 'center' }}>
      <div className="ds-header-text" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {icon && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#0f172a', 
            margin: 0, 
            textTransform: 'uppercase', 
            letterSpacing: '0.04em',
            lineHeight: 1
          }}>
            {title}
          </h1>
          {subtitle && (
            <span style={{ fontSize: '15px', color: '#64748b', fontWeight: '500', lineHeight: 1 }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {rightContent && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
  return (
    <div style={{
      // background: '#ffffffff',
      color: '#475569',
      padding: '6px 16px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      border: 'solid 1px #e2e8f0'
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
    </div>
  );
}
