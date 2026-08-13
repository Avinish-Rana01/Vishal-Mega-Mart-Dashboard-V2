import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ChartPaginator({ currentPage, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  // Generate page numbers to show (e.g. 1 2 3 ... 10)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first, last, and around current
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', padding: '12px 0' }}>
      <button 
        onClick={handlePrev}
        disabled={currentPage === 1}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '6px',
          background: currentPage === 1 ? '#f8fafc' : '#ffffff',
          border: '1px solid #e2e8f0',
          color: currentPage === 1 ? '#cbd5e1' : '#475569',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <ChevronLeft size={16} />
      </button>

      {getPageNumbers().map((page, idx) => (
        <button
          key={idx}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={page === '...'}
          style={{
            minWidth: '32px', height: '32px', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: page === currentPage ? '600' : '500',
            background: page === currentPage ? '#3b82f6' : (page === '...' ? 'transparent' : '#ffffff'),
            color: page === currentPage ? '#ffffff' : (page === '...' ? '#94a3b8' : '#475569'),
            border: page === '...' ? 'none' : (page === currentPage ? '1px solid #3b82f6' : '1px solid #e2e8f0'),
            cursor: page === '...' ? 'default' : 'pointer',
            padding: '0 8px',
            transition: 'all 0.2s'
          }}
        >
          {page}
        </button>
      ))}

      <button 
        onClick={handleNext}
        disabled={currentPage === totalPages}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '6px',
          background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
          border: '1px solid #e2e8f0',
          color: currentPage === totalPages ? '#cbd5e1' : '#475569',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
