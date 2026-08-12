import React, { useState, useEffect, useRef } from 'react';
import './SearchableDropdown.css';

export default function SearchableDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  isAsync = false,
  onSearchChange,
  isLoading = false,
  labelKey = 'text',
  valueKey = 'value',
  searchPlaceholder = 'Search...',
  closeOnSelect = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // The displayed text in the trigger
  const selectedOption = options.find(opt => opt[valueKey] === value) || (value ? { [labelKey]: value, [valueKey]: value } : null);
  
  // Local filtering if not async
  const displayOptions = isAsync 
    ? options 
    : options.filter(opt => (opt[labelKey] || '').toString().toLowerCase().includes(searchTerm.toLowerCase()));

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', null);
    setSearchTerm('');
    if (isAsync && onSearchChange) {
      onSearchChange('');
    }
  };

  // Auto-focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="searchable-dropdown-list"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={value ? 'has-value' : 'is-empty'}>
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        <div className="custom-select-trigger-actions">
          {value && (
            <div 
              className="custom-select-clear-btn"
              onClick={handleClear}
              role="button"
              aria-label="Clear selection"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClear(e);
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          )}
          {!value && (
            <svg 
              className={`custom-select-chevron ${isOpen ? 'open' : ''}`}
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </div>
      </div>
      
      {isOpen && (
        <>
          <div 
            className="custom-select-backdrop" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="custom-select-menu">
            {/* Search Input Box inside Dropdown */}
            <div className="custom-select-search-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="custom-select-search-input"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (isAsync && onSearchChange) {
                    onSearchChange(e.target.value);
                  }
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-autocomplete="list"
                aria-controls="searchable-dropdown-list"
              />
            </div>

            {/* Options List */}
            <div 
              className="custom-select-options-list"
              id="searchable-dropdown-list"
              role="listbox"
            >
              {isLoading ? (
                <div className="custom-select-option-loading" role="status" aria-live="polite">Searching...</div>
              ) : displayOptions.length > 0 ? (
                displayOptions.slice(0, 50).map(opt => {
                  const isSelected = opt[valueKey] === value;
                  return (
                    <div 
                      key={opt[valueKey]} 
                      className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={0}
                      onClick={() => {
                        onChange(opt[valueKey], opt);
                        if (closeOnSelect) setIsOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onChange(opt[valueKey], opt);
                          if (closeOnSelect) setIsOpen(false);
                        }
                      }}
                    >
                      <span>{opt[labelKey]}</span>
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="custom-select-option-empty" role="status" aria-live="polite">
                  {searchTerm ? 'No results found' : 'Type to search...'}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
