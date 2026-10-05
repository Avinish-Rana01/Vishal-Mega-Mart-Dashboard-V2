import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Download, CheckCircle, AlertTriangle, RotateCcw, FileSpreadsheet, Loader2, Sparkles, Layers } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import ConfirmUploadModal from '../../components/common/ConfirmUploadModal';
import { uploadDispatchFile, parseExcelPreview, downloadTemplate, validateExcelFileFormat } from '../../services/dispatchService';
import './DispatchMasterUploadPage.css';

export default function DispatchMasterUploadPage() {
  const navigate = useNavigate();
  const [masterType, setMasterType] = useState('HU_INPUT'); // 'RDC_MASTER' or 'HU_INPUT'
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);

  const [previewPageIndex, setPreviewPageIndex] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(15);
  const [previewSearchTerm, setPreviewSearchTerm] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const fileInputRef = useRef(null);

  const handleMasterTypeChange = (newType) => {
    setMasterType(newType);
    handleClear();
  };

  const processSelectedFile = async (file) => {
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      setValidationError('Only .xlsx and .xls files are allowed.');
      setSelectedFile(null);
      setFileName('No file chosen');
      setPreviewRows([]);
      setPreviewHeaders([]);
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setValidationError('');
    setUploadResult(null);
    setIsParsing(true);
    setPreviewPageIndex(1);
    setPreviewSearchTerm('');

    try {
      const { headers, rows } = await parseExcelPreview(file);
      setPreviewHeaders(headers);
      setPreviewRows(rows);

      // Validate against the exact Demo Excels specification
      const validation = validateExcelFileFormat(masterType, headers, rows);
      if (!validation.isValid) {
        setValidationError(validation.error);
      }
    } catch (err) {
      console.error('Failed to parse Excel file', err);
      setValidationError('Failed to read Excel file. Please ensure it is a valid, uncorrupted Excel workbook.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setFileName('No file chosen');
    setPreviewHeaders([]);
    setPreviewRows([]);
    setValidationError('');
    setUploadResult(null);
    setPreviewPageIndex(1);
    setPreviewSearchTerm('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (!selectedFile) {
      setValidationError('Please select an Excel file before clicking Upload.');
      return;
    }
    if (validationError) {
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmUpload = async () => {
    setIsUploading(true);
    setValidationError('');
    setUploadResult(null);

    try {
      const result = await uploadDispatchFile(selectedFile, masterType);
      setUploadResult(result);
      setIsConfirmModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'An error occurred during file upload.';
      setValidationError(msg);
      setIsConfirmModalOpen(false);
    } finally {
      setIsUploading(false);
    }
  };

  // Filter preview rows client-side based on search term
  const filteredPreviewRows = useMemo(() => {
    if (!previewSearchTerm.trim()) return previewRows;
    const term = previewSearchTerm.toLowerCase();
    return previewRows.filter((row) => {
      return previewHeaders.some((col) => {
        const val = row[col];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
      });
    });
  }, [previewRows, previewSearchTerm, previewHeaders]);

  // Client-side pagination slicing
  const paginatedPreviewRows = useMemo(() => {
    const start = (previewPageIndex - 1) * previewPageSize;
    return filteredPreviewRows.slice(start, start + previewPageSize);
  }, [filteredPreviewRows, previewPageIndex, previewPageSize]);

  // Convert parsed headers to standard columns for ReportDataTableCard
  const previewColumns = useMemo(() => {
    return previewHeaders.map((head) => ({
      key: head,
      label: head,
      align: 'left',
      sortable: true,
      render: (val) => (val !== undefined && val !== null && String(val).trim() !== '' ? String(val) : '-')
    }));
  }, [previewHeaders]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - <span className="active">DISPATCH TRACKING</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      <div className="dispatch-upload-wrapper">
        {/* Upload Card */}
        <div className="dispatch-upload-card">
          {/* Card Top Header */}
          <div className="dispatch-card-header">
            <div className="dispatch-card-header-left">
              <UploadCloud size={16} />
              <span>DISPATCH MASTER DATA UPLOAD</span>
            </div>
            <span className="dispatch-required-hint">NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
          </div>

          <div className="dispatch-card-body">
            <div className="dispatch-form-row">
              {/* Choose Master Type */}
              <div className="dispatch-field-group">
                <label className="dispatch-label">
                  Choose Master Type <span className="dispatch-star">*</span>
                </label>
                <div className="dispatch-type-toggle-group">
                  <button
                    type="button"
                    className={`dispatch-type-pill ${masterType === 'RDC_MASTER' ? 'active' : ''}`}
                    onClick={() => handleMasterTypeChange('RDC_MASTER')}
                  >
                    <span className="dispatch-type-indicator" />
                    <Layers size={14} />
                    <span>RDC MASTER</span>
                  </button>

                  <button
                    type="button"
                    className={`dispatch-type-pill ${masterType === 'HU_INPUT' ? 'active' : ''}`}
                    onClick={() => handleMasterTypeChange('HU_INPUT')}
                  >
                    <span className="dispatch-type-indicator" />
                    <Sparkles size={14} />
                    <span>HU INPUT</span>
                  </button>
                </div>
              </div>

              {/* Select File */}
              <div className="dispatch-field-group dispatch-file-group">
                <label className="dispatch-label">
                  Select File <span className="dispatch-star">*</span>
                </label>
                <div
                  className={`dispatch-file-box ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processSelectedFile(file);
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="dispatch-native-file-input"
                    id="dispatch-file-input"
                  />
                  <label htmlFor="dispatch-file-input" className="dispatch-choose-btn">
                    <FileSpreadsheet size={15} />
                    <span>Choose File</span>
                  </label>

                  <div className="dispatch-file-info">
                    {selectedFile ? (
                      <>
                        <span className="dispatch-file-name" title={fileName}>{fileName}</span>
                        <span className="dispatch-file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      </>
                    ) : (
                      <span className="dispatch-file-placeholder">No file chosen (or drag & drop .xlsx)</span>
                    )}
                  </div>

                  {selectedFile && (
                    <button
                      type="button"
                      className="dispatch-btn-remove-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      title="Remove selected file"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Buttons on the SAME Line */}
              <div className="dispatch-btn-inline-row">
                <button
                  type="button"
                  className="dispatch-action-btn dispatch-btn-upload"
                  onClick={handleUploadClick}
                  disabled={!selectedFile || isUploading || isParsing || Boolean(validationError)}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="vmm-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      <span>Upload</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="dispatch-action-btn dispatch-btn-clear"
                  onClick={handleClear}
                  disabled={isUploading}
                >
                  <RotateCcw size={15} />
                  <span>Clear</span>
                </button>

                <button
                  type="button"
                  className="dispatch-action-btn dispatch-btn-download"
                  onClick={() => downloadTemplate(masterType)}
                >
                  <Download size={15} />
                  <span>Download File Format ({masterType === 'RDC_MASTER' ? 'RDC Master' : 'HU Input'})</span>
                </button>
              </div>
            </div>

            {/* Parsing Indicator */}
            {isParsing && (
              <div className="dispatch-parsing-badge">
                <Loader2 size={14} className="vmm-spin" />
                <span>Analyzing Excel file preview...</span>
              </div>
            )}

            {/* Validation Error Banner */}
            {validationError && (
              <div className="dispatch-alert-box dispatch-alert-err">
                <AlertTriangle size={16} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Upload Success Banner */}
            {uploadResult && (
              <div className="dispatch-success-banner">
                <div className="dispatch-success-banner-left">
                  <div className="dispatch-success-icon-badge">
                    <CheckCircle size={18} />
                  </div>
                  <div className="dispatch-success-details">
                    <div className="dispatch-success-title">
                      {uploadResult.message || 'Master data processed successfully.'}
                    </div>
                    <div className="dispatch-stat-chips">
                      <span className="dispatch-chip">
                        <span className="chip-label">Total Rows:</span>
                        <span className="chip-value">{uploadResult.totalRows}</span>
                      </span>
                      <span className="chip-divider">•</span>
                      <span className="dispatch-chip chip-highlight">
                        <span className="chip-label">Inserted:</span>
                        <span className="chip-value">{uploadResult.insertedRows}</span>
                      </span>
                      {uploadResult.duplicateRows > 0 && (
                        <>
                          <span className="chip-divider">•</span>
                          <span className="dispatch-chip chip-warning">
                            <span className="chip-label">Duplicates Skipped:</span>
                            <span className="chip-value">{uploadResult.duplicateRows}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="dispatch-banner-close"
                  onClick={() => setUploadResult(null)}
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview Table Card (Renders immediately when file headers are detected) */}
        {selectedFile && previewHeaders.length > 0 && (
          <div className="dispatch-preview-card">
            <div className="dispatch-preview-card-header">
              <div className="dispatch-card-header-left">
                <FileSpreadsheet size={15} />
                <span>EXCEL PREVIEW: {fileName}</span>
              </div>
              <span className="dispatch-preview-badge">
                {previewRows.length > 0 ? `${previewRows.length} Total Data Rows` : 'Header Detected (0 Data Rows)'}
              </span>
            </div>

            {previewRows.length === 0 && (
              <div className="dispatch-alert-box dispatch-alert-info">
                <AlertTriangle size={15} />
                <span>
                  Detected {previewHeaders.length} column headers: [<strong>{previewHeaders.join(', ')}</strong>]. Note: This file contains no data rows.
                </span>
              </div>
            )}

            <div className="dispatch-preview-table-wrap">
              <ReportDataTableCard
                columns={previewColumns}
                data={paginatedPreviewRows}
                totalRecords={filteredPreviewRows.length}
                pageIndex={previewPageIndex}
                onPageChange={setPreviewPageIndex}
                pageSize={previewPageSize}
                onPageSizeChange={(newSize) => {
                  setPreviewPageSize(newSize);
                  setPreviewPageIndex(1);
                }}
                onSearch={(term) => {
                  setPreviewSearchTerm(term);
                  setPreviewPageIndex(1);
                }}
                searchValue={previewSearchTerm}
                showExport={false}
                searchPlaceholder="Search in preview..."
              />
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmUploadModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmUpload}
          title="Are you sure you want to upload?"
          fileName={fileName}
          fileSize={selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
          uploadType={masterType === 'RDC_MASTER' ? 'RDC Master' : 'HU Input'}
          totalRows={previewRows.length}
          totalColumns={previewHeaders.length}
          isUploading={isUploading}
        />
      </div>
    </AppLayout>
  );
}
