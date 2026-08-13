import React from 'react';

/**
 * StoreRankList - Universal ranked list showing stores/vendors with a colored status badge.
 *
 * @param {Array} items - Array of data rows
 * @param {string} labelKey - Key from each item to use as the main label (e.g. 'STORE_NAME')
 * @param {string} sublabelKey - Key from each item to use as the sublabel (e.g. 'STORE_CODE')
 * @param {string} valueKey - Key for the numeric value shown as the badge (e.g. 'PERCENTAGE')
 * @param {string} diffKey - Key for the "Diff" line below the label (e.g. 'DIFFERENCE')
 * @param {string} diffLabel - Label before the diff value (e.g. 'Diff:')
 * @param {Function} statusFn - Function(value) => 'success'|'warning'|'danger'
 * @param {Function} formatValue - Optional function to format the badge value
 * @param {string} emptyText - Text to show when items is empty
 * @param {number} maxItems - Max items to render (default 5)
 */
export default function StoreRankList({
  items = [],
  labelKey,
  sublabelKey,
  valueKey,
  diffKey,
  diffLabel = 'Diff:',
  statusFn,
  formatValue,
  emptyText = 'No data available.',
  maxItems = 5,
  onItemClick,
}) {
  const badgeStyles = {
    success: { background: '#dcfce7', color: '#15803d' },
    warning: { background: '#fef3c7', color: '#b45309' },
    danger:  { background: '#fee2e2', color: '#b91c1c' },
    info:    { background: '#eff6ff', color: '#1d4ed8' },
    default: { background: '#f1f5f9', color: '#475569' },
  };

  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '14px' }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {displayItems.map((row, i) => {
        const label = row[labelKey] || '—';
        const sublabel = sublabelKey ? row[sublabelKey] : null;
        const rawValue = row[valueKey];
        const displayVal = formatValue ? formatValue(rawValue) : rawValue;
        const variant = statusFn ? statusFn(rawValue) : 'default';
        const initials = (sublabel || label).substring(0, 2).toUpperCase();

            return (
          <div 
            key={i} 
            onClick={() => onItemClick && onItemClick(row)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 10px',
              flex: 1,
              borderBottom: i < displayItems.length - 1 ? '1px solid #f1f5f9' : 'none',
              cursor: onItemClick ? 'pointer' : 'default',
              borderRadius: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (onItemClick) e.currentTarget.style.background = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              if (onItemClick) e.currentTarget.style.background = 'transparent';
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '13px',
              flexShrink: 0,
            }}>
              {initials}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }} title={label}>
                {label}
              </div>
              {diffKey && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {diffLabel} {Number(row[diffKey] || 0).toLocaleString('en-IN')}
                </div>
              )}
            </div>

            {/* Badge */}
            <span style={{
              ...badgeStyles[variant],
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {displayVal}
            </span>
          </div>
        );
      })}
    </div>
  );
}
