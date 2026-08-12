import React, { useState } from 'react';
import CurvedCard from './CurvedCard';
import ReportDataTableCard from './ReportDataTableCard';

export default function DetailsModal({
  onClose,
  title = 'VIEW DETAILS',
  metaInfo = [], 
  summaryCards = [], 
  tableColumns = [],
  tableData = [],
  totalRecords = 0,
  isLoading = false,
  pageIndex = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
}) {

  return (
    <div className="vmm-modal-overlay">
      <div className="vmm-modal-content" >
        
        {/* Header */}
        <div className="vmm-modal-header">
          <div className="vmm-modal-title">{title}</div>
          <button className="vmm-modal-close" onClick={onClose}>X</button>
        </div>

        {/* Body */}
        <div className="vmm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Meta Info */}
          {metaInfo && metaInfo.length > 0 && (
            <div className="vmm-modal-meta-row">
              {metaInfo.map((meta, idx) => (
                <div key={idx}>
                  {meta.label} : <span style={{ color: meta.valueColor || 'inherit' }}>{meta.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* CurvedCards Grid */}
          {summaryCards && summaryCards.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(summaryCards.length, 6)}, 1fr)`, gap: '15px' }}>
              {summaryCards.map((card, idx) => (
                <CurvedCard 
                  key={idx}
                  title={card.title} 
                  value={card.value} 
                  waveColor={card.waveColor} 
                  icon={card.icon} 
                />
              ))}
            </div>
          )}

          {/* Data Table */}
          {tableColumns && tableColumns.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <ReportDataTableCard 
                columns={tableColumns}
                data={tableData}
                isLoading={isLoading}
                pageIndex={pageIndex}
                onPageChange={onPageChange}
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
                totalRecords={totalRecords || tableData.length}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
