import React, { useState, useEffect, useCallback } from 'react';
import { Shirt, Layers, ScanLine, TrendingUp, TrendingDown, ArrowDownSquare } from 'lucide-react';
import DetailsModal from '../common/DetailsModal';
import { getCycleCountDetails } from '../../services/stockService';

const modalColumns = [
  { key: 'RowNumber', label: 'SR.NO' },
  { key: 'Ref_ID', label: 'REFERENCE NO' },
  { key: 'ECODE', label: 'ECODE' },
  { key: 'MC', label: 'MC' },
  { key: 'MC_TEXT', label: 'MC TEXT' },
  { key: 'ARTICLE', label: 'ARTICLE' },
  { key: 'ARTICLE_DESC', label: 'ARTICLE DESCRIPTION' },
  { key: 'EAN', label: 'BARCODE' },
  { key: 'Actual_Qty', label: 'SYSTEM STOCK' },
  { key: 'Scanned_Qty', label: 'SCANNED QTY' },
  { key: 'Variance', label: 'VARIANCE', render: (val) => {
      const v = Number(val || 0);
      return <span style={{color: v < 0 ? '#dc2626' : (v > 0 ? '#16a34a' : 'inherit'), fontWeight: v !== 0 ? 'bold' : 'normal'}}>{v}</span>;
  }},
  { key: 'START_DATE', label: 'START DATE', render: (val) => {
    let d = val || '';
    if (d && typeof d === 'string' && d.includes('T')) return d.split('T')[0];
    return d;
  }},
  { key: 'START_TIME', label: 'START TIME', render: (val) => {
    let t = val || '';
    if (t && typeof t === 'string' && t.includes('.')) return t.split('.')[0];
    return t;
  }},
  { key: 'END_DATE', label: 'END DATE', render: (val) => {
    let d = val || '';
    if (d && typeof d === 'string' && d.includes('T')) return d.split('T')[0];
    return d;
  }},
  { key: 'END_TIME', label: 'END TIME', render: (val) => {
    let t = val || '';
    if (t && typeof t === 'string' && t.includes('.')) return t.split('.')[0];
    return t;
  }}
];

export default function CycleCountModal({ modalData, onClose }) {
  if (!modalData) return null;

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
    { label: 'STORE', value: storeCode || 'N/A', valueColor: '#004cff' },
    { label: 'CYCLE COUNT TYPE', value: getVal(modalData, 'CYCLE_COUNT_TYPE') || 'ARTICLE LEVEL', valueColor: '#004cff' },
    { label: 'DATE', value: fromDate || 'N/A' },
    { label: 'CYCLE COUNT TIME', value: getVal(modalData, 'Time_Taken') || 'N/A' }
  ];

  const safeNum = (val) => (val !== undefined && val !== null ? val : 0).toLocaleString('en-IN');

  const summaryCards = [
    { title: "NO OF ARTICLES", value: summaryData ? safeNum(summaryData.totalCount || summaryData.TotalCount) : "0", waveColor: ['#fecaca', '#f87171'], icon: <Shirt size={20} /> },
    { title: "SYSTEM STOCK", value: summaryData ? safeNum(summaryData.actualQty || summaryData.ActualQty) : "0", waveColor: ['#fbcfe8', '#f472b6'], icon: <Layers size={20} /> },
    { title: "SCANNED QTY", value: summaryData ? safeNum(summaryData.scannedQty || summaryData.ScannedQty) : "0", waveColor: ['#bbf7d0', '#4ade80'], icon: <ScanLine size={20} /> },
    { title: "NET DIFFERENCE", value: summaryData ? safeNum(summaryData.diffQty || summaryData.DiffQty) : "0", waveColor: ['#fecaca', '#f87171'], icon: <TrendingDown size={20} /> },
    { title: "SHORT QTY", value: summaryData ? safeNum(summaryData.shortQty || summaryData.ShortQty) : "0", waveColor: ['#d9f99d', '#a3e635'], icon: <ArrowDownSquare size={20} /> },
    { title: "EXCESS QTY", value: summaryData ? safeNum(summaryData.excessQty || summaryData.ExcessQty) : "0", waveColor: ['#bfdbfe', '#60a5fa'], icon: <TrendingUp size={20} /> }
  ];

  return (
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
  );
}
