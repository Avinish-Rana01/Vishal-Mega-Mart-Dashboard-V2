import React from 'react';

/**
 * Reusable header component for Dashboard sections.
 * 
 * @param {string} title - The main heading (e.g., "Live Stock")
 * @param {string} subtitle - Subheading or description
 * @param {React.ReactNode} icon - Leading icon
 * @param {React.ReactNode} rightContent - Optional content for the right side (like Live badge and Date badge)
 */
export default function SectionHeader({ title, subtitle, icon, rightContent }) {
  return (
    <div className="ds-header">
      <div className="ds-header-main">
        {icon && (
          <div className="ds-header-icon">
            {icon}
          </div>
        )}
        <div className="ds-header-text-group">
          <div className="ds-header-title-row">
            <h1 className="ds-section-title">
              {title}
            </h1>
            {rightContent && (
              <div className="ds-header-actions-inline">
                {rightContent}
              </div>
            )}
          </div>
          {subtitle && (
            <span className="ds-section-subtitle">
              {subtitle}
            </span>
          )}
        </div>
      </div>
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
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const day = dateObj.getDate();
  const yearFull = dateObj.getFullYear();
  const yearShort = String(yearFull).slice(-2);

  return (
    <div className="ds-date-badge">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span>
        <span className="ds-date-text-desktop">{weekday}, {month} {day}, {yearFull}</span>
        <span className="ds-date-text-mobile">{month} {day}, {yearShort}</span>
      </span>
    </div>
  );
}
