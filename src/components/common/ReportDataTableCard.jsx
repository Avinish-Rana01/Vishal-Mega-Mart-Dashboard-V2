import React, { useState, useMemo, useEffect, useRef } from 'react';
import BaseDataTable from './BaseDataTable';
import './LiveStockDataTable.css';

export default function ReportDataTableCard({
  columns = [],
  data = [],
  isLoading = false,
  skeletonRowsCount = 10,
  striped = true,
  onRowClick = null,
  totals = null,
  pageIndex = 1,
  onPageChange = null,
  pageSize = 10,
  onPageSizeChange = null,
  totalRecords = 0,
  exportFileName = "Report.csv",
  onSearch = null,
  searchPlaceholder = "Search Records",
  searchValue = undefined,
  onSortChange = null,
  sortColumn = null,
  sortDirection = null
}) {
  const [internalSearch, setInternalSearch] = useState(searchValue || '');
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

  // Filter Data Internally only if onSearch is NOT provided (client-side fallback)
  const filteredData = useMemo(() => {
    if (onSearch || !internalSearch.trim()) return data;
    const term = internalSearch.toLowerCase();
    return data.filter((row) => {
      return columns.some((col) => {
        const val = row[col.key];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
      });
    });
  }, [data, internalSearch, columns, onSearch]);

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
          <button className="ls-export-btn" onClick={handleExportCSV}>
            Export Data To Excel
          </button>
          
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
        isLoading={isLoading}
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

    </div>
  );
}
