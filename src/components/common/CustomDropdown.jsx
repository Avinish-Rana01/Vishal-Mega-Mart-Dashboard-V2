import React, { useState } from 'react';

/**
 * A reusable custom dropdown component.
 * 
 * @param {Array} options - Array of { value, label } objects.
 * @param {string} value - The currently selected value.
 * @param {function} onChange - Callback triggered when an option is selected.
 * @param {string} prefix - Optional text prefix (e.g. "Sort:").
 * @param {object} buttonStyle - Optional inline styles for the trigger button.
 * @param {object} menuStyle - Optional inline styles for the dropdown menu container.
 */
export default function CustomDropdown({ options, value, onChange, prefix, buttonStyle, menuStyle }) {
  const [isOpen, setIsOpen] = useState(false);

  // Find the selected option's label to display in the button
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value;

  return (
    <div 
      style={{ position: 'relative' }}
      tabIndex={0}
      onBlur={(e) => {
        // Close dropdown when focus leaves the component
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button 
        className="ls-filter-select"
        style={{ paddingRight: '24px', ...buttonStyle }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {prefix && <span style={{ color: '#94a3b8', marginRight: '6px' }}>{prefix}</span>}
        {displayLabel}
      </button>

      {isOpen && (
        <div className="ls-dropdown-menu" style={{ ...menuStyle }}>
          {options.map((opt) => (
            <div 
              key={opt.value}
              className={`ls-dropdown-item ${value === opt.value ? 'active' : ''}`} 
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
