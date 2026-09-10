import React, { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

/**
 * A reusable custom dropdown component.
 * 
 * @param {Array} options - Array of { value, label } objects.
 * @param {string} value - The currently selected value.
 * @param {function} onChange - Callback triggered when an option is selected.
 * @param {string} prefix - Optional text prefix (e.g. "Sort:").
 * @param {object} buttonStyle - Optional inline styles for the trigger button.
 * @param {object} menuStyle - Optional inline styles for the dropdown menu container.
 * @param {number|string} width - Optional custom width for the dropdown container.
 */
export default function CustomDropdown({ options, value, onChange, prefix, buttonStyle, menuStyle, width }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Find the selected option's label to display in the button
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value;

  return (
    <div 
      ref={containerRef}
      className="custom-dropdown-container"
      style={{ position: 'relative', width: width ? width : 'auto' }}
    >
      <button 
        type="button"
        className="ls-filter-select"
        style={{ paddingRight: '24px', width: '100%', textAlign: 'left', ...buttonStyle }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {prefix && <span className="cd-prefix" style={{ color: '#94a3b8', marginRight: '6px' }}>{prefix}</span>}
        {displayLabel}
      </button>

      {isOpen && (
        <div 
          className="ls-dropdown-menu" 
          style={{ ...menuStyle, minWidth: '100%', maxHeight: '180px', overflowY: 'auto' }}
        >
          {options.map((opt) => (
            <div 
              key={opt.value}
              className={`ls-dropdown-item ${value === opt.value ? 'active' : ''}`} 
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => { 
                onChange(opt.value); 
                setIsOpen(false); 
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
