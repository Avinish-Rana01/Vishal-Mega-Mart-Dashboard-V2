import React from 'react';
import './NeuromorphicButton.css';

/**
 * NeuromorphicButton — A soft-extruded pill button designed in neuromorphism UI style.
 *
 * @param {string|number|React.ReactNode} value - The button content/label (required)
 * @param {function} onClick - Click event handler
 * @param {string} className - Additional CSS class names
 * @param {object} style - Inline styles override
 * @param {boolean} active - Active/pressed state toggle
 * @param {boolean} disabled - Disabled state
 * @param {React.ReactNode} icon - Optional icon prepended to the value
 * @param {string} title - Tooltip text
 */
export default function NeuromorphicButton({
  value = 'Here',
  onClick,
  className = '',
  style = {},
  active = false,
  disabled = false,
  icon = null,
  title,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={`vmm-neuro-btn ${active ? 'vmm-neuro-btn--active' : ''} ${className}`.trim()}
      style={style}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      <span className="vmm-neuro-btn__value">{children ?? value}</span>
      {icon && <span className="vmm-neuro-btn__icon">{icon}</span>}
    </button>
  );
}
