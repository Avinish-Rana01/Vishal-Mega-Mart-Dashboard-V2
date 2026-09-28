import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import './ViewDetailsButton.css';

/**
 * ViewDetailsButton — Reusable modern pill badge button with upward-tilted arrow (`ArrowUpRight`).
 * Designed for table action columns and drilldown triggers across all VMM reports and dashboards.
 *
 * @param {Object} props
 * @param {Function} props.onClick - Click handler
 * @param {string} [props.label] - Button text (default: "View Details")
 * @param {string} [props.title] - Hover tooltip
 * @param {string} [props.variant] - 'blue' (default) | 'green' | 'purple' | 'slate'
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.disabled] - Disabled state
 */
export default function ViewDetailsButton({
  onClick,
  label = 'View Details',
  title = 'Click to view details',
  variant = 'blue',
  className = '',
  disabled = false,
  ...rest
}) {
  return (
    <button
      type="button"
      className={`vmm-view-details-btn vmm-view-details-btn--${variant} ${className}`.trim()}
      onClick={onClick}
      title={title}
      disabled={disabled}
      {...rest}
    >
      <span className="vmm-view-details-btn__label">{label}</span>
      <ArrowUpRight size={13} strokeWidth={2.4} className="vmm-view-details-btn__icon" />
    </button>
  );
}
