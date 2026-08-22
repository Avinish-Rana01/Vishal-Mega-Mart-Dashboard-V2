import React from 'react';

/**
 * ChartToolbar — Reusable two-slot toolbar layout used across all dashboard chart cards.
 *
 * This is a PURE LAYOUT component. It renders the outer shell and two flex slots.
 * All content (dropdowns, search, buttons) is passed in as children via props.
 *
 * Props:
 *   leftContent   {ReactNode}  — left side content (e.g. plain title h3, or a view-switcher dropdown)
 *   rightContent  {ReactNode}  — right side content (e.g. sort dropdown + search input)
 *   style         {object}     — optional extra style for the outer wrapper
 */
export default function ChartToolbar({ leftContent, rightContent, style }) {
  return (
    <div className="vmm-toolbar-header" style={{ minHeight: '40px', ...style }}>
      <h3 className="vmm-toolbar-title" style={{ display: 'flex', alignItems: 'center' }}>
        {leftContent}
      </h3>
      {rightContent && (
        <div className="vmm-toolbar-controls">
          {rightContent}
        </div>
      )}
    </div>
  );
}
