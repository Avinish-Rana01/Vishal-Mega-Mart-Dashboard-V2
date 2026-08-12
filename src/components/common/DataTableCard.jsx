import React, { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import BaseDataTable from './BaseDataTable';

const now = new Date();
const defaultDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
const defaultDate = now.toISOString().split('T')[0];

export default function DataTableCard({
  title,
  day = defaultDay,
  date = defaultDate,
  columns = [],
  data = [],
  totals = null,
  isLoading = false,
  error = null,
  onRefresh = null,
  onSearch = null,
  summaryActions = null,
  toolbarLeft = null,
  searchPlaceholder = 'Search Records',
  fullWidth = false,
  skeletonRowsCount = 4,
  onRowClick = null,
  striped = true,
  enablePagination = false,
  pageSize = 10
}) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className={`vmm-card ${fullWidth ? 'vmm-card-full-width' : ''}`}>
      <div className="vmm-card-header">
        <span className="vmm-card-title">{title}</span>
        <div className="vmm-card-meta">
          <span className="vmm-meta-btn1">{day}</span>
          <span className="vmm-meta-btn">{date}</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px 4px'
              }}
              title="Refresh Data"
            >
              <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
            </button>
          )}
        </div>
      </div>

      <div className="vmm-card-body">
        {error && (
          <div
            style={{
              fontSize: 11,
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '4px 10px',
              borderRadius: 4,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {summaryActions && (
          <div className="vmm-summary-actions" style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {summaryActions}
          </div>
        )}

        <div className="vmm-table-toolbar">
          <div className="vmm-toolbar-left">
            {toolbarLeft}
          </div>
          <div className="vmm-toolbar-right">
            <div className="vmm-search-input">
              <span>Search:</span>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  if (onSearch) {
                    onSearch(val);
                  }
                }}
              />
            </div>
          </div>
        </div>

        <BaseDataTable
          columns={columns}
          data={data}
          totals={totals}
          isLoading={isLoading}
          skeletonRowsCount={skeletonRowsCount}
          onRowClick={onRowClick}
          striped={striped}
          enablePagination={enablePagination}
          pageSize={pageSize}
          domConfig='<"top">rt<"bottom"ip><"clear">'
          searching={false}
          lengthChange={false}
        />
      </div>
    </div>
  );
}
