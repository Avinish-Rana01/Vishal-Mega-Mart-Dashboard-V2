import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shirt, Layers, ScanLine, TrendingUp, TrendingDown, ArrowDownSquare } from 'lucide-react';
import DetailsModal from '../common/DetailsModal';
import { getCycleCountDetails } from '../../services/stockService';

const isEmpty = (val) => {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined';
  }
  return false;
};

const formatValue = (val) => {
  if (isEmpty(val)) return 'N/A';
  return val;
};

const formatDate = (val) => {
  if (isEmpty(val)) return 'N/A';
  let d = String(val).trim();
  if (d.includes('T')) d = d.split('T')[0];
  return d || 'N/A';
};

const formatTime = (val) => {
  if (isEmpty(val)) return 'N/A';
  let t = String(val).trim();
  if (t.includes('.')) t = t.split('.')[0];
  return t || 'N/A';
};

function ProductImageCell({ articleCode, onExpand }) {
  const [hasError, setHasError] = useState(false);

  if (isEmpty(articleCode)) {
    return <span>N/A</span>;
  }

  const cleanCode = String(articleCode).trim();
  const imageUrl = `https://webapi.vishalwholesale.co.in:8051/Product_Image/${cleanCode}.jpg`;

  if (hasError) {
    return <span>N/A</span>;
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '20px', verticalAlign: 'middle' }}>
      <img
        src={imageUrl}
        alt={cleanCode}
        onError={() => setHasError(true)}
        onClick={(e) => {
          e.stopPropagation();
          onExpand(imageUrl);
        }}
        style={{
          maxHeight: '20px',
          maxWidth: '22px',
          height: '20px',
          width: 'auto',
          objectFit: 'contain',
          borderRadius: '2px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          padding: '1px',
          verticalAlign: 'middle',
          transition: 'transform 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.4)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        title="Click to view full image"
      />
    </div>
  );
}

export default function CycleCountModal({ modalData, onClose }) {
  if (!modalData) return null;

  const [expandedImage, setExpandedImage] = useState(null);

  // Close image lightbox on Escape key without closing modal
  useEffect(() => {
    if (!expandedImage) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setExpandedImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedImage]);

  const modalColumns = useMemo(() => [
    { key: 'RowNumber', label: 'SR.NO', render: formatValue },
    { key: 'Ref_ID', label: 'REFERENCE NO', render: formatValue },
    { key: 'ECODE', label: 'ECODE', render: formatValue },
    { key: 'MC', label: 'MC', render: formatValue },
    { key: 'MC_TEXT', label: 'MC TEXT', render: formatValue },
    { key: 'ARTICLE', label: 'ARTICLE', render: formatValue },
    { key: 'ARTICLE_DESC', label: 'ARTICLE DESCRIPTION', render: formatValue },
    { key: 'EAN', label: 'BARCODE', render: formatValue },
    { key: 'Actual_Qty', label: 'SYSTEM STOCK', render: (val) => isEmpty(val) ? 'N/A' : val },
    { key: 'Scanned_Qty', label: 'SCANNED QTY', render: (val) => isEmpty(val) ? 'N/A' : val },
    { key: 'Variance', label: 'VARIANCE', render: (val) => {
        if (isEmpty(val)) return 'N/A';
        const v = Number(val || 0);
        return <span style={{color: v < 0 ? '#dc2626' : (v > 0 ? '#16a34a' : 'inherit'), fontWeight: v !== 0 ? 'bold' : 'normal'}}>{v}</span>;
    }},
    { key: 'START_DATE', label: 'START DATE', render: formatDate },
    { key: 'START_TIME', label: 'START TIME', render: formatTime },
    { key: 'END_DATE', label: 'END DATE', render: formatDate },
    { key: 'END_TIME', label: 'END TIME', render: formatTime },
    {
      key: 'IMAGE',
      label: 'IMAGE',
      render: (_, row) => {
        const code = row?.ARTICLE || row?.Article || row?.article || row?.EAN || row?.Ean;
        return <ProductImageCell articleCode={code} onExpand={setExpandedImage} />;
      }
    }
  ], []);

  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryData, setSummaryData] = useState(null);
  
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Case-insensitive lookup helper
  const getVal = (obj, key) => {
    if (!obj) return undefined;
    const lowerKey = key.toLowerCase();
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
    return foundKey ? obj[foundKey] : undefined;
  };

  // The modalData contains context from the row clicked
  const storeCode = getVal(modalData, 'STORE_CODE') || getVal(modalData, 'STORE');
  
  // Format dates appropriately
  const dateVal = getVal(modalData, 'DATE') || getVal(modalData, 'Start_DateTime');
  const fromDate = dateVal ? String(dateVal).split('T')[0].split(' ')[0] : '';
  const toDate = dateVal ? String(dateVal).split('T')[0].split(' ')[0] : '';
  
  const refNo = getVal(modalData, 'Ref_ID') || getVal(modalData, 'RefNo') || getVal(modalData, 'REF_NO');

  const fetchDetails = useCallback(async (signal) => {
    setIsLoading(true);
    try {
      const result = await getCycleCountDetails(pageIndex, pageSize, '', storeCode, fromDate, toDate, refNo, signal);
      setTableData(result?.items || result?.Items || []);
      
      const summary = result?.summary || result?.Summary || {};
      setTotalRecords(summary.recordCount || summary.RecordCount || summary.Total_Records || (result?.items?.length || 0));
      setSummaryData(summary);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Failed to fetch details", err);
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [pageIndex, pageSize, storeCode, fromDate, toDate, refNo]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetails(controller.signal);
    return () => controller.abort();
  }, [fetchDetails]);

  const metaInfo = [
    { label: 'STORE', value: formatValue(storeCode), valueColor: '#004cff' },
    { label: 'CYCLE COUNT TYPE', value: formatValue(getVal(modalData, 'CYCLE_COUNT_TYPE') || 'ARTICLE LEVEL'), valueColor: '#004cff' },
    { label: 'DATE', value: formatValue(fromDate) },
    { label: 'CYCLE COUNT TIME', value: formatValue(getVal(modalData, 'Time_Taken') || getVal(modalData, 'rawDuration')) }
  ];

  const safeNum = (val) => (val !== undefined && val !== null ? val : 0).toLocaleString('en-IN');

  const numArticles = summaryData?.recordCount ?? summaryData?.RecordCount ?? summaryData?.totalCount ?? summaryData?.TotalCount ?? 0;
  const sysStock = summaryData?.actualQty ?? summaryData?.ActualQty ?? 0;
  const scanQty = summaryData?.scannedQty ?? summaryData?.ScannedQty ?? 0;
  const excess = summaryData?.excessQty ?? summaryData?.ExcessQty ?? 0;
  const rawDiff = summaryData?.diffQty ?? summaryData?.DiffQty ?? 0;
  const short = summaryData?.shortQty ?? summaryData?.ShortQty ?? (rawDiff < 0 ? Math.abs(rawDiff) : 0);
  const netDiff = scanQty - sysStock;

  const summaryCards = [
    { title: "NO OF ARTICLES", value: safeNum(numArticles), waveColor: ['#fecaca', '#f87171'], icon: <Shirt size={20} /> },
    { title: "SYSTEM STOCK", value: safeNum(sysStock), waveColor: ['#fbcfe8', '#f472b6'], icon: <Layers size={20} /> },
    { title: "SCANNED QTY", value: safeNum(scanQty), waveColor: ['#bbf7d0', '#4ade80'], icon: <ScanLine size={20} /> },
    { title: "NET DIFFERENCE", value: safeNum(netDiff), waveColor: ['#fecaca', '#f87171'], icon: <TrendingDown size={20} /> },
    { title: "SHORT QTY", value: safeNum(short), waveColor: ['#d9f99d', '#a3e635'], icon: <ArrowDownSquare size={20} /> },
    { title: "EXCESS QTY", value: safeNum(excess), waveColor: ['#bfdbfe', '#60a5fa'], icon: <TrendingUp size={20} /> }
  ];

  return (
    <>
      <DetailsModal
        title="VIEW DETAILS"
        onClose={onClose}
        metaInfo={metaInfo}
        summaryCards={summaryCards}
        tableColumns={modalColumns}
        tableData={tableData}
        totalRecords={totalRecords}
        isLoading={isLoading}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Expanded Image Lightbox Overlay */}
      {expandedImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setExpandedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10005,
            animation: 'fadeIn 0.2s ease-out',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '85vw',
              maxHeight: '85vh',
              backgroundColor: '#ffffff',
              padding: '16px',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <button
              onClick={() => setExpandedImage(null)}
              style={{
                position: 'absolute',
                top: '-14px',
                right: '-14px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: '2px solid #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
              title="Close Preview (Esc)"
            >
              ✕
            </button>
            <img
              src={expandedImage}
              alt="Product Expanded"
              style={{
                maxWidth: '75vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
