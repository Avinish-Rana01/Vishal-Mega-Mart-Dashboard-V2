import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Search, Inbox } from 'lucide-react';

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
  searchQuery = '',
  emptyTitle = null,
  emptySubtitle = null,
  lengthChange = false,
  containerClassName = "vmm-table-container",
  tableClassName = "vmm-table",
  ordering = true,
  onSortChange = null,
  externalSortCol = null,
  externalSortDir = null,
  getRowClassName = null,
  getRowStyle = null
}) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(null); // 'asc' | 'desc' | null

  // Use external sort state if server-side sorting is enabled
  const activeSortCol = onSortChange ? externalSortCol : sortCol;
  const activeSortDir = onSortChange ? (externalSortDir ? String(externalSortDir).toLowerCase() : null) : sortDir;

  // Track if data has ever been loaded so skeleton shimmer NEVER reappears during pagination or sorting
  const hasLoadedOnceRef = React.useRef(false);
  if (data && data.length > 0) {
    hasLoadedOnceRef.current = true;
  }

  // Show shimmer skeleton whenever loading and there are no rows to display
  const showSkeleton = Boolean(isLoading && (!data || data.length === 0));

  const handleSort = (colKey, colSortKey) => {
    if (!ordering) return;
    // colSortKey is the DB-level column name (if specified via col.sortKey), otherwise falls back to colKey
    const serverKey = colSortKey || colKey;
    
    if (onSortChange) {
      // Server-side sorting: delegate to parent using the DB column name
      let newDir;
      const isSameCol = Boolean(activeSortCol && serverKey && activeSortCol.toLowerCase() === serverKey.toLowerCase());
      if (!isSameCol) {
        newDir = 'asc';
      } else if (activeSortDir === 'asc') {
        newDir = 'desc';
      } else {
        newDir = null;
      }
      onSortChange(newDir ? serverKey : null, newDir);
    } else {
      // Client-side sorting (uses frontend key for local array access)
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
        <div className="dt-container" style={{ position: 'relative', minWidth: '100%', width: 'max-content' }}>
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
        <div className="dt-container" style={{ position: 'relative', minWidth: '100%', width: 'max-content' }}>
          {isLoading && sortedData.length > 0 && (
            <div className="vmm-table-loading-overlay">
              <div className="vmm-table-loader-pill">
                <Loader2 size={16} className="vmm-table-spinner" />
                <span>Loading records...</span>
              </div>
            </div>
          )}
          <table className={`${tableClassName} dataTable ${striped ? 'vmm-table-striped' : ''}`}>
            <thead>
              <tr>
                {columns.map((col) => {
                  const isSortable = col.sortable !== false && ordering;
                  const effectiveSortKey = col.sortKey || col.key;
                  const isSorted = Boolean(activeSortCol && effectiveSortKey && activeSortCol.toLowerCase() === effectiveSortKey.toLowerCase());
                  const alignClass = col.align === 'left' ? 'vmm-col-align-left' : col.align === 'right' ? 'vmm-col-align-right' : 'vmm-col-align-center';
                  return (
                    <th 
                      key={col.key} 
                      className={`vmm-th ${alignClass} ${col.className || ''} ${isSortable ? 'sortable' : ''} ${isSorted ? 'sorted' : ''}`.trim()}
                      onClick={() => isSortable && handleSort(col.key, col.sortKey)}
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
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                    {isLoading ? (
                      <div className="vmm-table-empty-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', minHeight: '130px' }}>
                        <Loader2 size={28} className="vmm-table-spinner" style={{ color: '#3B82F6' }} />
                        <span style={{ color: '#475569', fontWeight: 600, fontSize: '13px', letterSpacing: '0.02em' }}>Loading records...</span>
                      </div>
                    ) : searchQuery && String(searchQuery).trim() ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '110px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                          <Search size={20} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                          {emptyTitle || 'No matching records found'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {emptySubtitle || `No results match "${searchQuery}". Try adjusting your search term.`}
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '110px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <Inbox size={20} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                          {emptyTitle || 'No Data Available'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {emptySubtitle || 'There are currently no records for the selected filters.'}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                sortedData.map((row, rowIdx) => {
                  const customRowClass = getRowClassName ? getRowClassName(row, rowIdx) : '';
                  const customRowStyle = getRowStyle ? getRowStyle(row, rowIdx) : undefined;
                  return (
                    <tr 
                      key={rowIdx}
                      onClick={() => onRowClick && onRowClick(row)}
                      style={{ cursor: onRowClick ? 'pointer' : 'default', ...(customRowStyle || {}) }}
                      className={`vmm-tr ${customRowClass || ''}`.trim()}
                    >
                      {columns.map((col) => {
                        const alignClass = col.align === 'left' ? 'vmm-col-align-left' : col.align === 'right' ? 'vmm-col-align-right' : 'vmm-col-align-center';
                        return (
                          <td key={col.key} className={`${alignClass} ${col.className || ''}`.trim()} style={col.width ? { width: col.width } : undefined}>
                            {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
            {totals && (
              <tfoot>
                <tr>
                  {columns.map((col, idx) => {
                    const alignClass = col.align === 'left' ? 'vmm-col-align-left' : col.align === 'right' ? 'vmm-col-align-right' : 'vmm-col-align-center';
                    return (
                      <td key={col.key} className={alignClass} style={col.width ? { width: col.width } : undefined}>
                        {idx === 0
                          ? totals[col.key] || 'TOTAL'
                          : totals[col.key] !== undefined
                          ? totals[col.key]
                          : ''}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

