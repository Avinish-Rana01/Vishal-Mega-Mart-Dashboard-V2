import React from 'react';

/**
 * Reusable header component for Dashboard sections.
 * 
 * @param {string} title - The main heading (e.g., "Live Stock")
 * @param {React.ReactNode} rightContent - Optional content for the right side (like a date badge or refresh button)
 */
export default function SectionHeader({ title, rightContent }) {
  return (
    <div className="ds-header">
      <div className="ds-header-text">
        <h3 style={{ textTransform: 'Uppercase', fontSize: '16px' }}>{title}</h3>
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
      background: '#ffffffff',
      color: '#475569',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
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
