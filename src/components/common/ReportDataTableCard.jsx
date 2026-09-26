import React, { useState, useMemo, useEffect, useRef } from 'react';
import BaseDataTable from './BaseDataTable';
import ExportOptionsModal from './ExportOptionsModal';
import { useStreamingExport } from '../../hooks/useStreamingExport';
import { getActiveUserId } from '../../services/stockService';
import './LiveStockDataTable.css';

export default function ReportDataTableCard({
  columns = [],
  data = [],
  isLoading = false,
  isRefreshing = false,
  skeletonRowsCount = 10,
  striped = true,
  onRowClick = null,
  totals = null,
  pageIndex = 1,
  onPageChange = null,
  pageSize = 10,
  onPageSizeChange = null,
  totalRecords = 0,
  exportFileName = "Report.xlsx",
  onSearch = null,
  searchPlaceholder = "Search Records",
  searchValue = undefined,
  onSortChange = null,
  sortColumn = null,
  sortDirection = null,
  reportName = null,
  exportParams = {}
}) {
  const [internalSearch, setInternalSearch] = useState(searchValue || '');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  const prevSearchRef = useRef(searchValue || '');
  const isMountedRef = useRef(false);

  // Keep internalSearch in sync if controlled searchValue changes
  useEffect(() => {
    if (searchValue !== undefined) {
      setInternalSearch(searchValue);
      prevSearchRef.current = searchValue;
    }
  }, [searchValue]);

  // Debounce server-side search callback if provided (only when search text actually changes)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    if (prevSearchRef.current === internalSearch) {
      return;
    }
    prevSearchRef.current = internalSearch;

    if (!onSearchRef.current) return;

    const handler = setTimeout(() => {
      onSearchRef.current?.(internalSearch);
      if (onPageChangeRef.current) {
        onPageChangeRef.current(1);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [internalSearch]);

  // Maintain previously loaded rows so pagination / sorting swaps data seamlessly without showing skeleton
  const [displayData, setDisplayData] = useState(data || []);

  useEffect(() => {
    if (data && data.length > 0) {
      setDisplayData(data);
    } else if (!isLoading && !isRefreshing) {
      // Only set to empty if loading has finished and the result is truly empty
      setDisplayData([]);
    }
  }, [data, isLoading, isRefreshing]);

  // Filter Data Internally only if onSearch is NOT provided (client-side fallback)
  const filteredData = useMemo(() => {
    const sourceData = (data && data.length > 0) ? data : displayData;
    if (onSearch || !internalSearch.trim()) return sourceData;
    const term = internalSearch.toLowerCase();
    return sourceData.filter((row) => {
      return columns.some((col) => {
        const val = row[col.key];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
      });
    });
  }, [data, displayData, internalSearch, columns, onSearch]);

  const { isExporting, progressPercent, exportError, startExport, cancelExport } = useStreamingExport();

  // Triggered when user clicks "Export Data To Excel" button in toolbar
  const handleExportButtonClick = () => {
    if (reportName) {
      setIsExportModalOpen(true);
      return;
    }
    handleExportCSV();
  };

  // Triggered when user confirms from the ExportOptionsModal
  const handleModalExportConfirm = ({ preset, fromDate, toDate, searchTerm: modalSearchTerm }) => {
    setIsExportModalOpen(false);

    const activeUid = getActiveUserId();
    const params = new URLSearchParams();
    params.append('reportName', reportName);
    params.append('format', 'xlsx');

    // Bind base exportParams (e.g. storeCode, vendorCode, etc.), excluding dates
    if (exportParams && typeof exportParams === 'object') {
      Object.entries(exportParams).forEach(([k, v]) => {
        if (k.toLowerCase() === 'fromdate' || k.toLowerCase() === 'todate') {
          return; // Modal selection takes absolute precedence
        }
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          params.append(k, String(v).trim());
        }
      });
    }

    // Apply the chosen dates from the modal (if preset is full, fromDate/toDate stay empty -> full lifetime)
    if (fromDate) {
      params.append('fromDate', fromDate);
    }
    if (toDate) {
      params.append('toDate', toDate);
    }

    // Ensure userId is present for role-based scoping
    if (!params.has('userId') && !params.has('user')) {
      if (activeUid) {
        params.append('userId', String(activeUid));
      }
    }

    // Apply search filter if selected in modal
    if (modalSearchTerm && modalSearchTerm.trim()) {
      params.append('searchTerm', modalSearchTerm.trim());
    }

    // Ensure current sorting is passed if applicable
    if (sortColumn && !params.has('sortColumn')) {
      params.append('sortColumn', sortColumn);
    }
    if (sortDirection && !params.has('sortDirection')) {
      params.append('sortDirection', sortDirection);
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const downloadUrl = `${apiBase}/api/reports/export?${params.toString()}`;
    const defaultName = (exportFileName && exportFileName.toLowerCase().endsWith('.xlsx'))
      ? exportFileName
      : `${reportName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    startExport({
      downloadUrl,
      fileName: defaultName,
      totalRecords,
      onNoData: () => {
        setToastMessage({
          title: 'No Records Found',
          message: 'No data exists for the selected date range and filter criteria. Export cancelled.'
        });
        setTimeout(() => setToastMessage(null), 5000);
      },
      onError: (err) => {
        setToastMessage({
          title: 'Export Failed',
          message: err.message || 'An error occurred while streaming report.'
        });
        setTimeout(() => setToastMessage(null), 5000);
      }
    });
  };

  // Handle Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    // Headers
    const headers = columns.map(c => c.label).join(',');
    
    // Rows
    const csvRows = filteredData.map(row => {
      return columns.map(col => {
        let val = row[col.key];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""'); // escape quotes
        return `"${val}"`;
      }).join(',');
    });

    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", exportFileName || "Report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pageSizeOptions = [10, 25, 50, 100];

  const effectiveTotal = onSearch ? totalRecords : (internalSearch.trim() ? filteredData.length : totalRecords);
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  // Clamp pageIndex if out of bounds (e.g. after filter reduces count or pageSize increases)
  useEffect(() => {
    if (effectiveTotal > 0 && pageIndex > totalPages && onPageChange) {
      onPageChange(totalPages);
    }
  }, [effectiveTotal, pageIndex, totalPages, onPageChange]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, pageIndex - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };
  const pageNumbers = getPageNumbers();

  const isDataEmpty = onSearch ? data.length === 0 : filteredData.length === 0;
  const startEntry = effectiveTotal === 0 || isDataEmpty ? 0 : Math.min((pageIndex - 1) * pageSize + 1, effectiveTotal);
  const endEntry = effectiveTotal === 0 || isDataEmpty ? 0 : Math.min(pageIndex * pageSize, effectiveTotal);

  return (
    <div className="ls-table-wrapper">
      
      <div className="ls-toolbar-top">
        <div className="ls-toolbar-left">
          {isExporting ? (
            <div className="ls-export-progress-container" title="Exporting Excel (.xlsx)">
              <div className="ls-export-progress-track">
                <div 
                  className={`ls-export-progress-bar ${progressPercent > 0 ? '' : 'indeterminate'}`} 
                  style={{ width: `${Math.max(5, progressPercent)}%` }} 
                />
              </div>
              <div className="ls-export-progress-label">
                <svg className="ls-export-spinner animate-spin" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
                <span>
                  {progressPercent > 0 && progressPercent < 100
                    ? `Exporting: ${progressPercent}%`
                    : 'Exporting Excel...'}
                </span>
                <button 
                  type="button" 
                  className="ls-export-cancel-btn" 
                  onClick={cancelExport} 
                  title="Cancel Export"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="ls-export-btn" 
              onClick={handleExportButtonClick}
              disabled={isLoading || isRefreshing}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'text-bottom' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Data To Excel
            </button>
          )}
          
          <div className="ls-entries-select">
            <span>Show</span>
            
            <div className="custom-select-container" style={{ position: 'relative' }}>
              <div 
                className={`custom-select-trigger ${isDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {pageSize}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              
              {isDropdownOpen && (
                <>
                  <div 
                    className="custom-select-backdrop" 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="custom-select-menu">
                    {pageSizeOptions.map(option => (
                      <div 
                        key={option} 
                        className={`custom-select-option ${pageSize === option ? 'selected' : ''}`}
                        onClick={() => {
                          if (onPageSizeChange) {
                            onPageSizeChange(option);
                          }
                          if (onPageChange) {
                            onPageChange(1);
                          }
                          setIsDropdownOpen(false);
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span>entries</span>
          </div>
        </div>
        
        <div className="ls-search-box">
          <span>Search:</span>
          <input 
            type="text" 
            placeholder={searchPlaceholder} 
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
          />
        </div>
      </div>

      <BaseDataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading || isRefreshing}
        skeletonRowsCount={skeletonRowsCount}
        onRowClick={onRowClick}
        striped={striped}
        totals={totals}
        enablePagination={false}
        searching={false}
        lengthChange={false}
        domConfig='<"top">rt<"clear">'
        containerClassName="vmm-table-container"
        tableClassName="vmm-table"
        onSortChange={onSortChange}
        externalSortCol={sortColumn}
        externalSortDir={sortDirection}
      />
      
      <div className="ls-toolbar-bottom">
        <div className="ls-pagination-info">
          Showing {startEntry} to {endEntry} of {effectiveTotal.toLocaleString('en-IN')} entries
        </div>
        
        {totalPages > 1 && (
          <div className="ls-pagination-controls">
            <button 
              className="ls-page-btn" 
              onClick={() => !isLoading && onPageChange && onPageChange(pageIndex - 1)}
              disabled={pageIndex <= 1}
            >
              Previous
            </button>
            
            {pageNumbers[0] > 1 && (
              <>
                <button 
                  className="ls-page-btn" 
                  onClick={() => !isLoading && onPageChange && onPageChange(1)}
                >
                  1
                </button>
                {pageNumbers[0] > 2 && <span className="ls-page-ellipsis">...</span>}
              </>
            )}

            {pageNumbers.map(pg => (
              <button 
                key={pg} 
                className={`ls-page-btn ${pageIndex === pg ? 'active' : ''}`}
                onClick={() => !isLoading && onPageChange && onPageChange(pg)}
              >
                {pg}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="ls-page-ellipsis">...</span>}
                <button 
                  className="ls-page-btn" 
                  onClick={() => !isLoading && onPageChange && onPageChange(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}
            
            <button 
              className="ls-page-btn" 
              onClick={() => !isLoading && onPageChange && onPageChange(pageIndex + 1)}
              disabled={pageIndex >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Export Range & Filter Selection Modal */}
      <ExportOptionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleModalExportConfirm}
        reportName={reportName}
        totalRecords={totalRecords}
        searchTerm={internalSearch}
        currentFromDate={exportParams?.fromDate || exportParams?.fromdate}
        currentToDate={exportParams?.toDate || exportParams?.todate}
        isExporting={isExporting}
      />

      {/* Floating Warning Toast Notification for 0 records */}
      {toastMessage && (
        <div className="vmm-floating-toast warning">
          <div className="vmm-toast-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="vmm-toast-content">
            <div className="vmm-toast-title">{toastMessage.title}</div>
            <div className="vmm-toast-message">{toastMessage.message}</div>
          </div>
          <button 
            type="button" 
            className="vmm-toast-close" 
            onClick={() => setToastMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
