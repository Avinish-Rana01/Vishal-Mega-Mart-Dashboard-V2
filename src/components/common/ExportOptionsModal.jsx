import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Calendar, Clock, Filter, X, Download, AlertCircle } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import './ExportOptionsModal.css';

/**
 * Beautiful, modern modal dialog for selecting date ranges and filter options
 * before exporting reports to Excel (.xlsx).
 */
export default function ExportOptionsModal({
  isOpen = false,
  onClose,
  onConfirm,
  reportName = '',
  totalRecords = 0,
  searchTerm = '',
  currentFromDate = '',
  currentToDate = '',
  isExporting = false
}) {
  const [selectedPreset, setSelectedPreset] = useState('full'); // 'full' | 'last7' | 'thisMonth' | 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [applySearchFilter, setApplySearchFilter] = useState(Boolean(searchTerm?.trim()));

  // Reset preset and dates when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPreset('full');
      setApplySearchFilter(Boolean(searchTerm?.trim()));
      
      const today = new Date().toISOString().split('T')[0];
      setCustomTo(currentToDate || today);
      setCustomFrom(currentFromDate || today);
    }
  }, [isOpen, searchTerm, currentFromDate, currentToDate]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  // Compute calculated date ranges for previews
  const datePreviews = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Last 7 days
    const last7 = new Date(now);
    last7.setDate(last7.getDate() - 7);
    const last7Str = last7.toISOString().split('T')[0];

    // This month (1st of month to today)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    return {
      today: todayStr,
      last7: { from: last7Str, to: todayStr },
      thisMonth: { from: monthStartStr, to: todayStr }
    };
  }, []);

  if (!isOpen) return null;

  const handleDownload = () => {
    let fromDate = '';
    let toDate = '';

    if (selectedPreset === 'last7') {
      fromDate = datePreviews.last7.from;
      toDate = datePreviews.last7.to;
    } else if (selectedPreset === 'thisMonth') {
      fromDate = datePreviews.thisMonth.from;
      toDate = datePreviews.thisMonth.to;
    } else if (selectedPreset === 'custom') {
      fromDate = customFrom;
      toDate = customTo;
    }
    // For 'full', fromDate and toDate stay empty (''), backend defaults to full lifetime range

    onConfirm({
      preset: selectedPreset,
      fromDate,
      toDate,
      searchTerm: applySearchFilter ? (searchTerm?.trim() || '') : ''
    });
  };

  return (
    <div className="vmm-export-modal-backdrop" onClick={() => !isExporting && onClose()}>
      <div className="vmm-export-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vmm-export-modal-header">
          <div className="vmm-export-modal-title-box">
            <div className="vmm-export-icon-badge">
              <FileSpreadsheet size={22} className="vmm-excel-icon" />
            </div>
            <div>
              <h3 className="vmm-export-title">Export to Excel (.xlsx)</h3>
              <p className="vmm-export-subtitle">
                Select your preferred export range & filters
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="vmm-export-close-btn" 
            onClick={onClose} 
            disabled={isExporting}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="vmm-export-modal-body">
          <div className="vmm-export-section-label">
            <span>DATE RANGE PRESET</span>
          </div>

          <div className="vmm-export-presets-grid">
            {/* 1. Full Time */}
            <div 
              className={`vmm-export-preset-card ${selectedPreset === 'full' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('full')}
            >
              <div className="vmm-preset-header">
                <div className="vmm-preset-radio">
                  <div className="vmm-radio-dot" />
                </div>
                <span className="vmm-preset-title">Full Time (All Data)</span>
                <span className="vmm-preset-recommended-badge">Recommended</span>
              </div>
              <div className="vmm-preset-desc">
                Export 100% of historical records without date boundaries
              </div>
            </div>

            {/* 2. Last 7 Days */}
            <div 
              className={`vmm-export-preset-card ${selectedPreset === 'last7' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('last7')}
            >
              <div className="vmm-preset-header">
                <div className="vmm-preset-radio">
                  <div className="vmm-radio-dot" />
                </div>
                <span className="vmm-preset-title">Last 7 Days</span>
              </div>
              <div className="vmm-preset-desc">
                {datePreviews.last7.from} to {datePreviews.last7.to}
              </div>
            </div>

            {/* 3. This Month */}
            <div 
              className={`vmm-export-preset-card ${selectedPreset === 'thisMonth' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('thisMonth')}
            >
              <div className="vmm-preset-header">
                <div className="vmm-preset-radio">
                  <div className="vmm-radio-dot" />
                </div>
                <span className="vmm-preset-title">This Month</span>
              </div>
              <div className="vmm-preset-desc">
                {datePreviews.thisMonth.from} to {datePreviews.thisMonth.to}
              </div>
            </div>

            {/* 4. Custom Range */}
            <div 
              className={`vmm-export-preset-card ${selectedPreset === 'custom' ? 'active' : ''}`}
              onClick={() => setSelectedPreset('custom')}
            >
              <div className="vmm-preset-header">
                <div className="vmm-preset-radio">
                  <div className="vmm-radio-dot" />
                </div>
                <span className="vmm-preset-title">Custom Date Range</span>
              </div>
              <div className="vmm-preset-desc">
                Choose a specific start and end date
              </div>
            </div>
          </div>

          {/* Custom Date Pickers if selected */}
          {selectedPreset === 'custom' && (
            <div className="vmm-export-custom-dates-row">
              <div className="vmm-custom-date-field">
                <label>From Date</label>
                <CustomDatePicker
                  value={customFrom}
                  onChange={(val) => setCustomFrom(val)}
                  maxDate={customTo || undefined}
                  placeholder="Select From Date"
                />
              </div>
              <div className="vmm-custom-date-field">
                <label>To Date</label>
                <CustomDatePicker
                  value={customTo}
                  onChange={(val) => setCustomTo(val)}
                  minDate={customFrom || undefined}
                  placeholder="Select To Date"
                />
              </div>
            </div>
          )}

          {/* Active Search Keyword Filter Option */}
          {searchTerm && searchTerm.trim() && (
            <div 
              className={`vmm-export-search-toggle ${applySearchFilter ? 'checked' : ''}`}
              onClick={() => setApplySearchFilter(!applySearchFilter)}
            >
              <input
                type="checkbox"
                checked={applySearchFilter}
                onChange={(e) => setApplySearchFilter(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="vmm-search-toggle-label">
                <span className="vmm-toggle-title">
                  Filter by active search: <strong>"{searchTerm.trim()}"</strong>
                </span>
                <span className="vmm-toggle-subtitle">
                  {applySearchFilter 
                    ? 'Only records matching this keyword will be exported' 
                    : 'Unchecked: all records in the date range will be exported'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="vmm-export-modal-footer">
          <button 
            type="button" 
            className="vmm-export-btn-cancel" 
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="vmm-export-btn-confirm" 
            onClick={handleDownload}
            disabled={isExporting}
          >
            <Download size={15} className="vmm-btn-download-icon" />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
