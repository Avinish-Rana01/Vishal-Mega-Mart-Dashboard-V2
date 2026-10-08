import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingBag } from 'lucide-react';
import DetailsModal from '../common/DetailsModal';
import { getTagCleaningData } from '../../services/stockService';
import '../../pages/Dashboard/Dashboard-core.css';

/**
 * Helper to normalize date to YYYY-MM-DD
 */
const formatDateStr = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      return String(dateVal).split('T')[0].split(' ')[0];
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  } catch {
    return String(dateVal).split('T')[0].split(' ')[0];
  }
};

/**
 * TagCleaningDetailModal Component
 *
 * Displays store-level breakdown for Tag Cleaning Report.
 * Title: VIEW DETAILS
 * Cards: TOTAL VALIDATED QTY, TOTAL CLEANED QTY
 * Columns: SR.NO, TAG CLEANED DATE, STORE NAME (TAG BELONGS TO), TOTAL COUNT
 */
export default function TagCleaningDetailModal({
  isOpen,
  rowData,
  rowDate,
  date,
  onClose
}) {
  if (isOpen !== undefined && !isOpen) return null;
  if (!rowData && !rowDate && !date) return null;

  const rawDate =
    rowDate ||
    date ||
    rowData?.TAG_CLEANED_DATE ||
    rowData?.taG_CLEANED_DATE ||
    rowData?.tagCleanedDate ||
    rowData?.tag_CLEANED_DATE ||
    rowData?.inward_DATE ||
    rowData?.INWARD_DATE ||
    rowData?.Date ||
    rowData?.date ||
    '';

  const formattedDate = useMemo(() => formatDateStr(rawDate), [rawDate]);

  // Modal Table State
  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);

  const [totalValidatedCount, setTotalValidatedCount] = useState(
    rowData?.TOTAL_VALIDATED_QTY ??
    rowData?.totaL_VALIDATED_QTY ??
    rowData?.totalValidatedQty ??
    rowData?.total_VALIDATED_QTY ??
    0
  );
  const [totalCleanedCount, setTotalCleanedCount] = useState(
    rowData?.TOTAL_CLEANED_QTY ??
    rowData?.totaL_CLEANED_QTY ??
    rowData?.totalCleanedQty ??
    rowData?.total_CLEANED_QTY ??
    0
  );

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('INWARD_DATE');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch paginated data for table
  const fetchModalData = useCallback(async (signal) => {
    if (!formattedDate) return;
    setIsLoading(true);
    try {
      const result = await getTagCleaningData({
        searchTerm,
        pageIndex,
        pageSize,
        fromDate: formattedDate,
        toDate: formattedDate,
        sortColumn,
        sortDirection
      }, signal);

      const items = result?.data || result?.Data || [];
      const pager = result?.pager || result?.Pager || {};

      setTableData(items);
      const recCount = pager?.recordCount ?? pager?.RecordCount ?? items.length ?? 0;
      setTotalRecords(recCount);

      if (pager?.totalCount !== undefined || pager?.TotalCount !== undefined) {
        setTotalCleanedCount(pager?.totalCount ?? pager?.TotalCount ?? 0);
      }
      if (pager?.tagValidatedCount !== undefined || pager?.TagValidatedCount !== undefined) {
        setTotalValidatedCount(pager?.tagValidatedCount ?? pager?.TagValidatedCount ?? 0);
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
        console.error("Failed to fetch Tag Cleaning detail modal data", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [formattedDate, pageIndex, pageSize, searchTerm, sortColumn, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchModalData(controller.signal);
    return () => controller.abort();
  }, [fetchModalData]);

  // Export filters for universal streaming export
  const exportFilters = useMemo(() => ({
    fromDate: formattedDate,
    toDate: formattedDate
  }), [formattedDate]);

  // Two Summary KPI Cards matching reference design
  const summaryCards = useMemo(() => [
    {
      title: 'TOTAL VALIDATED QTY',
      value: Number(totalValidatedCount || 0).toLocaleString('en-IN'),
      waveColor: ['#ffedd5', '#fb923c'],
      icon: <ShoppingBag size={20} />
    },
    {
      title: 'TOTAL CLEANED QTY',
      value: Number(totalCleanedCount || 0).toLocaleString('en-IN'),
      waveColor: ['#e0e7ff', '#6366f1'],
      icon: <ShoppingBag size={20} />
    }
  ], [totalValidatedCount, totalCleanedCount]);

  // Table Columns matching reference structure and headers:
  // SR.NO | TAG CLEANED DATE | STORE NAME (TAG BELONGS TO) | TOTAL COUNT
  const tableColumns = useMemo(() => [
    {
      key: 'RowNumber',
      label: 'SR.NO',
      align: 'center',
      sortable: true,
      sortKey: 'RowNumber',
      render: (val, row, idx) => (
        <span style={{ fontWeight: 500, color: '#475569' }}>
          {row?.rowNumber ?? row?.RowNumber ?? row?.sR_NO ?? row?.SR_NO ?? (((pageIndex - 1) * pageSize) + idx + 1)}
        </span>
      )
    },
    {
      key: 'INWARD_DATE',
      label: 'TAG CLEANED DATE',
      align: 'center',
      sortable: true,
      sortKey: 'INWARD_DATE',
      render: (val, row) => {
        const raw =
          val ||
          row?.inwarD_DATE ||
          row?.inward_DATE ||
          row?.INWARD_DATE ||
          row?.tagCleanedDate ||
          row?.TAG_CLEANED_DATE ||
          formattedDate;
        if (!raw) return 'N/A';
        return (
          <span style={{ fontWeight: 500, color: '#1e293b' }}>
            {String(raw).split('T')[0]}
          </span>
        );
      }
    },
    {
      key: 'STORE_NAME',
      label: 'STORE NAME (TAG BELONGS TO)',
      sortable: true,
      sortKey: 'STORE_NAME',
      render: (val, row) => {
        const storeName =
          val ||
          row?.storE_NAME ||
          row?.store_NAME ||
          row?.STORE_NAME ||
          row?.Store_Name ||
          row?.storeName;
        return (
          <span style={{ fontWeight: 500, color: '#1e293b' }}>
            {storeName || 'N/A'}
          </span>
        );
      }
    },
    {
      key: 'TOTAL_COUNT',
      label: 'TOTAL COUNT',
      align: 'center',
      sortable: true,
      sortKey: 'TOTAL_COUNT',
      render: (val, row) => {
        const num =
          val ??
          row?.totaL_COUNT ??
          row?.total_COUNT ??
          row?.TOTAL_COUNT ??
          row?.totalCount;
        return (
          <span style={{ fontWeight: 500, color: '#1e293b' }}>
            {num !== undefined && num !== null ? Number(num).toLocaleString('en-IN') : '0'}
          </span>
        );
      }
    }
  ], [pageIndex, pageSize, formattedDate]);

  return (
    <DetailsModal
      title="VIEW DETAILS"
      onClose={onClose}
      metaInfo={[]}
      summaryCards={summaryCards}
      tableColumns={tableColumns}
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
      onSearch={(term) => {
        setSearchTerm(term);
        setPageIndex(1);
      }}
      searchPlaceholder="Search Records"
      searchValue={searchTerm}
      onSortChange={(col, dir) => {
        setSortColumn(col);
        setSortDirection(dir);
        setPageIndex(1);
      }}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      reportName="TAG_CLEANING_DETAILS"
      exportFilters={exportFilters}
      directExport={true}
      exportFileName={`Tag_Cleaning_Details_${formattedDate || 'Report'}.xlsx`}
    />
  );
}
