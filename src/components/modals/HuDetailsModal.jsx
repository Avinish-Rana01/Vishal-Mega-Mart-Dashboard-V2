import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DetailsModal from '../common/DetailsModal';
import { getHuReportViewDetails } from '../../services/stockService';
import * as Icons from 'lucide-react';
import '../../pages/Dashboard/Dashboard-core.css';

export default function HuDetailsModal({ huRow, huStatus, fromDate, toDate, onClose }) {
  if (!huRow) return null;

  const [tableData, setTableData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryData, setSummaryData] = useState({
    actualQty: huRow.Act_Qty ?? huRow.Actual_Qty ?? 0,
    scannedQty: huRow.Scan_Qty ?? huRow.Scanned_Qty ?? 0
  });

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('HU_Number');
  const [sortDirection, setSortDirection] = useState('asc');
  const [isLoading, setIsLoading] = useState(true);

  const exportFilters = useMemo(() => ({
    refNo: huRow.Ref_No || huRow.ref_No || '',
    huNo: huRow.HU_Number || huRow.hu_number || '',
    huStatus: (huStatus !== undefined && huStatus !== null && String(huStatus).trim() !== '') ? String(huStatus) : '1',
    fromDate: fromDate || '',
    toDate: toDate || '',
    sortColumn,
    sortDirection
  }), [huRow, huStatus, fromDate, toDate, sortColumn, sortDirection]);

  const fetchModalData = useCallback(async (signal) => {
    setIsLoading(true);
    try {
      const result = await getHuReportViewDetails({
        searchTerm,
        pageIndex,
        pageSize,
        huStatus: (huStatus !== undefined && huStatus !== null && String(huStatus).trim() !== '') ? String(huStatus) : '1',
        huNo: huRow.HU_Number || huRow.hu_number || '',
        refNo: huRow.Ref_No || huRow.ref_No || '',
        fromDate: fromDate || '',
        toDate: toDate || '',
        sortColumn,
        sortDirection
      }, signal);

      const items = result?.data || result?.Data || [];
      setTableData(items);
      setTotalRecords(result?.recordCount ?? result?.RecordCount ?? items.length ?? 0);
      setSummaryData({
        actualQty: result?.actualQty ?? result?.ActualQty ?? huRow.Act_Qty ?? 0,
        scannedQty: result?.scannedQty ?? result?.ScannedQty ?? huRow.Scan_Qty ?? 0
      });
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
        console.error("Failed to fetch HU view details", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [huRow, huStatus, fromDate, toDate, pageIndex, pageSize, searchTerm, sortColumn, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchModalData(controller.signal);
    return () => controller.abort();
  }, [fetchModalData]);

  const summaryCards = useMemo(() => [
    {
      title: 'HU STATUS',
      value: String(huStatus) === '0' ? 'UNPROCESSED HU' : 'PROCESSED HU',
      waveColor: ['#7dd3fc', '#0284c7'],
      icon: <Icons.PackageCheck size={20} />
    },
    {
      title: 'HU NUMBER',
      value: huRow.HU_Number || huRow.hu_number || '—',
      waveColor: ['#bef264', '#84cc16'],
      icon: <Icons.FileText size={20} />
    },
    {
      title: 'ACTUAL QTY',
      value: Number(summaryData.actualQty || 0).toLocaleString('en-IN'),
      waveColor: ['#c084fc', '#9333ea'],
      icon: <Icons.CheckSquare size={20} />
    },
    {
      title: 'SCANNED QTY',
      value: Number(summaryData.scannedQty || 0).toLocaleString('en-IN'),
      waveColor: ['#fcd34d', '#ea580c'],
      icon: <Icons.Scan size={20} />
    }
  ], [huRow, huStatus, summaryData]);

  const tableColumns = useMemo(() => [
    {
      key: 'RowNumber',
      label: 'SR.NO',
      render: (val, row, idx) => ((pageIndex - 1) * pageSize) + idx + 1
    },
    {
      key: 'Sending_Plant',
      label: 'SENDING PLANT',
      render: (val, row) => val || row?.Sending_Plant || '—'
    },
    {
      key: 'Receiving_Plant',
      label: 'RECEIVING PLANT',
      render: (val, row) => val || row?.Receiving_Plant || '—'
    },
    {
      key: 'HU_Number',
      label: 'HU NUMBER',
      render: (val, row) => val || row?.HU_Number || huRow.HU_Number || '—'
    },
    {
      key: 'Material',
      label: 'PREPACK ARTICLE NO',
      render: (val, row) => val || row?.Material || row?.Prepack_Article_No || '—'
    },
    {
      key: 'Material_Code',
      label: 'VARIANT ARTICLE NO',
      render: (val, row) => val || row?.Material_Code || row?.Variant_Article_No || '—'
    },
    {
      key: 'Actual_Qty',
      label: 'ACTUAL QTY',
      render: (val, row) => Number(val ?? row?.Actual_Qty ?? row?.Act_Qty ?? 0).toLocaleString('en-IN')
    },
    {
      key: 'Scan_Qty',
      label: 'SCANNED QTY',
      render: (val, row) => Number(val ?? row?.Scan_Qty ?? 0).toLocaleString('en-IN')
    },
    {
      key: 'STATUS',
      label: 'STATUS',
      render: (val, row) => val || row?.STATUS || row?.Status || '—'
    },
    {
      key: 'Scan_Date',
      label: 'SCANNED DATE',
      render: (val, row) => {
        const raw = val || row?.Scan_Date;
        return raw ? String(raw).replace('T', ' ') : '—';
      }
    }
  ], [pageIndex, pageSize, huRow]);

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
      onPageSizeChange={setPageSize}
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
      reportName="HU_REPORT_VIEW_DETAILS"
      exportFilters={exportFilters}
      exportFileName={`HU_Details_${huRow.HU_Number || 'Report'}.xlsx`}
    />
  );
}
