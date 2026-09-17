import React, { useState, useMemo } from 'react';

/**
 * Pure React Data Table Component
 * Completely flicker-free: No jQuery DataTables DOM destruction or remounting.
 * Preserves the table structure in the DOM and reconciles row cells in-place.
 */
export default function BaseDataTable({
  columns = [],
  data = [],
  totals = null,
  isLoading = false,
  skeletonRowsCount = 4,
  onRowClick = null,
  striped = true,
  enablePagination = false,
  pageSize = 10,
  searching = false,
  lengthChange = false,
  containerClassName = "vmm-table-container",
  tableClassName = "vmm-table",
  ordering = true
}) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(null); // 'asc' | 'desc' | null

  // Show shimmer skeleton ONLY on initial load when there is NO data yet to fill
  const showSkeleton = isLoading && (!data || data.length === 0);

  const handleSort = (colKey) => {
    if (!ordering) return;
    if (sortCol !== colKey) {
      setSortCol(colKey);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortCol(null);
      setSortDir(null);
    }
  };

  const sortedData = useMemo(() => {
    if (!ordering || !sortCol || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        : String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
    });
  }, [data, ordering, sortCol, sortDir]);

  return (
    <div className={containerClassName}>
      {showSkeleton ? (
        <div className="dt-container">
          <table className={`${tableClassName} dataTable vmm-skeleton-table ${striped ? 'vmm-table-striped' : ''}`}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="dt-orderable-asc dt-orderable-desc">
                    <span className="dt-column-title">{col.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(skeletonRowsCount)].map((_, rIdx) => (
                <tr key={`skel-row-${rIdx}`} className="vmm-skeleton-row">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-col-${cIdx}`}>
                      <span
                        className="vmm-shimmer"
                        style={{
                          width:
                            cIdx === 0
                              ? '50%'
                              : col.key === 'coverage'
                              ? '45px'
                              : col.key === 'syncDate' || col.key === 'date'
                              ? '70%'
                              : '75%'
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dt-container">
          <table className={`${tableClassName} dataTable ${striped ? 'vmm-table-striped' : ''}`}>
            <thead>
              <tr>
                {columns.map((col) => {
                  const isSorted = sortCol === col.key;
                  const sortClass = isSorted 
                    ? (sortDir === 'asc' ? 'dt-ordering-asc' : 'dt-ordering-desc') 
                    : '';
                  return (
                    <th 
                      key={col.key} 
                      className={`dt-orderable-asc dt-orderable-desc ${ordering ? 'sortable' : ''} ${sortClass}`}
                      onClick={() => handleSort(col.key)}
                    >
                      <span className="dt-column-title">{col.label}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                    No matching records found
                  </td>
                </tr>
              ) : (
                sortedData.map((row, rowIdx) => {
                  return (
                    <tr 
                      key={rowIdx}
                      onClick={() => onRowClick && onRowClick(row)}
                      style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                    >
                      {columns.map((col) => (
                        <td key={col.key}>
                          {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
            {totals && (
              <tfoot>
                <tr>
                  {columns.map((col, idx) => (
                    <td key={col.key}>
                      {idx === 0
                        ? totals[col.key] || 'TOTAL'
                        : totals[col.key] !== undefined
                        ? totals[col.key]
                        : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
