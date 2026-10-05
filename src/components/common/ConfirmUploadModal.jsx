import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, FileSpreadsheet, X, Loader2, AlertCircle, Layers, FileText, CheckCircle2 } from 'lucide-react';
import './ConfirmUploadModal.css';

/**
 * Confirmation dialog shown before uploading an Excel file to the database.
 * Displays file name, line count, detected columns, and context-specific metadata.
 */
export default function ConfirmUploadModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Are you sure you want to upload?',
  fileName = '',
  fileSize = '',
  uploadType = '',
  totalRows = 0,
  totalColumns = 0,
  extraDetails = [],
  isUploading = false,
  uploadProgress = 0,
  uploadStepText = 'Uploading & processing file...'
}) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isUploading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPercent = Math.min(100, Math.max(0, Math.round(uploadProgress)));

  const modalNode = (
    <div className="vmm-confirm-modal-overlay" onClick={() => !isUploading && onClose()}>
      <div 
        className="vmm-confirm-modal-card" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="vmm-confirm-modal-header">
          <div className="vmm-confirm-modal-header-left">
            <div className="vmm-confirm-modal-icon-wrap">
              <UploadCloud size={18} />
            </div>
            <span className="vmm-confirm-modal-title">{title}</span>
          </div>
          <button 
            type="button" 
            className="vmm-confirm-modal-close" 
            onClick={onClose}
            disabled={isUploading}
            title="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="vmm-confirm-modal-body">
          <p className="vmm-confirm-prompt-msg">
            You are about to upload this file to the system. Please verify the workbook summary before proceeding:
          </p>

          <div className="vmm-confirm-file-details-card">
            {/* File Name */}
            <div className="vmm-confirm-detail-row">
              <span className="vmm-confirm-detail-label">
                <FileSpreadsheet size={14} className="text-blue-500" />
                File Name:
              </span>
              <span className="vmm-confirm-detail-val" title={fileName}>
                {fileName || 'Unknown File'}
              </span>
            </div>

            {/* Upload Type / Module */}
            {uploadType && (
              <div className="vmm-confirm-detail-row">
                <span className="vmm-confirm-detail-label">
                  <Layers size={14} />
                  Upload Type:
                </span>
                <span className="vmm-confirm-detail-val val-pill">
                  {uploadType}
                </span>
              </div>
            )}

            {/* Total Lines / Records */}
            <div className="vmm-confirm-detail-row">
              <span className="vmm-confirm-detail-label">
                <FileText size={14} />
                Number of Data Rows:
              </span>
              <span className="vmm-confirm-detail-val val-highlight">
                {totalRows} {totalRows === 1 ? 'Row' : 'Rows'}
              </span>
            </div>

            {/* Columns Count */}
            {totalColumns > 0 && (
              <div className="vmm-confirm-detail-row">
                <span className="vmm-confirm-detail-label">
                  <CheckCircle2 size={14} />
                  Detected Columns:
                </span>
                <span className="vmm-confirm-detail-val">
                  {totalColumns} Columns
                </span>
              </div>
            )}

            {/* File Size */}
            {fileSize && (
              <div className="vmm-confirm-detail-row">
                <span className="vmm-confirm-detail-label">
                  File Size:
                </span>
                <span className="vmm-confirm-detail-val">
                  {fileSize}
                </span>
              </div>
            )}

            {/* Extra Dynamic Metadata (e.g. Picklist No, Date) */}
            {extraDetails.map((detail, index) => (
              detail.value ? (
                <div key={index} className="vmm-confirm-detail-row">
                  <span className="vmm-confirm-detail-label">
                    {detail.label}:
                  </span>
                  <span className="vmm-confirm-detail-val">
                    {detail.value}
                  </span>
                </div>
              ) : null
            ))}
          </div>

          {/* Progress Bar inside the Modal Box */}
          {isUploading ? (
            <div className="vmm-confirm-progress-section">
              <div className="vmm-confirm-progress-header">
                <div className="vmm-confirm-progress-label">
                  <Loader2 size={15} className="vmm-spin text-blue-600" />
                  <span>{uploadStepText || 'Uploading & processing file...'}</span>
                </div>
                <span className="vmm-confirm-progress-percentage">{currentPercent}%</span>
              </div>

              <div className="vmm-confirm-progress-track">
                <div 
                  className="vmm-confirm-progress-bar"
                  style={{ width: `${Math.max(6, currentPercent)}%` }}
                />
              </div>

              <span className="vmm-confirm-progress-subhint">
                Please wait while the workbook is validated and saved to the database.
              </span>
            </div>
          ) : (
            <div className="vmm-confirm-warning-note">
              <AlertCircle size={15} />
              <span>This will validate and insert the records into the database.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="vmm-confirm-modal-footer">
          <button 
            type="button" 
            className="vmm-confirm-btn-cancel" 
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="vmm-confirm-btn-submit" 
            onClick={onConfirm}
            disabled={isUploading}
          >
            <UploadCloud size={15} />
            <span>{isUploading ? 'Uploading...' : 'Yes, Confirm & Upload'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalNode, document.body)
    : modalNode;
}
