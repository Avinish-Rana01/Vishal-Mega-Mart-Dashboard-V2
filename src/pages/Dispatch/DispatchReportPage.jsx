import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Package } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import CustomDatePicker from '../../components/common/CustomDatePicker';
import CurvedCard from '../../components/common/CurvedCard';
import ReportStatsHeader from '../../components/common/ReportStatsHeader';
import DetailsModal from '../../components/common/DetailsModal';
import { SearchButton, ClearButton } from '../../components/common/ReportActionButton';
import { getDispatchReport, getDispatchReportDetails } from '../../services/dispatchService';
import '../Report/common-reports.css';

export default function DispatchReportPage() {
  const navigate = useNavigate();

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const { defaultFromDate, defaultToDate } = useMemo(() => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 7);
    return {
      defaultFromDate: formatDate(past),
      defaultToDate: formatDate(today)
    };
  }, []);

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);

  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: defaultFromDate,
    toDate: defaultToDate,
    searchTerm: ''
  });

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('TRANS_DATE');
  const [sortDirection, setSortDirection] = useState('desc');

  const [reportData, setReportData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal Details State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchData = useCallback(async (signal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDispatchReport({
        fromDate: appliedFilters.fromDate,
        toDate: appliedFilters.toDate,
        searchTerm: appliedFilters.searchTerm,
        pageIndex,
        pageSize,
        sortColumn,
        sortDirection
      }, signal);

      if (response && response.success) {
        setReportData(response.data || []);
        setTotalRecords(response.totalRecords || 0);
      } else {
        setReportData([]);
        setTotalRecords(0);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      console.error('Failed to fetch dispatch report data', err);
      setError('Failed to fetch dispatch report from server.');
      setReportData([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, pageIndex, pageSize, sortColumn, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleSearch = () => {
    setPageIndex(1);
    setAppliedFilters({
      fromDate,
      toDate,
      searchTerm: appliedFilters.searchTerm
    });
  };

  const handleClear = () => {
    setFromDate(defaultFromDate);
    setToDate(defaultToDate);
    setPageIndex(1);
    setAppliedFilters({
      fromDate: defaultFromDate,
      toDate: defaultToDate,
      searchTerm: ''
    });
  };

  const openModal = async (row) => {
    const vehicleNo = row?.VEHICLE_NO || row?.vehicle_no || row?.VehicleNo || '';
    const date = row?.TRANS_DATE || row?.trans_date || row?.Date || appliedFilters.fromDate;

    setSelectedRow({ vehicleNo, date, ...row });
    setIsModalOpen(true);
    setModalLoading(true);

    try {
      const res = await getDispatchReportDetails({
        vehicleNo,
        fromDate: date,
        toDate: date,
        pageIndex: 1,
        pageSize: 100
      });
      setModalData(res?.data || []);
    } catch (err) {
      console.error('Failed to fetch modal details', err);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Dynamically generate columns from data or fallback
  const columns = useMemo(() => {
    if (!reportData || reportData.length === 0) {
      return [
        { key: 'TRANS_DATE', label: 'DATE', align: 'center' },
        { key: 'VEHICLE_NO', label: 'VEHICLE NO', align: 'left' },
        { key: 'STORE_CODE', label: 'STORE CODE', align: 'center' },
        { key: 'STORE_NAME', label: 'STORE NAME', align: 'left' },
        { key: 'TOTAL_HU', label: 'TOTAL HU', align: 'center' }
      ];
    }

    const firstRow = reportData[0];
    return Object.keys(firstRow).map((key) => {
      const isDate = key.toUpperCase().includes('DATE');
      const isQty = key.toUpperCase().includes('QTY') || key.toUpperCase().includes('COUNT') || key.toUpperCase().includes('HU');

      return {
        key,
        label: key.replace(/_/g, ' '),
        align: isDate || isQty ? 'center' : 'left',
        sortable: true,
        render: (val, row) => {
          if (key === 'VEHICLE_NO' || key === 'VehicleNo') {
            return (
              <span
                className="vmm-clickable-cell report-link-action"
                onClick={(e) => {
                  e.stopPropagation();
                  openModal(row);
                }}
                title="Click to view vehicle breakdown"
              >
                {val || '-'}
              </span>
            );
          }
          return val !== undefined && val !== null ? String(val) : '-';
        }
      };
    });
  }, [reportData]);

  // Modal Table Columns
  const modalColumns = useMemo(() => {
    if (!modalData || modalData.length === 0) return [];
    return Object.keys(modalData[0]).map((key) => ({
      key,
      label: key.replace(/_/g, ' '),
      align: 'left',
      sortable: true,
      render: (val) => (val !== undefined && val !== null ? String(val) : '-')
    }));
  }, [modalData]);

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - DISPATCH TRACKING - <span className="active">VIEW REPORT</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      {/* Standard VMM Report Search / Filter Card */}
      <div className="report-search-card">
        <div className="report-search-header">
          <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
        </div>
        <div className="report-search-body">
          <div className="search-field">
            <label>From Date *</label>
            <CustomDatePicker value={fromDate} onChange={setFromDate} />
          </div>

          <div className="search-field">
            <label>To Date *</label>
            <CustomDatePicker value={toDate} onChange={setToDate} />
          </div>

          <div className="search-buttons">
            <SearchButton onClick={handleSearch} disabled={isLoading} />
            <ClearButton onClick={handleClear} disabled={isLoading} />
          </div>
        </div>
      </div>

      {error && <div className="report-error-banner">{error}</div>}

      {/* Date Range Subheader Banner */}
      <ReportStatsHeader
        leftLabel="MODULE"
        leftValue="DISPATCH TRACKING"
        fromDate={appliedFilters.fromDate}
        toDate={appliedFilters.toDate}
      />

      {/* KPI Cards Row */}
      <div className="ds-kpi-row">
        <div className="ds-kpi-item">
          <CurvedCard
            title="TOTAL DISPATCH RECORDS"
            value={totalRecords.toLocaleString('en-IN')}
            waveColor={['#38bdf8', '#0284c7']}
            icon={<Truck size={20} color="#ffffff" />}
          />
        </div>
        <div className="ds-kpi-item">
          <CurvedCard
            title="ACTIVE HU DISPATCHES"
            value={totalRecords.toLocaleString('en-IN')}
            waveColor={['#86efac', '#22c55e']}
            icon={<Package size={20} color="#ffffff" />}
          />
        </div>
      </div>

      {/* Standard VMM Report Data Table Card */}
      <div className="report-table-wrapper">
        <ReportDataTableCard
          title="Dispatch Tracking Report"
          columns={columns}
          data={reportData}
          totalRecords={totalRecords}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={setPageIndex}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageIndex(1);
          }}
          isLoading={isLoading}
          onSearch={(term) => {
            setPageIndex(1);
            setAppliedFilters(prev => ({ ...prev, searchTerm: term }));
          }}
          searchValue={appliedFilters.searchTerm}
          searchPlaceholder="Search in dispatches..."
          directExport={true}
          exportFileName={`Dispatch_Report_${appliedFilters.fromDate}_${appliedFilters.toDate}.xlsx`}
          onSortChange={(col, dir) => {
            setSortColumn(col);
            setSortDirection(dir);
          }}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
      </div>

      {/* Universal VMM Details Modal */}
      {isModalOpen && (
        <DetailsModal
          onClose={() => setIsModalOpen(false)}
          title={`VEHICLE DISPATCH BREAKDOWN: ${selectedRow?.vehicleNo || ''}`}
          metaInfo={[
            { label: 'Vehicle No', value: selectedRow?.vehicleNo || '-' },
            { label: 'Date', value: selectedRow?.date || appliedFilters.fromDate }
          ]}
          summaryCards={[
            {
              title: 'TOTAL ITEMS',
              value: modalData.length.toString(),
              waveColor: ['#38bdf8', '#0284c7'],
              icon: <Package size={16} />
            }
          ]}
          tableColumns={modalColumns}
          tableData={modalData}
          totalRecords={modalData.length}
          isLoading={modalLoading}
          exportFileName={`Vehicle_${selectedRow?.vehicleNo}_Details.csv`}
          directExport={true}
        />
      )}
    </AppLayout>
  );
}
