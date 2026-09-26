import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText, XCircle, RotateCcw, Layers, MinusCircle } from 'lucide-react';
import DetailsModal from '../common/DetailsModal';
import { getVoidReconciliationDataModel, getReturnReconciliationDataModel } from '../../services/stockService';

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
  if (d.includes(' ')) d = d.split(' ')[0];
  return d || 'N/A';
};

const formatNum = (val) => {
  if (isEmpty(val)) return '0';
  const n = Number(val);
  return isNaN(n) ? val : n.toLocaleString('en-IN');
};

export default function ReconciliationDetailsModal({ modalData, onClose, type = 'return' }) {
  if (!modalData) return null;

  const isReturn = type === 'return';

  // Case-insensitive lookup helper
  const getVal = (obj, key) => {
    if (!obj) return undefined;
    const lowerKey = key.toLowerCase();
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
    return foundKey ? obj[foundKey] : undefined;
  };

  // Context extracted from clicked row / parent report
  const storeCode = getVal(modalData, 'STORE_CODE') || getVal(modalData, 'StoreCode') || getVal(modalData, 'STORE') || modalData?.selectedStore || '';
  const rawDate = isReturn 
    ? (getVal(modalData, 'BILL_DATE') || getVal(modalData, 'RETURN_DATE') || getVal(modalData, 'DATE') || modalData?.fromDate || '')
    : (getVal(modalData, 'VOID_DATE') || getVal(modalData, 'VoidDate') || getVal(modalData, 'DATE') || modalData?.fromDate || '');
  const billDate = rawDate ? String(rawDate).split('T')[0].split(' ')[0] : '';
  const pos = getVal(modalData, 'COUNTER_NO') || getVal(modalData, 'CounterNo') || getVal(modalData, 'POS') || getVal(modalData, 'pos') || '';
  const ean = getVal(modalData, 'EAN') || getVal(modalData, 'ean') || '';

  const exportFilters = useMemo(() => ({
    storeCode,
    billDate,
    pos,
    ean,
    sortColumn,
    sortDirection
  }), [storeCode, billDate, pos, ean, sortColumn, sortDirection]);

  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryData, setSummaryData] = useState(null);

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(isReturn ? 'BILL_DATE' : 'VOID_DATE');
  const [sortDirection, setSortDirection] = useState('ASC');
  const [isLoading, setIsLoading] = useState(true);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fetchDetails = useCallback(async (signal) => {
    setIsLoading(true);
    try {
      const fetchApi = isReturn ? getReturnReconciliationDataModel : getVoidReconciliationDataModel;
      const result = await fetchApi({
        storeCode,
        billDate,
        pos,
        ean,
        pageIndex,
        pageSize,
        searchTerm,
        sortColumn,
        sortDirection,
        signal
      });

      const rawItems = result?.data || result?.Data || [];
      const normalizedItems = rawItems.map((item, idx) => {
        const itemDate = item.BILL_DATE || item.bilL_DATE || item.bill_date || item.VOID_DATE || item.voiD_DATE || item.void_date || billDate;
        const itemQty = isReturn
          ? (item.RETURN_QTY ?? item.returN_QTY ?? item.return_qty ?? 0)
          : (item.VOID_QTY ?? item.voiD_QTY ?? item.void_qty ?? 0);
        const itemEnc = item.ENCODE_QTY ?? item.encodE_QTY ?? item.encode_qty ?? 0;
        const itemDiff = item.DIFFERENCE_QTY ?? item.differencE_QTY ?? item.difference_qty ?? 0;

        return {
          ...item,
          RowNumber: ((pageIndex - 1) * pageSize) + idx + 1,
          DATE: itemDate,
          POS_TYPE: item.POS_TYPE || item.poS_TYPE || item.pos_type || 'DPOS',
          STORE_CODE: item.STORE_CODE || item.storE_CODE || item.store_code || storeCode,
          COUNTER_NO: item.COUNTER_NO || item.counteR_NO || item.counter_no || pos,
          EAN: item.EAN || item.ean || item.Ean || '',
          MATERIAL: item.MATERIAL || item.material || item.Material || '',
          QTY: itemQty,
          ENCODE_QTY: itemEnc,
          DIFFERENCE_QTY: itemDiff,
          STATUS: item.STATUS || item.status || item.Status || 'PENDING'
        };
      });

      setTableData(normalizedItems);
      const recordCount = result?.recordCount ?? result?.RecordCount ?? normalizedItems.length;
      setTotalRecords(recordCount);
      setSummaryData({
        recordCount,
        qty: (isReturn ? (result?.returnQty ?? result?.ReturnQty) : (result?.voidQty ?? result?.VoidQty)) ?? 0,
        encodeQty: result?.encodeQty ?? result?.EncodeQty ?? 0,
        differenceQty: result?.differenceQty ?? result?.DifferenceQty ?? 0
      });
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled') {
        console.error("Failed to fetch reconciliation modal data", err);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [isReturn, storeCode, billDate, pos, ean, pageIndex, pageSize, searchTerm, sortColumn, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetails(controller.signal);
    return () => controller.abort();
  }, [fetchDetails]);

  // Modal Table Columns matching the design
  const modalColumns = useMemo(() => [
    { key: 'RowNumber', label: 'SR.NO', render: formatValue },
    { key: 'DATE', label: isReturn ? 'RETURN DATE' : 'VOID DATE', render: formatDate },
    { key: 'POS_TYPE', label: 'POS TYPE', render: formatValue },
    { key: 'STORE_CODE', label: 'STORE CODE', render: formatValue },
    { key: 'COUNTER_NO', label: 'POS COUNTER', render: formatValue },
    { key: 'EAN', label: 'EAN', render: formatValue },
    { key: 'MATERIAL', label: 'MATERIAL', render: formatValue },
    { key: 'QTY', label: isReturn ? 'RETURN QTY' : 'VOID QTY', render: formatNum },
    { key: 'ENCODE_QTY', label: 'ENCODE QTY', render: formatNum },
    { key: 'DIFFERENCE_QTY', label: 'DIFFERENCE QTY', render: formatNum },
    {
      key: 'STATUS',
      label: 'STATUS',
      render: (val) => {
        const statusStr = String(val || 'PENDING').toUpperCase();
        const isPending = statusStr === 'PENDING';
        return (
          <span
            style={{
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: '75px',
              background: isPending ? '#fef3c7' : '#dcfce7',
              color: isPending ? '#d97706' : '#16a34a',
              fontWeight: 700,
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '12px'
            }}
          >
            {statusStr}
          </span>
        );
      }
    }
  ], [isReturn]);

  const safeNum = (val) => (val !== undefined && val !== null ? val : 0).toLocaleString('en-IN');

  const eanCount = summaryData?.recordCount ?? totalRecords ?? 0;
  const totalQty = summaryData?.qty ?? 0;
  const encodeQty = summaryData?.encodeQty ?? 0;
  const diffQty = summaryData?.differenceQty ?? 0;

  // 4 Top Curved Cards
  const summaryCards = [
    {
      title: "EAN COUNT",
      value: safeNum(eanCount),
      waveColor: ['#a7f3d0', '#6ee7b7'],
      icon: <FileText size={20} color="#059669" />
    },
    {
      title: isReturn ? "RETURN QUANTITY" : "VOID QUANTITY",
      value: safeNum(totalQty),
      waveColor: ['#fbcfe8', '#f472b6'],
      icon: isReturn ? <RotateCcw size={20} color="#db2777" /> : <XCircle size={20} color="#db2777" />
    },
    {
      title: "ENCODE QUANTITY",
      value: safeNum(encodeQty),
      waveColor: ['#e9d5ff', '#c084fc'],
      icon: <Layers size={20} color="#7c3aed" />
    },
    {
      title: "DIFFERENCE QUANTITY",
      value: safeNum(diffQty),
      waveColor: ['#d9f99d', '#a3e635'],
      icon: <MinusCircle size={20} color="#65a30d" />
    }
  ];

  const handleSearch = useCallback((term) => {
    setSearchTerm((prev) => {
      if (prev === term) return prev;
      setPageIndex(1);
      return term;
    });
  }, []);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setPageIndex(1);
  }, []);

  const handleSortChange = useCallback((col, dir) => {
    setSortColumn(col);
    setSortDirection(dir);
    setPageIndex(1);
  }, []);

  return (
    <DetailsModal
      title="VIEW DETAILS"
      onClose={onClose}
      summaryCards={summaryCards}
      tableColumns={modalColumns}
      tableData={tableData}
      totalRecords={totalRecords}
      isLoading={isLoading}
      pageIndex={pageIndex}
      onPageChange={setPageIndex}
      pageSize={pageSize}
      onPageSizeChange={handlePageSizeChange}
      onSearch={handleSearch}
      searchPlaceholder="Search Records"
      onSortChange={handleSortChange}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      reportName={isReturn ? "RETURN_RECONCILIATION_ITEM_DETAILS" : "VOID_RECONCILIATION_ITEM_DETAILS"}
      exportFilters={exportFilters}
      exportFileName={`${isReturn ? 'Return' : 'Void'}_Reconciliation_Details_${storeCode}_${billDate}.xlsx`}
    />
  );
}
