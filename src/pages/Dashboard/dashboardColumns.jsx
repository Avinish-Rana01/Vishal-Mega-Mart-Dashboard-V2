import React from 'react';
import { Link } from 'react-router-dom';
// Common Renderers
export const numRenderer = (val) => <span className="vmm-link-num">{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span>;
export const numRendererGreen = (val) => <span className="vmm-link-num text-green">{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span>;
export const numRendererRed = (val) => <span className="vmm-link-num text-red">{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span>;
export const linkRenderer = (val) => <span className="vmm-link-num">{val}</span>;

export const dateRenderer = (val) => {
  if (!val) return '';
  return typeof val === 'string' ? val.split(' ')[0] : val;
};

export const storeRenderer = (val, row) => {
  const storeName = row?.STORE_NAME || row?.Store_Name || row?.STORE_Name || '';
  if (storeName && storeName.trim() !== '') {
    return (
      <div className="vmm-store-tooltip-wrapper">
        <span className="vmm-link-num">{val}</span>
        <div className="vmm-store-tooltip">
          {val} - {storeName}
        </div>
      </div>
    );
  }
  return <span className="vmm-link-num">{val}</span>;
};

// Columns for the Live Stock Table Headers based on API response
export const liveStockColumns = [
  { key: 'STORE_CODE', label: 'STORE', render: storeRenderer },
  { key: 'SAP_STOCK', label: 'SAP STOCK QTY', render: numRenderer },
  { key: 'RFID_STOCK', label: 'RFID STOCK QTY', render: numRenderer },
  { key: 'DIFFERENCE', label: 'DIFFERENCE QTY', render: numRenderer },
  { key: 'DATE', label: 'SYNC DATE', render: dateRenderer },
  {
    key: 'PERCENTAGE',
    label: 'COVERAGE(%)',
    render: (val) => {
      const percent = parseFloat(val) || 0;
      const opacity = Math.max(0.15, percent / 100);
      return (
        <span
          className="vmm-badge-coverage"
          style={{
            backgroundColor: `rgba(46, 125, 50, ${opacity})`,
            color: opacity > 0.6 ? '#ffffff' : '#083a1c'
          }}
        >
          {val}%
        </span>
      );
    }
  }
];

export const cycleCountStoreRenderer = (val, row) => {
  const storeName = row?.STORE_NAME || row?.Store_Name || row?.STORE_Name || '';
  const date = row?.DATE ? (typeof row.DATE === 'string' ? row.DATE.split(' ')[0] : row.DATE) : new Date().toISOString().split('T')[0];
  
  const linkContent = (
    <Link 
      to="/reports/cycle-count" 
      state={{ storeCode: val, date: date }}
      className="vmm-link-num text-blue"
      style={{ textDecoration: 'underline', fontWeight: 'bold' }}
      onClick={(e) => e.stopPropagation()}
    >
      {val}
    </Link>
  );

  if (storeName && storeName.trim() !== '') {
    return (
      <div className="vmm-store-tooltip-wrapper">
        {linkContent}
        <div className="vmm-store-tooltip">
          {val} - {storeName}
        </div>
      </div>
    );
  }
  return linkContent;
};

export const getCycleCountColumns = (onRefClick) => [
  { key: 'STORE_CODE', label: 'STORE', render: cycleCountStoreRenderer },
  { key: 'CYCLE_COUNT_TYPE', label: 'TYPE' },
  { key: 'REF_NO', label: 'REF NO', render: (val, row) => (
      <span 
        className="vmm-link-num text-blue" 
        style={{ cursor: 'pointer', textDecoration: 'underline' }} 
        onClick={(e) => {
          e.stopPropagation();
          onRefClick(row);
        }}
      >
        {val}
      </span>
    ) 
  },
  { key: 'DATE', label: 'DATE', render: dateRenderer },
  { key: 'Start_DateTime', label: 'START TIME', render: dateRenderer },
  { key: 'END_DateTime', label: 'END TIME', render: dateRenderer },
  { key: 'Time_Taken', label: 'TIME TAKEN' }
];

// Columns for Vendor Discrepancy
export const vendorDiscrepancyColumns = [
  { key: 'VENDOR_CODE', label: 'Vendor Code' },
  { key: 'VENDOR_NAME', label: 'Vendor Name' },
  { key: 'ACTUAL_QTY', label: 'Expected Qty', render: numRenderer },
  { key: 'SCANNED_QTY', label: 'Actual Qty', render: numRenderer },
  { key: 'DIFF_QTY', label: 'Diff Qty', render: numRenderer },
  { key: 'DIFF_TILL_DATE', label: 'Diff Qty (From 27-06-2026)', render: numRenderer }
];

// Columns for Store Validation Dashboard
export const storeDashboardColumns = [
  { key: 'STORE', label: 'STORE', render: storeRenderer },
  { key: 'DATE', label: 'DATE', render: dateRenderer },
  { key: 'HU_RECEIVED_QTY', label: 'HU RECEIVED', render: numRenderer },
  { key: 'HU_VALIDATED_QTY', label: 'HU VALIDATED', render: numRenderer },
  { key: 'HHT_VALIDATE_QTY', label: 'HHT VALIDATE', render: numRenderer },
  { key: 'STORE_PENDING_QTY', label: 'PENDING', render: numRenderer },
  { key: 'HU_WRONG_QTY', label: 'WRONG QTY', render: numRenderer }
];

// Columns for Sale Dashboard
export const saleDashboardColumns = [
  { key: 'STORE', label: 'STORE', render: storeRenderer },
  { key: 'DATE', label: 'DATE', render: dateRenderer },
  { key: 'TOTAL_DPOS_SALE', label: 'DPOS SALE', render: numRenderer },
  { key: 'TOTAL_RFID_CHECKOUT', label: 'RFID CHECKOUT', render: numRenderer },
  { key: 'RFID_CHECKOUT_MATCHING_WITH_DPOS_SALE', label: 'MATCHING', render: numRendererGreen },
  { key: 'RFID_CHECKOUT_NOT_MATCHING_WITH_DPOS_SALE', label: 'NOT MATCHING', render: numRendererRed },
  { key: 'TOTAL_MANUAL_SALE', label: 'MANUAL SALE', render: numRenderer },
  { key: 'TOTAL_VOID', label: 'VOID', render: numRenderer }
];

// Columns for Void Dashboard
export const voidDashboardColumns = [
  { key: 'STORE', label: 'STORE', render: storeRenderer },
  { key: 'VOID_QTY', label: 'VOID QTY', render: numRenderer },
  { key: 'ENCODE_QTY', label: 'ENCODE QTY', render: numRenderer },
  { key: 'DIFFERENCE_QTY', label: 'DIFFERENCE', render: numRendererRed }
];

// Columns for Return Dashboard
export const returnDashboardColumns = [
  { key: 'Store_Code', label: 'STORE', render: storeRenderer },
  { key: 'RETURN_QTY', label: 'RETURN QTY', render: numRenderer },
  { key: 'ENCODE_QTY', label: 'ENCODE QTY', render: numRenderer },
  { key: 'DIFFERENCE_QTY', label: 'DIFFERENCE', render: numRendererRed }
];

// Columns for Warehouse Encoding Dashboard
export const warehouseEncodingColumns = [
  { key: 'timeBlock', label: 'TIME' },
  { key: 'count', label: 'ENCODING COUNT', render: numRenderer }
];

export const dcValidationColumns = [
  { key: 'Reciving_Plant', label: 'STORE', minWidth: '150px' },
  { key: 'PROCESSED_HU', label: 'PROCESSED HU QTY', type: 'number', render: numRenderer },
  { key: 'UNPROCESSED_HU', label: 'UNPROCESSED HU QTY', type: 'number', render: numRenderer },
  { key: 'PROCESSED_ARTICLE_QTY', label: 'VALIDATED HU ARTICLE QTY', type: 'number', render: numRenderer }
];
