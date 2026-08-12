import React, { useEffect, useRef, useMemo } from 'react';
import DataTableLib from 'datatables.net-dt';

// Safely extract the DataTable constructor
const DataTable = DataTableLib.default || DataTableLib || window.DataTable;

/**
 * Pure jQuery DataTables React Component
 * This handles ONLY the table itself, preventing React Fiber mismatches.
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
  domConfig = '<"top">rt<"bottom"ip><"clear">',
  searching = false,
  lengthChange = false,
  containerClassName = "vmm-table-container",
  tableClassName = "vmm-table"
}) {
  const tableRef = useRef(null);
  const dataTableInstance = useRef(null);

  // 1. Force a complete React remount of the table when data changes.
  const tableKey = useMemo(() => Math.random().toString(36), [data, isLoading, enablePagination, pageSize, domConfig, searching, lengthChange]);

  // 2. Safe jQuery DataTables Initialization
  useEffect(() => {
    if (isLoading || !tableRef.current || data.length === 0) return;

    if (dataTableInstance.current) {
      dataTableInstance.current.destroy();
      dataTableInstance.current = null;
    }

    try {
      // Mount DataTables over the React-rendered DOM
      dataTableInstance.current = new DataTable(tableRef.current, {
        paging: enablePagination,
        pageLength: pageSize,
        searching: searching,
        ordering: true,
        info: enablePagination,
        lengthChange: lengthChange,
        destroy: true,
        dom: domConfig,
        language: {
          paginate: {
            previous: 'Previous',
            next: 'Next'
          }
        },
        drawCallback: function(settings) {
          const api = this.api();
          const pageInfo = api.page.info();
          const container = api.table().container();
          
          if (container) {
            const bottomEl = container.querySelector('.bottom');
            if (bottomEl) {
              bottomEl.style.display = pageInfo.pages <= 1 ? 'none' : 'flex';
            }
          }
        }
      });
    } catch (err) {
      console.error("DataTables Initialization Error:", err);
    }

    return () => {
      if (dataTableInstance.current) {
        try {
          dataTableInstance.current.destroy();
        } catch (e) {
          // Ignore destruction errors on unmount
        }
        dataTableInstance.current = null;
      }
    };
  }, [tableKey]);

  // 3. DOM Event Delegation Workaround
  useEffect(() => {
    const tableEl = tableRef.current;
    if (!tableEl || !onRowClick) return;

    const handleTableClick = (e) => {
      const tr = e.target.closest('tr');
      if (tr && tr.hasAttribute('data-row-index')) {
        const idx = parseInt(tr.getAttribute('data-row-index'), 10);
        if (data[idx]) {
          onRowClick(data[idx]);
        }
      }
    };

    tableEl.addEventListener('click', handleTableClick);
    return () => tableEl.removeEventListener('click', handleTableClick);
  }, [tableKey, onRowClick, data]);

  return (
    <div className={containerClassName}>
      {isLoading ? (
        <div className="dt-container">
          <table className={`${tableClassName} dataTable vmm-skeleton-table ${striped ? 'vmm-table-striped' : ''}`} style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="dt-orderable-asc dt-orderable-desc">
                    <span className="dt-column-title">{col.label}</span>
                    <span className="dt-column-order"></span>
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
        <div key={tableKey}>
          <table ref={tableRef} className={`${tableClassName} ${striped ? 'vmm-table-striped' : ''}`} style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                    No matching records found
                  </td>
                </tr>
              ) : (
                data.map((row, rowIdx) => (
                  <tr 
                    key={rowIdx} 
                    data-row-index={rowIdx} 
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
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
