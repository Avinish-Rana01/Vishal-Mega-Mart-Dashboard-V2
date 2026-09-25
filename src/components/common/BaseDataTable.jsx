import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * Pure React Data Table Component
 * Completely flicker-free: No jQuery DataTables DOM destruction or remounting.
 * Modern, clean DashboardDataGrid design system.
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
  ordering = true,
  onSortChange = null,
  externalSortCol = null,
  externalSortDir = null
}) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(null); // 'asc' | 'desc' | null

  // Use external sort state if server-side sorting is enabled
  const activeSortCol = onSortChange ? externalSortCol : sortCol;
  const activeSortDir = onSortChange ? externalSortDir : sortDir;

  // Track if data has ever been loaded so skeleton shimmer NEVER reappears during pagination or sorting
  const hasLoadedOnceRef = React.useRef(false);
  if (data && data.length > 0) {
    hasLoadedOnceRef.current = true;
  }

  // Show shimmer skeleton ONLY on the very first initial load when there is NO data yet
  const showSkeleton = isLoading && (!data || data.length === 0) && !hasLoadedOnceRef.current;

  const handleSort = (colKey) => {
    if (!ordering) return;
    
    if (onSortChange) {
      // Server-side sorting: delegate to parent
      let newDir;
      if (activeSortCol !== colKey) {
        newDir = 'asc';
      } else if (activeSortDir === 'asc') {
        newDir = 'desc';
      } else {
        newDir = null;
      }
      onSortChange(newDir ? colKey : null, newDir);
    } else {
      // Client-side sorting
      if (sortCol !== colKey) {
        setSortCol(colKey);
        setSortDir('asc');
      } else if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortCol(null);
        setSortDir(null);
      }
    }
  };

  const sortedData = useMemo(() => {
    // Skip client-side sorting when server-side sorting is active
    if (onSortChange) return data;
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
  }, [data, ordering, sortCol, sortDir, onSortChange]);

  return (
    <div className={containerClassName}>
      {showSkeleton ? (
        <div className="dt-container">
          <table className={`${tableClassName} dataTable vmm-skeleton-table ${striped ? 'vmm-table-striped' : ''}`}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="vmm-th">
                    <div className="vmm-th-content">
                      <span className="dt-column-title">{col.label}</span>
                    </div>
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
                  const isSortable = col.sortable !== false && ordering;
                  const isSorted = activeSortCol === col.key;
                  return (
                    <th 
                      key={col.key} 
                      className={`vmm-th ${col.className || ''} ${isSortable ? 'sortable' : ''} ${isSorted ? 'sorted' : ''}`.trim()}
                      onClick={() => isSortable && handleSort(col.key)}
                      style={col.width ? { width: col.width } : undefined}
                    >
                      <div className="vmm-th-content">
                        <span className="dt-column-title">{col.label}</span>
                        {isSortable && (
                          <span className="vmm-sort-icon-box">
                            {isSorted ? (
                              activeSortDir === 'asc' ? (
                                <ChevronUp size={13} className="vmm-sort-active" />
                              ) : (
                                <ChevronDown size={13} className="vmm-sort-active" />
                              )
                            ) : (
                              <ChevronsUpDown size={12} className="vmm-sort-idle" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8', fontSize: '13px' }}>
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
                      className="vmm-tr"
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={col.className || ''}>
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

