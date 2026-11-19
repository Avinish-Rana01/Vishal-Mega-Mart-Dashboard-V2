import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  Inbox,
} from 'lucide-react';

/**
 * Modern React DataTable Component
 * Built for React 19 + Tailwind CSS v4.
 *
 * Implements the standard react-data-table-component API:
 * - columns: Array<{ name, selector, sortable, sortFunction, cell, width, minWidth, maxWidth, center, right, wrap }>
 * - data: Array<object>
 * - keyField: string (default 'id')
 * - pagination: boolean (default true)
 * - paginationPerPage: number (default 10)
 * - paginationRowsPerPageOptions: number[] (default [10, 20, 50, 100])
 * - onChangeRowsPerPage: (newRowsPerPage, currentPage) => void
 * - onChangePage: (newPage) => void
 * - selectableRows: boolean (default false)
 * - onSelectedRowsChange: ({ allSelected, selectedCount, selectedRows }) => void
 * - highlightOnHover: boolean (default true)
 * - pointerOnHover: boolean (default false)
 * - striped: boolean (default false)
 * - dense: boolean (default false)
 * - progressPending: boolean (default false)
 * - progressComponent: ReactNode
 * - noDataComponent: ReactNode
 * - subHeader: boolean (default false)
 * - subHeaderComponent: ReactNode
 */
const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  pagination = true,
  paginationPerPage = 10,
  paginationRowsPerPageOptions = [10, 20, 50, 100],
  paginationServer = false,
  paginationTotalRows = 0,
  paginationDefaultPage = 1,
  onChangeRowsPerPage,
  onChangePage,
  selectableRows = false,
  onSelectedRowsChange,
  highlightOnHover = true,
  pointerOnHover = false,
  striped = false,
  dense = false,
  fixedHeader = false,
  fixedHeaderScrollHeight = null,
  progressPending = false,
  progressComponent,
  noDataComponent,
  subHeader = false,
  subHeaderComponent = null,
  className = '',
  defaultSortFieldId = null,
  defaultSortAsc = true,
  onRowClicked = null,
  onSort = null,
}) => {
  // 1. Internal Sort State
  const [sortFieldId, setSortFieldId] = useState(defaultSortFieldId);
  const [sortDirection, setSortDirection] = useState(defaultSortAsc ? 'asc' : 'desc');

  // 2. Internal Pagination State
  const [currentPage, setCurrentPage] = useState(paginationDefaultPage);
  const [rowsPerPage, setRowsPerPage] = useState(paginationPerPage);

  const [prevDefaultPage, setPrevDefaultPage] = useState(paginationDefaultPage);
  if (paginationDefaultPage !== prevDefaultPage) {
    setPrevDefaultPage(paginationDefaultPage);
    setCurrentPage(paginationDefaultPage);
  }

  // Sync rowsPerPage if parent changes paginationPerPage
  const [prevPropRpp, setPrevPropRpp] = useState(paginationPerPage);
  if (paginationPerPage !== prevPropRpp) {
    setPrevPropRpp(paginationPerPage);
    const parsedRpp = paginationPerPage === 'All' ? 100000 : Number(paginationPerPage);
    setRowsPerPage(parsedRpp);
    setCurrentPage(1);
  }

  // 3. Row Selection State
  const [selectedRowKeys, setSelectedRowKeys] = useState(new Set());
  const headerCheckboxRef = useRef(null);

  const tableContainerRef = useRef(null);

  // Handle Header Sort Click
  const handleSort = (column, index) => {
    if (!column.sortable) return;
    const colId = column.id || column.name || index;

    if (sortFieldId === colId) {
      const nextDir = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(nextDir);
      if (typeof onSort === 'function') {
        onSort(column, nextDir);
      }
    } else {
      setSortFieldId(colId);
      setSortDirection('asc');
      if (typeof onSort === 'function') {
        onSort(column, 'asc');
      }
    }
  };

  // Find active sort column object
  const activeSortColumn = useMemo(() => {
    if (!sortFieldId) return null;
    return columns.find((c, idx) => (c.id || c.name || idx) === sortFieldId) || null;
  }, [columns, sortFieldId]);

  // 4. Sorted Data Pipeline
  const sortedData = useMemo(() => {
    if (!activeSortColumn || !activeSortColumn.sortable) {
      return data;
    }

    return [...data].sort((a, b) => {
      if (typeof activeSortColumn.sortFunction === 'function') {
        const customRes = activeSortColumn.sortFunction(a, b);
        return sortDirection === 'asc' ? customRes : -customRes;
      }

      if (typeof activeSortColumn.selector === 'function') {
        let aVal = activeSortColumn.selector(a);
        let bVal = activeSortColumn.selector(b);

        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comp = aVal.localeCompare(bVal);
          return sortDirection === 'asc' ? comp : -comp;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      return 0;
    });
  }, [data, activeSortColumn, sortDirection]);

  // 5. Paginated Slice with Derived Bounds Clamping
  const totalEntries = paginationServer ? (paginationTotalRows || sortedData.length) : sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / rowsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;

  const paginatedRows = useMemo(() => {
    if (!pagination) return sortedData;
    // If the server already returned only the page slice (<= rowsPerPage and fewer than totalEntries)
    if (paginationServer && sortedData.length <= rowsPerPage && sortedData.length < totalEntries) {
      return sortedData;
    }
    // Otherwise slice the current page locally
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, pagination, paginationServer, startIndex, rowsPerPage, totalEntries]);

  // 6. Master Checkbox Indeterminate & Checked Handling
  const pageRowKeys = useMemo(() => {
    return paginatedRows.map((r, i) => (r[keyField] !== undefined ? r[keyField] : `${safePage}-${i}`));
  }, [paginatedRows, keyField, safePage]);

  const allPageRowsSelected = pageRowKeys.length > 0 && pageRowKeys.every((k) => selectedRowKeys.has(k));
  const somePageRowsSelected = pageRowKeys.some((k) => selectedRowKeys.has(k)) && !allPageRowsSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = somePageRowsSelected;
    }
  }, [somePageRowsSelected]);

  // Toggle Master Checkbox (Select/Deselect all rows on current page)
  const handleToggleSelectAll = () => {
    setSelectedRowKeys((prev) => {
      const next = new Set(prev);
      if (allPageRowsSelected) {
        pageRowKeys.forEach((k) => next.delete(k));
      } else {
        pageRowKeys.forEach((k) => next.add(k));
      }

      if (onSelectedRowsChange) {
        const selectedItems = data.filter((row, i) => {
          const key = row[keyField] !== undefined ? row[keyField] : `${safePage}-${i}`;
          return next.has(key);
        });
        onSelectedRowsChange({
          allSelected: next.size === data.length && data.length > 0,
          selectedCount: next.size,
          selectedRows: selectedItems,
        });
      }
      return next;
    });
  };

  // Toggle Single Row Selection
  const handleToggleRowSelect = (key) => {
    setSelectedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      if (onSelectedRowsChange) {
        const selectedItems = data.filter((r, i) => {
          const rKey = r[keyField] !== undefined ? r[keyField] : `${safePage}-${i}`;
          return next.has(rKey);
        });
        onSelectedRowsChange({
          allSelected: next.size === data.length && data.length > 0,
          selectedCount: next.size,
          selectedRows: selectedItems,
        });
      }
      return next;
    });
  };

  // Pagination Handlers
  const goToPage = (page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    if (onChangePage) onChangePage(validPage);
  };

  const handleRowsPerPageChange = (val) => {
    const newRpp = val === 'All' ? 100000 : Number(val);
    setRowsPerPage(newRpp);
    setCurrentPage(1);
    if (onChangeRowsPerPage) onChangeRowsPerPage(val === 'All' ? 'All' : newRpp, 1);
  };

  return (
    <div className={`w-full bg-white border-2 border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col transition-all ${className}`}>
      {/* Optional SubHeader / Actions Toolbar */}
      {subHeader && subHeaderComponent && (
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-slate-50/40 shrink-0">
          {subHeaderComponent}
        </div>
      )}

      {/* Table Container with Custom Scrollbar & Standard Text Selection */}
      <div
        ref={tableContainerRef}
        className={`overflow-x-auto w-full relative custom-scrollbar select-text ${fixedHeader ? 'overflow-y-auto flex-1 min-h-0' : ''}`}
        style={fixedHeader && fixedHeaderScrollHeight ? { maxHeight: fixedHeaderScrollHeight } : undefined}
      >
        <table className="w-full text-left border-collapse">
          {/* Table Header (<thead>) */}
          <thead className={fixedHeader ? 'sticky top-0 z-20 bg-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : ''}>
            <tr className="bg-slate-100 border-b-2 border-slate-200 text-[11px] font-bold text-slate-700 select-none">
              {/* Optional Master Checkbox Header */}
              {selectableRows && (
                <th className="py-3 px-3.5 text-center w-11">
                  <div className="flex items-center justify-center">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allPageRowsSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-[#00a8e7] border-slate-300 focus:ring-[#00a8e7]/30 cursor-pointer transition-all"
                      title="Select all on this page"
                    />
                  </div>
                </th>
              )}

              {/* Data Columns */}
              {columns.map((col, idx) => {
                const colId = col.id || col.name || idx;
                const isSorted = sortFieldId === colId;
                const isSortable = col.sortable !== false && col.sortable !== undefined;

                return (
                  <th
                    key={colId}
                    onClick={() => handleSort(col, idx)}
                    style={{
                      width: col.width || 'auto',
                      minWidth: col.minWidth || 'auto',
                      maxWidth: col.maxWidth || 'auto',
                    }}
                    className={`${dense ? 'py-2 px-3' : 'py-3 px-3.5'} text-[11px] font-bold transition-colors select-none ${fixedHeader ? 'bg-slate-100' : ''} ${
                      col.center ? 'text-center' : col.right ? 'text-right' : 'text-left'
                    } ${
                      isSortable
                        ? 'cursor-pointer group hover:text-slate-900 hover:bg-slate-200/50'
                        : 'text-slate-700'
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.center ? 'justify-center' : col.right ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span className={isSorted ? 'text-[#00a8e7] font-extrabold' : 'text-slate-700'}>
                        {col.name}
                      </span>
                      {isSortable && (
                        <span className="shrink-0 transition-opacity">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#00a8e7] stroke-[2.5]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#00a8e7] stroke-[2.5]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 stroke-[2] opacity-80 group-hover:opacity-100 transition-all" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body (<tbody>) */}
          <tbody className="divide-y divide-slate-200/80 text-[11px] font-semibold text-slate-800">
            {/* 1. Progress Pending / Loading Skeleton */}
            {progressPending ? (
              progressComponent ? (
                <tr>
                  <td colSpan={columns.length + (selectableRows ? 1 : 0)} className="py-12 text-center">
                    {progressComponent}
                  </td>
                </tr>
              ) : (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={`skel-row-${rIdx}`} className="animate-pulse bg-slate-50/40">
                    {selectableRows && (
                      <td className="py-3.5 px-3.5 text-center">
                        <div className="w-4 h-4 rounded bg-slate-200 mx-auto" />
                      </td>
                    )}
                    {columns.map((col, cIdx) => (
                      <td key={`skel-col-${cIdx}`} className="py-3.5 px-3.5">
                        <div
                          className="h-3.5 bg-slate-200/80 rounded-md"
                          style={{ width: `${Math.floor(40 + (cIdx * 17) % 50)}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )
            ) : paginatedRows.length === 0 ? (
              /* 2. Empty State */
              <tr>
                <td colSpan={columns.length + (selectableRows ? 1 : 0)} className="py-14 text-center">
                  {noDataComponent || (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Inbox className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">There are no records to display</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters, search keywords, or store criteria</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              /* 3. Render Table Rows */
              paginatedRows.map((row, rowIdx) => {
                const rowKey = row[keyField] !== undefined ? row[keyField] : `${safePage}-${rowIdx}`;
                const isSelected = selectedRowKeys.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    onClick={(e) => {
                      if (onRowClicked) onRowClicked(row, e);
                    }}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-[#00a8e7]/8 hover:bg-[#00a8e7]/12'
                        : striped && rowIdx % 2 === 1
                        ? 'bg-slate-50/40'
                        : 'bg-white'
                    } ${highlightOnHover ? 'hover:bg-slate-50/80' : ''} ${
                      pointerOnHover || onRowClicked ? 'cursor-pointer' : ''
                    }`}
                  >
                    {/* Row Checkbox */}
                    {selectableRows && (
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="py-3 px-3.5 text-center w-11"
                      >
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRowSelect(rowKey)}
                            className="w-4 h-4 rounded text-[#00a8e7] border-slate-300 focus:ring-[#00a8e7]/30 cursor-pointer transition-all"
                          />
                        </div>
                      </td>
                    )}

                    {/* Row Cells */}
                    {columns.map((col, colIdx) => {
                      const colId = col.id || col.name || colIdx;
                      const cellValue =
                        typeof col.cell === 'function'
                          ? col.cell(row, startIndex + rowIdx)
                          : typeof col.selector === 'function'
                          ? col.selector(row, startIndex + rowIdx)
                          : row[col.selector] || '';

                      return (
                        <td
                          key={colId}
                          className={`${dense ? 'py-2 px-3' : 'py-3 px-3.5'} align-middle text-[11px] font-semibold text-slate-800 ${
                            col.center ? 'text-center' : col.right ? 'text-right' : 'text-left'
                          } ${col.wrap ? 'whitespace-normal' : 'whitespace-nowrap'}`}
                        >
                          {cellValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* React DataTable Pagination Footer */}
      {pagination && (
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Bounds & Selection Indicator */}
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            {selectableRows && selectedRowKeys.size > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#00a8e7]/10 text-[#0088cc] rounded-lg font-bold">
                {selectedRowKeys.size} {selectedRowKeys.size === 1 ? 'row' : 'rows'} selected
                <button
                  type="button"
                  onClick={() => setSelectedRowKeys(new Set())}
                  className="ml-1.5 text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Clear
                </button>
              </span>
            ) : (
              <span>
                Showing{' '}
                <span className="font-bold text-slate-800">
                  {totalEntries === 0 ? 0 : startIndex + 1}
                </span>{' '}
                to{' '}
                <span className="font-bold text-slate-800">
                  {Math.min(startIndex + rowsPerPage, totalEntries)}
                </span>{' '}
                of <span className="font-bold text-slate-800">{totalEntries}</span> records
              </span>
            )}
          </div>

          {/* Right: React DataTable Iconic Controls (Rows Per Page + Range + Chevrons) */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-end">
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Rows per page:</span>
              <div className="relative inline-block">
                <select
                  value={rowsPerPage >= 10000 ? 'All' : rowsPerPage}
                  onChange={(e) => handleRowsPerPageChange(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg pl-2.5 pr-6 py-1 text-xs font-bold text-slate-700 outline-none focus:border-[#00a8e7] cursor-pointer shadow-2xs transition-colors hover:border-slate-300"
                >
                  {paginationRowsPerPageOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-600 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
              </div>
            </div>

            {/* Range Text (e.g. 1-10 of 35) */}
            <span className="text-slate-600 font-semibold tabular-nums">
              {totalEntries === 0
                ? '0-0 of 0'
                : `${startIndex + 1}-${Math.min(startIndex + rowsPerPage, totalEntries)} of ${totalEntries}`}
            </span>

            {/* Nav Controls: First |<, Prev <, Next >, Last >| */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => goToPage(1)}
                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => goToPage(safePage - 1)}
                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numbered Page Buttons */}
              <div className="hidden md:flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (safePage <= 3) {
                    pageNum = i + 1;
                  } else if (safePage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = safePage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => goToPage(pageNum)}
                      className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        safePage === pageNum
                          ? 'bg-[#00a8e7] text-white shadow-xs shadow-sky-500/25'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={safePage === totalPages || totalEntries === 0}
                onClick={() => goToPage(safePage + 1)}
                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage === totalPages || totalEntries === 0}
                onClick={() => goToPage(totalPages)}
                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
