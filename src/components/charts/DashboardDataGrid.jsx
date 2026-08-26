import React, { useState, useEffect } from 'react';

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
  emptyStateContent,
  pagination = false,
  rowsPerPage = 5,
  tableScrollStyle = {},
  innerWrapperStyle = {},
  tableStyle = {}
}) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data, pagination, rowsPerPage]);

  const totalPages = data ? Math.ceil(data.length / rowsPerPage) : 0;
  
  const currentData = pagination && data 
    ? data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : data;

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

      <div className="cc-native-table-scroll" style={{ overflowY: 'auto', ...tableScrollStyle }}>
        <div className="cc-data-grid-inner-wrapper" style={innerWrapperStyle}>
          <table className="cc-data-grid-table" style={tableStyle}>
            <thead className="cc-data-grid-thead">
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx} className="cc-data-grid-th">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(!currentData || currentData.length === 0) ? (
                emptyStateContent
              ) : (
                currentData.map((row, index) => renderRow(row, index))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #e2e8f0', background: '#fff', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, data.length)} of {data.length} records
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ padding: '6px 12px', background: currentPage === 1 ? '#f1f5f9' : '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s' }}
            >
              Previous
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ padding: '6px 12px', background: currentPage === totalPages ? '#f1f5f9' : '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
