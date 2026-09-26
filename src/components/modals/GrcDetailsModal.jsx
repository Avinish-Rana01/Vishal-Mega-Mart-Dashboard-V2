import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shirt, Layers } from 'lucide-react';
import DetailsModal from '../common/DetailsModal';
import { getGrcModalDetails } from '../../services/stockService';

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

export default function GrcDetailsModal({ modalData, grcStatus: propGrcStatus, date: propDate, onClose }) {
  if (!modalData) return null;

  // Case-insensitive lookup helper
  const getVal = (obj, key) => {
    if (!obj) return undefined;
    const lowerKey = key.toLowerCase();
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
    return foundKey ? obj[foundKey] : undefined;
  };

  const storeCode = getVal(modalData, 'storeCode') || getVal(modalData, 'STORE_CODE') || getVal(modalData, 'STORE') || '';
  const huNo = getVal(modalData, 'huNumber') || getVal(modalData, 'HU') || getVal(modalData, 'HU_NO') || '';
  const dateVal = propDate || getVal(modalData, 'rawGrcDate') || getVal(modalData, 'grcDate') || getVal(modalData, 'GRC_DATE') || getVal(modalData, 'scanTime') || '';
  const scanTime = dateVal;

  // Status determination
  const effectiveGrcStatus = (propGrcStatus !== undefined && propGrcStatus !== null && propGrcStatus !== '')
    ? String(propGrcStatus)
    : ((getVal(modalData, 'grcStatus') !== undefined && getVal(modalData, 'grcStatus') !== null && getVal(modalData, 'grcStatus') !== '')
      ? String(getVal(modalData, 'grcStatus'))
      : '1');

  const statusDisplay = getVal(modalData, 'status') || getVal(modalData, 'RECEIVED_STATUS') || getVal(modalData, 'GRC_STATUS') || 'HU RECEIVED QTY';

  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryData, setSummaryData] = useState(null);

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('GRC_DATE');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);

  const exportFilters = useMemo(() => ({
    storeCode,
    huNo,
    scanTime: dateVal,
    date: dateVal,
    fromDate: dateVal,
    toDate: dateVal,
    grcStatus: effectiveGrcStatus,
    sortColumn,
    sortDirection
  }), [storeCode, huNo, dateVal, effectiveGrcStatus, sortColumn, sortDirection]);

  const fetchDetails = useCallback(async (signal) => {
    setIsLoading(true);
    try {
      const result = await getGrcModalDetails({
        huNo,
        article: '',
        scanTime: dateVal,
        date: dateVal,
        storeCode,
        grcStatus: effectiveGrcStatus,
        pageIndex,
        pageSize,
        searchTerm: '',
        sortColumn,
        sortDirection
      }, signal);

      const items = result?.data || result?.Data || result?.items || result?.Items || [];
      setTableData(items);
      setTotalRecords(result?.totalRecords || result?.TotalRecords || items.length || 0);
      setSummaryData({
        qty: result?.qty ?? result?.Qty ?? 0,
        materialCount: result?.materialCount ?? result?.MaterialCount ?? 0,
        actualQty: result?.actualQty ?? result?.ActualQty ?? 0
      });
    } catch (err) {
      if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
        console.error("Failed to fetch GRC modal details", err);
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [huNo, dateVal, storeCode, effectiveGrcStatus, pageIndex, pageSize, sortColumn, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetails(controller.signal);
    return () => controller.abort();
  }, [fetchDetails]);

  const modalColumns = useMemo(() => [
    { key: 'RowNumber', label: 'SR.NO', render: (val, row, idx) => formatValue(val || (pageIndex - 1) * pageSize + idx + 1) },
    { key: 'STORE_CODE', label: 'STORE CODE', render: (val, row) => formatValue(val || row?.storeCode || row?.StoreCode) },
    { key: 'STORE_NAME', label: 'STORE NAME', render: (val, row) => formatValue(val || row?.storeName || row?.StoreName) },
    { key: 'HU', label: 'HU NUMBER', render: (val, row) => formatValue(val || row?.HU_NO || row?.huNumber) },
    { key: 'MAIN_ARTICLE', label: 'MAIN ARTICLE', render: (val, row) => formatValue(val || row?.mainArticle || row?.MainArticle) },
    { key: 'COMPONENT_ARTICLE', label: 'COMPONENT ARTICLE', render: (val, row) => formatValue(val || row?.componentArticle || row?.ComponentArticle) },
    { 
      key: 'QUANTITY', 
      label: 'QUANTITY', 
      render: (val, row) => {
        const q = val !== undefined ? val : row?.Quantity;
        return isEmpty(q) ? '0' : Number(q).toLocaleString('en-IN');
      } 
    },
    { key: 'RECEIVED_STATUS', label: 'RECEIVED STATUS', render: (val, row) => formatValue(val || row?.receivedStatus || row?.Status || statusDisplay) },
    { key: 'GRC_DATE', label: 'GRC DATE', render: (val, row) => formatDate(val || row?.grcDate || dateVal) }
  ], [pageIndex, pageSize, statusDisplay, dateVal]);

  const metaInfo = [
    { label: 'STORE', value: formatValue(storeCode), valueColor: '#004cff' },
    { label: 'HU NUMBER', value: formatValue(huNo), valueColor: '#004cff' },
    { label: 'GRC DATE', value: formatDate(dateVal) },
    { label: 'STATUS', value: formatValue(statusDisplay) }
  ];

  const safeNum = (val) => (val !== undefined && val !== null ? val : 0).toLocaleString('en-IN');

  const summaryCards = [
    { 
      title: "GRC STATUS", 
      value: statusDisplay || "HU RECEIVED QTY", 
      waveColor: ['#c7d2fe', '#818cf8'], 
      icon: (
        <svg width="20" height="20" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path d="M60,160 Q40,160 45,130 Q50,70 100,70 Q150,70 155,130 Q160,160 140,160 Z" fill="black" stroke="black" strokeWidth="2"></path>
          <path d="M85,70 L75,40 Q100,30 125,40 L115,70 Z" fill="black" stroke="black" strokeWidth="2"></path>
          <rect x="82" y="65" width="36" height="8" rx="4" fill="black" stroke="black" strokeWidth="1"></rect>
          <text x="100" y="130" fontFamily="Arial" fontSize="35" fill="white" textAnchor="middle" fontWeight="bold">$</text>
          <path d="M70,100 Q80,105 90,100" fill="none"></path>
        </svg>
      )
    },
    { 
      title: "TOTAL ARTICLE COUNT", 
      value: safeNum(summaryData?.materialCount), 
      waveColor: ['#fbcfe8', '#f472b6'], 
      icon: <Shirt size={20} /> 
    },
    { 
      title: "TOTAL QUANTITY", 
      value: safeNum(summaryData?.qty), 
      waveColor: ['#bbf7d0', '#4ade80'], 
      icon: <Layers size={20} /> 
    }
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
      onPageSizeChange={(newSize) => {
        setPageSize(newSize);
        setPageIndex(1);
      }}
      onSortChange={(col, dir) => {
        setSortColumn(col);
        setSortDirection(dir);
        setPageIndex(1);
      }}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      reportName="GRC_ARTICLE_ITEM_DETAILS"
      exportFilters={exportFilters}
      exportFileName={`GRC_Details_${storeCode || 'ALL'}_${huNo || 'Report'}_${dateVal || 'All'}.xlsx`}
    />
  );
}
