import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Power, CheckCircle, X } from 'lucide-react';
import './ConfirmModal.css';

/**
 * Reusable Confirmation Modal Dialog
 * Rendered via createPortal to guarantee it sits above all sidebars, headers, and tables.
 */
export default function ConfirmModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'success' | 'primary'
  isLoading = false
}) {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Lock body scroll while modal is visible
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const renderIcon = () => {
    if (confirmVariant === 'danger') {
      return <Power size={22} />;
    }
    if (confirmVariant === 'success') {
      return <CheckCircle size={22} />;
    }
    return <AlertTriangle size={22} />;
  };

  const modalNode = (
    <div 
      className="vmm-confirm-backdrop" 
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="vmm-confirm-card" role="dialog" aria-modal="true">
        {/* Header & Content */}
        <div className="vmm-confirm-header">
          <div className={`vmm-confirm-icon-badge ${confirmVariant}`}>
            {renderIcon()}
          </div>
          <div className="vmm-confirm-title-area">
            <h3 className="vmm-confirm-title">{title}</h3>
            <div className="vmm-confirm-message">{message}</div>
          </div>
          <button 
            type="button" 
            className="vmm-confirm-close-btn" 
            onClick={onClose} 
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="vmm-confirm-footer">
          <button 
            type="button" 
            className="vmm-confirm-btn cancel" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={`vmm-confirm-btn ${confirmVariant}`} 
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
