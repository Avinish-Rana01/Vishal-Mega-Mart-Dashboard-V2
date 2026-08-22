import React from 'react';
import * as Icons from 'lucide-react';

export function SearchEmptyState({ 
  searchFilter, 
  onClearSearch, 
  title, 
  subtitle = 'Try a different search term or clear your filters.',
  minHeight = '200px' 
}) {
  return (
    <div style={{ height: '100%', minHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px', background: 'transparent', borderRadius: '12px', border: '3px solid #cbd5e1' }}>
      <div style={{ marginBottom: '12px' }}>
        <Icons.Search size={44} strokeWidth={1.5} color="#94a3b8" />
      </div>
      <span style={{ fontWeight: 600, color: '#475569', fontSize: '15px', textAlign: 'center', wordBreak: 'break-all', padding: '0 16px', maxWidth: '100%' }}>
        {title || `No Records Found for "${searchFilter}"`}
      </span>
      <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', marginBottom: '16px', textAlign: 'center', padding: '0 16px' }}>
        {subtitle}
      </span>
      <button
        onClick={onClearSearch}
        style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
        onMouseOut={e => e.currentTarget.style.background = '#fff'}
      >
        Clear Search
      </button>
    </div>
  );
}

export function GlobalEmptyState({
  title,
  subtitle,
  icon: IconComponent = Icons.ShieldCheck,
  iconColor = '#059669',
  minHeight = '200px'
}) {
  return (
    <div style={{ height: '100%', minHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px', background: 'transparent', borderRadius: '12px', border: '3px solid #cbd5e1' }}>
      <div style={{ marginBottom: '12px' }}>
        <IconComponent size={44} strokeWidth={1.5} color={iconColor} />
      </div>
      <span style={{ fontWeight: 600, color: '#475569', fontSize: '15px', textAlign: 'center', wordBreak: 'break-all', padding: '0 16px', maxWidth: '100%' }}>{title}</span>
      {subtitle && (
        <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', textAlign: 'center', padding: '0 16px' }}>{subtitle}</span>
      )}
    </div>
  );
}
