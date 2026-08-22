import React from 'react';

/**
 * Reusable Dashboard Data Grid Component
 * 
 * @param {string} title - The title of the grid card
 * @param {string|React.ReactNode} subtitle - The subtitle/badge next to the title
 * @param {Array<string|React.ReactNode>} headers - Array of table headers
 * @param {Array<any>} data - The dataset to render
 * @param {Function} renderRow - Render prop function: (row, index) => ReactNode
 * @param {React.ReactNode} emptyStateContent - What to display when data is empty
 */
export default function DashboardDataGrid({
  title,
  subtitle,
  headerAction,
  headers,
  data,
  renderRow,
  emptyStateContent
}) {
  return (
    <div className="cc-data-grid-card">
      <div className="cc-data-grid-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 className="cc-data-grid-title">{title}</h3>
          {subtitle && (
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
              {subtitle}
            </span>
          )}
        </div>
        {headerAction && (
          <div>
            {headerAction}
          </div>
        )}
      </div>

      <div className="cc-native-table-scroll">
        <div className="cc-data-grid-inner-wrapper">
          <table className="cc-data-grid-table">
            <thead className="cc-data-grid-thead">
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx} className="cc-data-grid-th">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) ? (
                emptyStateContent
              ) : (
                data.map((row, index) => renderRow(row, index))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
