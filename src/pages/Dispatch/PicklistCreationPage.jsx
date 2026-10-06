import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Download, CheckCircle, AlertTriangle, RotateCcw, FileSpreadsheet, Loader2, ClipboardList } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import ConfirmUploadModal from '../../components/common/ConfirmUploadModal';
import { uploadPicklistFile, parseExcelPreview, downloadTemplate, validateExcelFileFormat } from '../../services/dispatchService';
import './PicklistCreationPage.css';

export default function PicklistCreationPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');
  const [previewFileName, setPreviewFileName] = useState('');
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepText, setUploadStepText] = useState('Uploading & processing file...');

  const fileInputRef = useRef(null);

  const processSelectedFile = async (file) => {
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      setValidationError('Only .xlsx and .xls files are allowed.');
      setSelectedFile(null);
      setFileName('No file chosen');
      setPreviewFileName('');
      setPreviewRows([]);
      setPreviewHeaders([]);
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setPreviewFileName(file.name);
    setValidationError('');
    setUploadResult(null);
    setIsParsing(true);
    setPreviewPageIndex(1);
    setPreviewSearchTerm('');

    try {
      const { headers, rows } = await parseExcelPreview(file);
      setPreviewHeaders(headers);
      setPreviewRows(rows);

      // Validate against the exact Picklist demo excel specification
      const validation = validateExcelFileFormat('PICKLIST', headers, rows);
      if (!validation.isValid) {
        setValidationError(validation.error);
      }
    } catch (err) {
      console.error('Failed to parse Picklist file', err);
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
    setPreviewFileName('');
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
      setValidationError('Please select a Picklist Excel file first.');
      return;
    }
    if (validationError) {
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmUpload = async () => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadStepText('Sending picklist file to server...');
    setValidationError('');
    setUploadResult(null);

    let progressTimer = null;

    try {
      const onProgress = (percent) => {
        if (percent < 100) {
          const scaled = Math.min(65, 10 + Math.round((percent * 55) / 100));
          setUploadProgress(scaled);
          setUploadStepText('Transferring workbook data...');
        } else {
          setUploadProgress(68);
          setUploadStepText('Validating picklist items & database allocation...');
          let currentSimulated = 68;
          progressTimer = setInterval(() => {
            currentSimulated += Math.floor(Math.random() * 4) + 2;
            if (currentSimulated >= 94) {
              currentSimulated = 94;
              setUploadStepText('Finalizing picklist records & saving...');
              clearInterval(progressTimer);
            } else if (currentSimulated > 82) {
              setUploadStepText('Inserting picklist rows into database...');
            }
            setUploadProgress(currentSimulated);
          }, 250);
        }
      };

      const result = await uploadPicklistFile(selectedFile, null, onProgress);
      if (progressTimer) clearInterval(progressTimer);

      setUploadProgress(100);
      setUploadStepText('Complete! Picklist allocated successfully.');

      setTimeout(() => {
        setUploadResult(result);
        setIsConfirmModalOpen(false);
        setIsUploading(false);
        setUploadProgress(0);
        // Clear file input so it cannot be uploaded again accidentally
        setSelectedFile(null);
        setFileName('No file chosen');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 450);
    } catch (err) {
      if (progressTimer) clearInterval(progressTimer);
      const msg = err.response?.data?.message || err.message || 'Failed to upload picklist file.';
      setValidationError(msg);
      setIsConfirmModalOpen(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const samplePicklistNo = useMemo(() => {
    if (!previewRows || previewRows.length === 0) return '';
    return previewRows[0]?.Picklistno || previewRows[0]?.picklistno || previewRows[0]?.PicklistNo || '';
  }, [previewRows]);

  const sampleDate = useMemo(() => {
    if (!previewRows || previewRows.length === 0) return '';
    return previewRows[0]?.Date || previewRows[0]?.date || previewRows[0]?.DATE || '';
  }, [previewRows]);

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

  // Convert parsed headers to columns for ReportDataTableCard
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
            HOME - PAGES - <span className="active">PICKLIST CREATION</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      <div className="dispatch-upload-wrapper">
        <div className="dispatch-upload-card">
          {/* Card Top Header */}
          <div className="dispatch-card-header">
            <div className="dispatch-card-header-left">
              <ClipboardList size={16} />
              <span>PICKLIST CREATION & VALIDATION</span>
            </div>
            <span className="dispatch-required-hint">NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
          </div>

          <div className="dispatch-card-body">
            <div className="dispatch-form-row">
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
                    id="picklist-file-input"
                  />
                  <label htmlFor="picklist-file-input" className="dispatch-choose-btn">
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

              {/* Action Buttons on the SAME line as file input */}
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
                  onClick={() => downloadTemplate('PICKLIST')}
                >
                  <Download size={15} />
                  <span>Download File Format (Picklist Template)</span>
                </button>
              </div>
            </div>

            {/* Parsing Indicator */}
            {isParsing && (
              <div className="dispatch-parsing-badge">
                <Loader2 size={14} className="vmm-spin" />
                <span>Analyzing Picklist file preview...</span>
              </div>
            )}

            {/* Alerts */}
            {validationError && (
              <div className="dispatch-alert-box dispatch-alert-err">
                <AlertTriangle size={16} />
                <span>{validationError}</span>
              </div>
            )}

            {uploadResult && (
              <div className="dispatch-success-banner">
                <div className="dispatch-success-banner-left">
                  <div className="dispatch-success-icon-badge">
                    <CheckCircle size={18} />
                  </div>
                  <div className="dispatch-success-details">
                    <div className="dispatch-success-title">
                      {uploadResult.message || 'Picklist validated successfully.'}
                    </div>
                    <div className="dispatch-stat-chips">
                      <span className="dispatch-chip">
                        <span className="chip-label">Picklist No:</span>
                        <span className="chip-value">{uploadResult.picklistNo}</span>
                      </span>
                      <span className="chip-divider">•</span>
                      <span className="dispatch-chip">
                        <span className="chip-label">Date:</span>
                        <span className="chip-value">{uploadResult.date}</span>
                      </span>
                      <span className="chip-divider">•</span>
                      <span className="dispatch-chip chip-highlight">
                        <span className="chip-label">Total Items:</span>
                        <span className="chip-value">{uploadResult.totalRecords}</span>
                      </span>
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
        {previewHeaders.length > 0 && (
          <div className="dispatch-preview-card">
            <div className="dispatch-preview-card-header">
              <div className="dispatch-card-header-left">
                <FileSpreadsheet size={15} />
                <span>PICKLIST FILE PREVIEW: {previewFileName || fileName}</span>
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
                searchPlaceholder="Search in picklist items..."
              />
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmUploadModal
          isOpen={isConfirmModalOpen}
          onClose={() => !isUploading && setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmUpload}
          title="Are you sure you want to upload?"
          fileName={fileName}
          fileSize={selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
          uploadType="Picklist Creation & Allocation"
          totalRows={previewRows.length}
          totalColumns={previewHeaders.length}
          extraDetails={[
            { label: 'Picklist No', value: samplePicklistNo },
            { label: 'Picklist Date', value: sampleDate }
          ]}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadStepText={uploadStepText}
        />
      </div>
    </AppLayout>
  );
}
