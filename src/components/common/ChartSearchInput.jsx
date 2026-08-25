import React from 'react';

/**
 * ChartSearchInput — Reusable search box used across all dashboard chart sections.
 *
 * Props:
 *   value        {string}   — controlled value
 *   onChange     {function} — called with the new string value
 *   onClear      {function} — called when the × button is clicked
 *   placeholder  {string}   — input placeholder text (default: "Search store...")
 */
export default function ChartSearchInput({ value, onChange, onClear, placeholder = 'Search store...' }) {
  return (
    <div className="vmm-search-container">
      <span className="vmm-search-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C12.8487 19 14.551 18.3729 15.9056 17.3199L19.2929 20.7071C19.6834 21.0976 20.3166 21.0976 20.7071 20.7071C21.0976 20.3166 21.0976 19.6834 20.7071 19.2929L17.3199 15.9056C18.3729 14.551 19 12.8487 19 11C19 6.58172 15.4183 3 11 3ZM5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11Z"
            fill="#94a3b8"
          />
        </svg>
      </span>
      <input
        type="text"
        className="vmm-search-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ paddingRight: value ? '25px' : '6px' }}
      />
      {value && (
        <button className="vmm-search-clear" onClick={onClear}>×</button>
      )}
    </div>
  );
}
