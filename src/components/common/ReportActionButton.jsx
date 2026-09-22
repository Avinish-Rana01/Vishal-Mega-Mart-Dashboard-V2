import React from 'react';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import './ReportActionButton.css';

/**
 * ClearButton — Modern glassmorphism "reset/clear" pill button.
 * @param {Object} props
 * @param {Function} props.onClick - Click handler
 * @param {boolean} [props.disabled] - Disabled state
 * @param {string} [props.label] - Button text (default: "Clear")
 */
export const ClearButton = ({ onClick, disabled = false, label = 'Clear' }) => (
  <button
    type="button"
    className="report-action-btn report-action-btn--clear"
    onClick={onClick}
    disabled={disabled}
  >
    <RotateCcw size={14} />
    {label}
  </button>
);

/**
 * BackButton — Modern glassmorphism "navigate back" pill button.
 * @param {Object} props
 * @param {Function} props.onClick - Click handler (typically navigate(-1) or navigate('/path'))
 * @param {string} props.label - Button text (e.g. "Back to DC Summary")
 * @param {boolean} [props.disabled] - Disabled state
 */
export const BackButton = ({ onClick, label = 'Back', disabled = false }) => (
  <button
    type="button"
    className="report-action-btn report-action-btn--back"
    onClick={onClick}
    disabled={disabled}
  >
    <ArrowLeft size={14} />
    {label}
  </button>
);
