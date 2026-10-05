import React from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import './ToastNotification.css';

/**
 * Reusable Enterprise Floating Toast Notification
 * @param {Object} props
 * @param {{ type?: 'success' | 'error' | 'warning' | 'info', message: string, title?: string } | null} props.alert
 * @param {Function} props.onClose - Callback triggered when the toast close button is clicked
 * @param {number} [props.duration=5000] - Duration in ms for the visual progress bar animation
 */
export default function ToastNotification({ alert, onClose, duration = 5000 }) {
  if (!alert || !alert.message) return null;

  const type = alert.type || 'error';

  const defaultTitles = {
    success: 'Success',
    error: 'Action Failed',
    warning: 'Warning',
    info: 'Information'
  };

  const title = alert.title || defaultTitles[type] || 'Notification';

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'warning':
        return <AlertCircle size={18} />;
      case 'info':
        return <Info size={18} />;
      case 'error':
      default:
        return <AlertTriangle size={18} />;
    }
  };

  return (
    <div className={`vmm-auth-toast ${type}`} role="alert" aria-live="assertive">
      <div className="vmm-auth-toast-icon">
        {renderIcon()}
      </div>
      <div className="vmm-auth-toast-content">
        <span className="vmm-auth-toast-title">{title}</span>
        <span className="vmm-auth-toast-message">{alert.message}</span>
      </div>
      <button
        type="button"
        className="vmm-auth-toast-close"
        onClick={onClose}
        title="Dismiss notification"
        aria-label="Close"
      >
        <X size={15} />
      </button>
      <div
        className="vmm-auth-toast-progress"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}
