import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DetailsModal from '../common/DetailsModal';
import { getEncodingReportDetailsModal } from '../../services/stockService';
import * as Icons from 'lucide-react';
import '../../pages/Dashboard/Dashboard-core.css';

export default function EncodingDetailsModal({ rowData, storeName, fromDate, toDate, onClose }) {
  if (!rowData) return null;

  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalTagsCount, setTotalTagsCount] = useState(
    rowData.ENCODING_TAGS ?? rowData.Encoding_Tags ?? rowData.TAGS ?? rowData.QTY ?? 0
  );

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('ARTICLE');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);

  const ean = rowData.EAN ?? rowData.Ean ?? rowData.ean ?? '';
  const articleNo = rowData.ARTICLE_NO ?? rowData.Article_No ?? rowData.ARTICLE ?? rowData.Material ?? rowData.MATERIAL ?? '';
  const assignedStoreRaw = rowData.Store_Code ?? rowData.STORE_CODE ?? rowData.ASSIGNED_STORE_NAME ?? rowData.Store_Name ?? storeName ?? '';
  const assignedStore = (assignedStoreRaw && assignedStoreRaw !== 'ALL' && assignedStoreRaw !== 'ALL STORES') ? assignedStoreRaw : '';

  const exportFilters = useMemo(() => ({
    storeName: assignedStore,
    ean,
    articleNo,
    fromDate: fromDate || '',
    toDate: toDate || '',
    sortColumn,
    sortDirection
  }), [assignedStore, ean, articleNo, fromDate, toDate, sortColumn, sortDirection]);

  const fetchModalData = useCallback(async (signal) => {
    setIsLoading(true);
    try {
      const result = await getEncodingReportDetailsModal({
        storeName: assignedStore,
        fromDate: fromDate || '',
        toDate: toDate || '',
        ean: ean,
        articleNo: articleNo,
        pageIndex,
        pageSize,
        searchTerm,
        sortColumn,
        sortDirection
      }, signal);

      const items = result?.data || result?.Data || [];
      setTableData(items);
      setTotalRecords(result?.recordCount ?? result?.RecordCount ?? items.length ?? 0);
      if (result?.totalCount !== undefined || result?.TotalCount !== undefined) {
        setTotalTagsCount(result?.totalCount ?? result?.TotalCount ?? 0);
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
        console.error("Failed to fetch Encoding modal details", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [assignedStore, fromDate, toDate, ean, articleNo, pageIndex, pageSize, searchTerm, sortColumn, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchModalData(controller.signal);
    return () => controller.abort();
  }, [fetchModalData]);

  const summaryCards = useMemo(() => [
    {
      title: 'ASSIGNED STORE',
      value: assignedStore || 'ALL STORES',
      waveColor: ['#7dd3fc', '#0284c7'],
      icon: <Icons.Store size={20} />
    },
    {
      title: 'ARTICLE NO',
      value: articleNo || '—',
      waveColor: ['#c084fc', '#9333ea'],
      icon: <Icons.Layers size={20} />
    },
    {
      title: 'EAN',
      value: ean || '—',
      waveColor: ['#bef264', '#84cc16'],
      icon: <Icons.Barcode size={20} />
    },
    {
      title: 'TOTAL TAGS',
      value: Number(totalTagsCount || 0).toLocaleString('en-IN'),
      waveColor: ['#fcd34d', '#ea580c'],
      icon: <Icons.Tag size={20} />
    }
  ], [assignedStore, articleNo, ean, totalTagsCount]);

  const tableColumns = useMemo(() => [
    {
      key: 'RowNumber',
      label: 'SR.NO',
      render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1
    },
    {
      key: 'LOCATION_NAME',
      label: 'STORE CODE',
      render: (val, row) => val || row?.LOCATION_NAME || row?.Location_Name || '—'
    },
    {
      key: 'ARTICLE',
      label: 'ARTICLE NO',
      render: (val, row) => val || row?.ARTICLE || row?.Article || '—'
    },
    {
      key: 'ARTICLE_DESC',
      label: 'ARTICLE DESCRIPTION',
      render: (val, row) => val || row?.ARTICLE_DESC || row?.Article_Desc || '—'
    },
    {
      key: 'EAN',
      label: 'EAN',
      render: (val, row) => val || row?.EAN || row?.ean || '—'
    },
    {
      key: 'Encode_EPC',
      label: 'ENCODE EPC / TAG ID',
      render: (val, row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>
          {val || row?.Encode_EPC || row?.encode_epc || '—'}
        </span>
      )
    },
    {
      key: 'Encode_Date',
      label: 'ENCODE DATE',
      render: (val, row) => {
        const raw = val || row?.Encode_Date || row?.encode_date;
        return raw ? String(raw).replace('T', ' ') : '—';
      }
    }
  ], [pageIndex, pageSize]);

  return (
    <DetailsModal
      title="ENCODING DETAILS"
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
      onPageSizeChange={setPageSize}
      onSearch={(term) => {
        setSearchTerm(term);
        setPageIndex(1);
      }}
      searchPlaceholder="Search EPC / Article"
      searchValue={searchTerm}
      onSortChange={(col, dir) => {
        setSortColumn(col);
        setSortDirection(dir);
        setPageIndex(1);
      }}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      reportName="ALLOCATED_STORE_ITEM_DETAILS"
      exportFilters={exportFilters}
      exportFileName={`Encoding_Details_${ean || articleNo || 'Report'}.xlsx`}
    />
  );
}
