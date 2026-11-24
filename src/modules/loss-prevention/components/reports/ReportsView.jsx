import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import PageHeader from '../common/PageHeader';
import SelectedStore from '../common/SelectedStore';
import DateFilter from '../common/DateFilter';
import StatCard from '../common/StatCard';
import DataTable from '../common/DataTable';
import SweetAlertModal from '../common/SweetAlertModal';
import {
  fetchIncidentReportSummary,
  fetchIncidentReportDetails,
  formatCurrency,
  getSavedStore,
} from '../../../../services/lossPreventionService';
import * as XLSX from 'xlsx';
import {
  Search,
  ChevronDown,
  Check,
  Tag,
  TagX,
  AlertTriangle,
  TrendingDown,
  FileSpreadsheet,
  Printer,
  X,
  ExternalLink,
  Calendar,
  Store,
  Layers,
} from 'lucide-react';

const formatApiDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ROW_OPTIONS = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: 'All', value: 'All' },
];

const ReportsView = () => {
  // -------------------------------------------------------------
  // 1. Global / Header Filter State
  // -------------------------------------------------------------
  const [selectedStore, setSelectedStore] = useState(() => {
    const saved = getSavedStore();
    if (saved?.noStore) return 'none';
    return saved?.storeCode || '';
  });
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const formattedToday = formatApiDate(today);
    return {
      label: 'Today',
      fromDate: formattedToday,
      toDate: formattedToday,
    };
  });

  // -------------------------------------------------------------
  // 2. Main Summary Table State
  // -------------------------------------------------------------
  const [mainLoading, setMainLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [mainSelectedEventType, setMainSelectedEventType] = useState('All'); // 'All' | 'Loss' | 'Checkout'
  const [mainRowsPerPage, setMainRowsPerPage] = useState(10);
  const [mainCurrentPage, setMainCurrentPage] = useState(1);
  const [mainRowsDropdownOpen, setMainRowsDropdownOpen] = useState(false);
  const mainRowsDropdownRef = useRef(null);

  const [mainExportMenuOpen, setMainExportMenuOpen] = useState(false);
  const [isMainExporting, setIsMainExporting] = useState(false);
  const [mainExportProgress, setMainExportProgress] = useState(0);

  const [mainReportData, setMainReportData] = useState({
    records: [],
    totalRecords: 0,
    totalAll: 0,
    totalLoss: 0,
    totalCheckout: 0,
    totalTags: 0,
    potentialLoss: '₹0',
    pageSize: 10,
    pageNumber: 1,
    totalPages: 1,
  });

  // -------------------------------------------------------------
  // 3. Modal (Detailed Summary Table) State
  // -------------------------------------------------------------
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowContext, setSelectedRowContext] = useState(null); // { date, storeCode, storeName, articleCount, qty, amount, eventType }
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalRowsPerPage, setModalRowsPerPage] = useState(10);
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalRowsDropdownOpen, setModalRowsDropdownOpen] = useState(false);
  const modalRowsDropdownRef = useRef(null);

  const [modalExportMenuOpen, setModalExportMenuOpen] = useState(false);
  const [isModalExporting, setIsModalExporting] = useState(false);
  const [modalExportProgress, setModalExportProgress] = useState(0);

  const [modalReportData, setModalReportData] = useState({
    records: [],
    totalRecords: 0,
    totalAll: 0,
    totalTheft: 0,
    totalLoss: 0,
    totalUntagged: 0,
    totalCheckout: 0,
    totalTags: 0,
    potentialLoss: '₹0',
    pageSize: 10,
    pageNumber: 1,
    totalPages: 1,
  });

  // -------------------------------------------------------------
  // 4. Common Alerts & Printing
  // -------------------------------------------------------------
  const [sweetAlert, setSweetAlert] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printType, setPrintType] = useState('main'); // 'main' | 'modal'
  const [printRecords, setPrintRecords] = useState(null);
  const [progressStatusText, setProgressStatusText] = useState('');

  // Close rows dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mainRowsDropdownRef.current && !mainRowsDropdownRef.current.contains(e.target)) {
        setMainRowsDropdownOpen(false);
      }
      if (modalRowsDropdownRef.current && !modalRowsDropdownRef.current.contains(e.target)) {
        setModalRowsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  // Lock background scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (!modalOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar width so background content doesn't shift horizontally
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [modalOpen]);

  // -------------------------------------------------------------
  // 5. Data Fetching: Main Summary Table
  // -------------------------------------------------------------
  const loadMainReport = useCallback(
    async (overrides = {}) => {
      setMainLoading(true);
      const store = overrides.store !== undefined ? overrides.store : selectedStore;
      const fromDate = overrides.fromDate !== undefined ? overrides.fromDate : dateRange.fromDate;
      const toDate = overrides.toDate !== undefined ? overrides.toDate : dateRange.toDate;
      const page = overrides.page !== undefined ? overrides.page : mainCurrentPage;
      const pageSize = overrides.pageSize !== undefined ? overrides.pageSize : mainRowsPerPage;
      const search = overrides.search !== undefined ? overrides.search : mainSearchQuery;
      const eventType = overrides.eventType !== undefined ? overrides.eventType : mainSelectedEventType;
      const preset = overrides.preset !== undefined
        ? overrides.preset
        : (dateRange.label ? dateRange.label.replace(/\s+/g, '') : undefined);
      const effectivePageSize = pageSize === 'All' ? 10000 : Number(pageSize);

      try {
        const storeObj = typeof store === 'object' ? store : getSavedStore();
        const storeCodeVal = typeof store === 'string' ? store : storeObj?.storeCode;
        const storeIdVal = storeCodeVal && storeCodeVal === storeObj?.storeCode && Number(storeObj.storeId) > 0
          ? Number(storeObj.storeId) : undefined;

        const res = await fetchIncidentReportSummary({
          Preset: preset,
          StoreCode: storeCodeVal !== 'none' ? storeCodeVal : undefined,
          StoreId: storeIdVal,
          FromDate: fromDate || undefined,
          ToDate: toDate || undefined,
          EventType: eventType !== 'All' ? eventType : undefined,
          PageNumber: page,
          PageSize: effectivePageSize,
          Search: search.trim() || undefined,
        });

        if (res && res.records) {
          setMainReportData(res);
          if (res.pageNumber) {
            setMainCurrentPage(res.pageNumber);
          }
        }
      } catch (error) {
        console.error('Failed to load incident report summary:', error);
      } finally {
        setMainLoading(false);
        setInitialLoading(false);
      }
    },
    [selectedStore, dateRange.label, dateRange.fromDate, dateRange.toDate, mainCurrentPage, mainRowsPerPage, mainSearchQuery, mainSelectedEventType]
  );

  useEffect(() => {
    loadMainReport();
  }, [selectedStore, dateRange.label, dateRange.fromDate, dateRange.toDate]);

  // Synchronize with store selector changes across other views/popovers
  useEffect(() => {
    const handleGlobalStoreChange = (e) => {
      const newStore = e.detail;
      if (newStore) {
        setSelectedStore(newStore.noStore ? 'none' : (newStore.storeCode || ''));
        loadMainReport({ store: newStore });
      }
    };
    window.addEventListener('lp-store-changed', handleGlobalStoreChange);
    return () => window.removeEventListener('lp-store-changed', handleGlobalStoreChange);
  }, [loadMainReport]);

  // Debounce server search for main summary table
  const prevMainSearchQuery = useRef(mainSearchQuery);
  useEffect(() => {
    if (prevMainSearchQuery.current === mainSearchQuery) return;
    prevMainSearchQuery.current = mainSearchQuery;
    const timer = setTimeout(() => {
      loadMainReport({ search: mainSearchQuery, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [mainSearchQuery, loadMainReport]);

  const handleMainEventTypeChange = (type) => {
    setMainSelectedEventType(type);
    setMainCurrentPage(1);
    loadMainReport({ eventType: type, page: 1 });
  };

  // -------------------------------------------------------------
  // 6. Data Fetching: Detailed Table Inside Modal
  // -------------------------------------------------------------
  const loadModalReport = useCallback(
    async (overrides = {}) => {
      if (!selectedRowContext) return;
      setModalLoading(true);

      const targetDate = overrides.date !== undefined ? overrides.date : selectedRowContext.date;
      const targetStore = overrides.store !== undefined ? overrides.store : selectedRowContext.storeCode;
      const eventType = overrides.eventType !== undefined
        ? overrides.eventType
        : (selectedRowContext.eventType || mainSelectedEventType || 'All');

      try {
        const res = await fetchIncidentReportDetails({
          Date: targetDate,
          StoreCode: targetStore,
          PageNumber: 1,
          PageSize: 10000,
          EventType: eventType !== 'All' ? eventType : undefined,
        });

        if (res && res.records) {
          setModalReportData(res);
          setModalCurrentPage(1);
        }
      } catch (error) {
        console.error('Failed to load incident report details for modal:', error);
      } finally {
        setModalLoading(false);
      }
    },
    [selectedRowContext, mainSelectedEventType]
  );

  // Trigger modal fetch whenever row context changes
  useEffect(() => {
    if (modalOpen && selectedRowContext) {
      loadModalReport();
    }
  }, [modalOpen, selectedRowContext, loadModalReport]);

  // -------------------------------------------------------------
  // 7. Modal Open & Close Handlers
  // -------------------------------------------------------------
  const handleOpenModal = (row, clickedField = 'articleCount') => {
    const activeEventType = row.eventType || mainSelectedEventType || 'All';
    setSelectedRowContext({
      date: row.date,
      storeCode: row.storeCode,
      storeName: row.storeName,
      articleCount: row.articleCount,
      qty: row.qty,
      amount: row.amount,
      eventType: activeEventType,
      clickedField,
    });
    setModalSearchQuery('');
    setModalCurrentPage(1);
    setModalRowsPerPage(10);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRowContext(null);
    setModalSearchQuery('');
    setModalCurrentPage(1);
    setModalReportData({
      records: [],
      totalRecords: 0,
      totalAll: 0,
      totalTheft: 0,
      totalLoss: 0,
      totalUntagged: 0,
      totalCheckout: 0,
      totalTags: 0,
      potentialLoss: '₹0',
      pageSize: 10,
      pageNumber: 1,
      totalPages: 1,
    });
  };

  // -------------------------------------------------------------
  // 8. Filter Handlers
  // -------------------------------------------------------------
  const handleDateChange = (label, rangeInfo) => {
    let from = '';
    let to = '';
    if (rangeInfo?.startDate && rangeInfo?.endDate) {
      from = formatApiDate(rangeInfo.startDate);
      to = formatApiDate(rangeInfo.endDate);
    } else {
      const today = new Date();
      if (label === 'Today') {
        from = formatApiDate(today);
        to = formatApiDate(today);
      } else if (label === 'Yesterday') {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        from = formatApiDate(y);
        to = formatApiDate(y);
      } else if (label === 'Last 7 Days') {
        const d7 = new Date(today);
        d7.setDate(today.getDate() - 6);
        from = formatApiDate(d7);
        to = formatApiDate(today);
      } else if (label === 'This Month') {
        const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
        from = formatApiDate(mStart);
        to = formatApiDate(today);
      } else if (label === 'Last 30 Days') {
        const d30 = new Date(today);
        d30.setDate(today.getDate() - 29);
        from = formatApiDate(d30);
        to = formatApiDate(today);
      }
    }
    setDateRange({ label, fromDate: from, toDate: to });
    setMainCurrentPage(1);
    loadMainReport({ fromDate: from, toDate: to, page: 1 });
  };

  const handleStoreChange = (storeObj) => {
    const storeCode = typeof storeObj === 'object' ? storeObj.storeCode : storeObj;
    setSelectedStore(storeCode || '');
    setMainCurrentPage(1);
    loadMainReport({ store: storeCode, page: 1 });
  };

  // Main table search & pagination
  const handleMainSearchChange = (e) => {
    setMainSearchQuery(e.target.value);
    setMainCurrentPage(1);
  };

  const handleMainRowsPerPageChange = (newVal) => {
    setMainRowsPerPage(newVal);
    setMainCurrentPage(1);
    setMainRowsDropdownOpen(false);
    loadMainReport({ pageSize: newVal, page: 1 });
  };

  const handleMainPageChange = (newPage) => {
    setMainCurrentPage(newPage);
    loadMainReport({ page: newPage });
  };

  // Modal table search, event type & pagination
  const handleModalSearchChange = (e) => {
    setModalSearchQuery(e.target.value);
    setModalCurrentPage(1);
  };

  const handleModalRowsPerPageChange = (newVal) => {
    setModalRowsPerPage(newVal);
    setModalCurrentPage(1);
    setModalRowsDropdownOpen(false);
  };

  const handleModalPageChange = (newPage) => {
    setModalCurrentPage(newPage);
  };

  // -------------------------------------------------------------
  // 9. Client-Side Filtered Data for Search
  // -------------------------------------------------------------
  // Main summary table filtered data
  const filteredMainData = useMemo(() => {
    let result = mainReportData.records || [];

    // Client-side event type safety filter when mainSelectedEventType is set
    if (mainSelectedEventType === 'Loss' || mainSelectedEventType === 'Theft') {
      result = result.filter((item) => item.eventType === 'Loss' || item.eventType === 'Theft');
    } else if (mainSelectedEventType === 'Checkout' || mainSelectedEventType === 'Untagged') {
      result = result.filter((item) => item.eventType === 'Checkout' || item.eventType === 'Untagged');
    }

    if (mainSearchQuery.trim()) {
      const q = mainSearchQuery.trim().toLowerCase();
      result = result.filter((item) => {
        return (
          item.date?.toLowerCase().includes(q) ||
          item.storeCode?.toLowerCase().includes(q) ||
          item.storeName?.toLowerCase().includes(q) ||
          item.eventType?.toLowerCase().includes(q) ||
          String(item.articleCount ?? '').toLowerCase().includes(q) ||
          String(item.qty ?? '').includes(q) ||
          String(item.amount ?? '').includes(q) ||
          String(item.amountDisplay ?? '').toLowerCase().includes(q) ||
          String(item.srNo ?? '').includes(q)
        );
      });
    }
    return result;
  }, [mainReportData.records, mainSelectedEventType, mainSearchQuery]);

  // Modal detailed table filtered data across ALL columns
  const filteredModalData = useMemo(() => {
    let result = modalReportData.records || [];
    const eventType = selectedRowContext?.eventType;

    // Safety filter to match event type passed from main table if not 'All'
    if (eventType === 'Loss' || eventType === 'Theft') {
      result = result.filter((item) => item.eventType === 'Loss' || item.eventType === 'Theft');
    } else if (eventType === 'Checkout' || eventType === 'Untagged') {
      result = result.filter((item) => item.eventType === 'Checkout' || item.eventType === 'Untagged');
    }

    // Comprehensive Search across ALL columns (Article No, Description, Time, Date, Store, Qty, MRP, Amount, Event Type)
    if (modalSearchQuery.trim()) {
      const q = modalSearchQuery.trim().toLowerCase();
      result = result.filter((item) => {
        const srNoStr = String(item.srNo ?? '').toLowerCase();
        const dateStr = String(item.date ?? '').toLowerCase();
        const timeStr = String(item.time ?? '').toLowerCase();
        const storeCodeStr = String(item.storeCode ?? '').toLowerCase();
        const storeNameStr = String(item.storeName ?? '').toLowerCase();
        const articleNoStr = String(item.articleNo ?? '').toLowerCase();
        const descStr = String(item.articleDescription ?? '').toLowerCase();
        const qtyStr = String(item.qty ?? '').toLowerCase();
        const mrpStr = String(item.mrp ?? '').toLowerCase();
        const mrpDisplayStr = String(item.mrpDisplay ?? '').toLowerCase();
        const amountStr = String(item.amount ?? '').toLowerCase();
        const amountDisplayStr = String(item.amountDisplay ?? '').toLowerCase();
        const eventTypeStr = String(item.eventType ?? '').toLowerCase();
        const epcStr = String(item.epc ?? '').toLowerCase();

        return (
          srNoStr.includes(q) ||
          dateStr.includes(q) ||
          timeStr.includes(q) ||
          storeCodeStr.includes(q) ||
          storeNameStr.includes(q) ||
          articleNoStr.includes(q) ||
          descStr.includes(q) ||
          qtyStr.includes(q) ||
          mrpStr.includes(q) ||
          mrpDisplayStr.includes(q) ||
          amountStr.includes(q) ||
          amountDisplayStr.includes(q) ||
          eventTypeStr.includes(q) ||
          epcStr.includes(q)
        );
      });
    }

    return result;
  }, [modalReportData.records, selectedRowContext?.eventType, modalSearchQuery]);

  const printStoreLabel = useMemo(() => {
    if (printType === 'modal') {
      const code = selectedRowContext?.storeCode || filteredModalData[0]?.storeCode || 'HD44';
      const name = selectedRowContext?.storeName || filteredModalData[0]?.storeName || 'UTTAM NAGAR';
      return `${code} - ${name}`;
    }

    if (selectedStore && selectedStore !== 'all') {
      const match = mainReportData.records?.find((r) => r.storeCode === selectedStore);
      const name = match?.storeName || 'UTTAM NAGAR';
      return `${selectedStore} - ${name}`;
    }

    const firstRec = filteredMainData[0] || mainReportData.records?.[0];
    if (firstRec?.storeCode) {
      const name = firstRec.storeName || 'UTTAM NAGAR';
      return `${firstRec.storeCode} - ${name}`;
    }

    return 'HD44 - UTTAM NAGAR';
  }, [printType, selectedRowContext, selectedStore, filteredModalData, filteredMainData, mainReportData.records]);

  // -------------------------------------------------------------
  // 10. Columns Definition: Main Summary Table
  // -------------------------------------------------------------
  const mainColumns = useMemo(
    () => [
      {
        id: 'srNo',
        name: 'Sr No',
        selector: (row) => row.srNo,
        sortable: true,
        width: '6%',
        minWidth: '60px',
        center: true,
        cell: (row) => <span className="font-semibold text-slate-800 text-[11px]">{row.srNo}</span>,
      },
      {
        id: 'date',
        name: 'Date',
        selector: (row) => row.date,
        sortFunction: (a, b) => {
          const parseDate = (d) => {
            if (!d) return 0;
            const parts = d.split('-');
            if (parts.length === 3 && parts[0].length <= 2) {
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime() || 0;
            }
            return new Date(d).getTime() || 0;
          };
          return parseDate(a.date) - parseDate(b.date);
        },
        sortable: true,
        width: '14%',
        minWidth: '120px',
        cell: (row) => (
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-[#00a8e7] shrink-0" />
            <span>{row.date}</span>
          </div>
        ),
      },
      {
        id: 'storeCode',
        name: 'Store Code',
        selector: (row) => row.storeCode,
        sortable: true,
        width: '11%',
        minWidth: '95px',
        center: true,
        cell: (row) => (
          <span className="inline-flex items-center text-[10.5px] font-bold text-[#007ba8] bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded tracking-wide">
            {row.storeCode}
          </span>
        ),
      },
      {
        id: 'storeName',
        name: 'Store Name',
        selector: (row) => row.storeName,
        sortable: true,
        width: '18%',
        minWidth: '140px',
        cell: (row) => (
          <span className="font-semibold text-slate-800 text-[11px] truncate block" title={row.storeName}>
            {row.storeName}
          </span>
        ),
      },
      {
        id: 'articleCount',
        name: 'Article Count',
        selector: (row) => (row.articleCount === 'N/A' || row.articleCount === 'NA' ? -1 : (Number(row.articleCount) || 0)),
        sortable: true,
        width: '13%',
        minWidth: '115px',
        center: true,
        cell: (row) => {
          if (row.articleCount === 'N/A' || row.articleCount === 'NA') {
            return (
              <span className="font-semibold text-slate-400 text-xs px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200/80">
                N/A
              </span>
            );
          }
          return (
            <button
              type="button"
              onClick={() => handleOpenModal(row, 'articleCount')}
              className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-50 text-[#007ba8] hover:bg-[#00a8e7] hover:text-white border border-sky-200/90 font-bold text-xs transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:border-[#00a8e7] active:scale-95"
              title={`View detailed records for ${row.date} (${row.articleCount} articles)`}
            >
              <span>{row.articleCount}</span>
              <ExternalLink className="w-3 h-3 text-[#00a8e7] group-hover:text-white transition-colors" />
            </button>
          );
        },
      },
      {
        id: 'qty',
        name: 'Qty',
        selector: (row) => Number(row.qty) || 0,
        sortable: true,
        width: '11%',
        minWidth: '90px',
        center: true,
        cell: (row) => (
          <button
            type="button"
            onClick={() => handleOpenModal(row, 'qty')}
            className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200/90 font-bold text-xs transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:border-emerald-600 active:scale-95"
            title={`View detailed records for ${row.date} (${row.qty} items)`}
          >
            <span>{row.qty}</span>
            <ExternalLink className="w-3 h-3 text-emerald-600 group-hover:text-white transition-colors" />
          </button>
        ),
      },
      {
        id: 'amount',
        name: 'Amount',
        selector: (row) => (row.amount === 'N/A' || row.amountDisplay === 'N/A' ? -1 : (Number(row.amount) || 0)),
        sortable: true,
        width: '13%',
        minWidth: '110px',
        right: true,
        cell: (row) => {
          if (row.amount === 'N/A' || row.amountDisplay === 'N/A') {
            return (
              <span className="font-semibold text-slate-400 text-xs px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200/80">
                N/A
              </span>
            );
          }
          return (
            <span className="font-bold text-slate-800 text-[11px] tabular-nums">
              {row.amountDisplay || formatCurrency(row.amount)}
            </span>
          );
        },
      },
      {
        id: 'eventType',
        name: 'Event Type',
        selector: (row) => row.eventType,
        sortable: true,
        width: '14%',
        minWidth: '115px',
        center: true,
        cell: (row) => {
          const isCheckout = row.eventType === 'Checkout' || row.eventType === 'Untagged';
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wide border shadow-2xs ${isCheckout
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
            >
              {isCheckout ? (
                <TagX className="w-3 h-3 text-sky-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
              )}
              {row.eventType || (isCheckout ? 'Checkout' : 'Loss')}
            </span>
          );
        },
      },
    ],
    []
  );

  // -------------------------------------------------------------
  // 11. Columns Definition: Detailed Table Inside Modal
  // -------------------------------------------------------------
  const modalColumns = useMemo(
    () => [
      {
        id: 'srNo',
        name: 'Sr No',
        selector: (row) => row.srNo,
        sortable: true,
        width: '70px',
        center: true,
        cell: (row) => <span className="font-semibold text-slate-800 text-[11px]">{row.srNo}</span>,
      },
      {
        id: 'date',
        name: 'Date',
        selector: (row) => row.date,
        sortable: true,
        width: '105px',
        cell: (row) => <span className="font-semibold text-slate-800 text-[11px]">{row.date}</span>,
      },
      {
        id: 'time',
        name: 'Time',
        selector: (row) => row.time,
        sortable: true,
        width: '95px',
        center: true,
        cell: (row) => (
          <span className="font-mono text-slate-700 text-[11px] font-semibold">{row.time || '—'}</span>
        ),
      },
      {
        id: 'storeCode',
        name: 'Store Code',
        selector: (row) => row.storeCode,
        sortable: true,
        width: '95px',
        center: true,
        cell: (row) => (
          <span className="font-semibold text-slate-800 text-[11px]">{row.storeCode}</span>
        ),
      },
      {
        id: 'storeName',
        name: 'Store Name',
        selector: (row) => row.storeName,
        sortable: true,
        width: '130px',
        cell: (row) => (
          <span className="font-semibold text-slate-800 text-[11px] truncate block" title={row.storeName}>
            {row.storeName}
          </span>
        ),
      },
      {
        id: 'articleNo',
        name: 'Article No',
        selector: (row) => row.articleNo,
        sortable: true,
        width: '120px',
        cell: (row) => (
          <span className="font-mono text-slate-800 text-[11px] font-semibold">{row.articleNo}</span>
        ),
      },
      {
        id: 'articleDescription',
        name: 'Article Description',
        selector: (row) => row.articleDescription,
        sortable: true,
        minWidth: '200px',
        wrap: true,
        cell: (row) => (
          <span className="font-semibold text-slate-800 text-[11px] line-clamp-2" title={row.articleDescription}>
            {row.articleDescription}
          </span>
        ),
      },
      {
        id: 'qty',
        name: 'Qty',
        selector: (row) => row.qty,
        sortable: true,
        width: '65px',
        center: true,
        cell: (row) => (
          <span className="font-semibold text-slate-800 text-[11px]">{row.qty}</span>
        ),
      },
      {
        id: 'mrp',
        name: 'MRP',
        selector: (row) => row.mrp ?? 0,
        sortable: true,
        width: '100px',
        right: true,
        cell: (row) => (
          <span className="font-semibold text-slate-700 text-[11px] tabular-nums">
            {formatCurrency(row.mrp)}
          </span>
        ),
      },
      {
        id: 'amount',
        name: 'Amount',
        selector: (row) => row.amount ?? 0,
        sortable: true,
        width: '105px',
        right: true,
        cell: (row) => (
          <span className="font-bold text-slate-800 text-[11px] tabular-nums">
            {formatCurrency(row.amount)}
          </span>
        ),
      },
      {
        id: 'eventType',
        name: 'Event Type',
        selector: (row) => row.eventType,
        sortable: true,
        width: '125px',
        center: true,
        cell: (row) => {
          const isLoss = row.eventType === 'Loss' || row.eventType === 'Theft';
          const displayEventType = isLoss
            ? 'Loss'
            : row.eventType === 'Checkout' || row.eventType === 'Untagged'
              ? 'Checkout'
              : row.eventType;
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl border border-slate-300 text-[11px] font-semibold text-slate-800 transition-colors ${isLoss ? 'bg-rose-50' : 'bg-sky-50'
                }`}
            >
              {isLoss ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 stroke-[2.2]" />
              ) : (
                <TagX className="w-3.5 h-3.5 text-[#00a8e7] shrink-0 stroke-[2.2]" />
              )}
              {displayEventType}
            </span>
          );
        },
      },
    ],
    []
  );

  // -------------------------------------------------------------
  // 12. Main Summary Table Export Handlers
  // -------------------------------------------------------------
  const exportMainToExcel = async () => {
    setMainExportMenuOpen(false);

    if (!filteredMainData || filteredMainData.length === 0) {
      setSweetAlert({
        title: 'No Records Found',
        message: 'No summary records available to export to Excel.',
        type: 'warning',
      });
      return;
    }

    setIsMainExporting(true);
    setMainExportProgress(50);

    try {
      let dataToExport = filteredMainData;

      // If total records on server exceeds currently loaded page, fetch all records
      if ((mainReportData.totalRecords || 0) > mainReportData.records.length) {
        const store = selectedStore;
        const fromDate = dateRange.fromDate;
        const toDate = dateRange.toDate;
        const preset = dateRange.label ? dateRange.label.replace(/\s+/g, '') : undefined;
        const eventType = mainSelectedEventType;

        const fullRes = await fetchIncidentReportSummary({
          Preset: preset,
          StoreCode: store,
          FromDate: fromDate || undefined,
          ToDate: toDate || undefined,
          EventType: eventType !== 'All' ? eventType : undefined,
          PageNumber: 1,
          PageSize: 10000,
          Search: mainSearchQuery.trim() || undefined,
        });

        if (fullRes?.records && fullRes.records.length > 0) {
          dataToExport = fullRes.records;
          if (mainSelectedEventType === 'Loss' || mainSelectedEventType === 'Theft') {
            dataToExport = dataToExport.filter((item) => item.eventType === 'Loss' || item.eventType === 'Theft');
          } else if (mainSelectedEventType === 'Checkout' || mainSelectedEventType === 'Untagged') {
            dataToExport = dataToExport.filter((item) => item.eventType === 'Checkout' || item.eventType === 'Untagged');
          }
          if (mainSearchQuery.trim()) {
            const q = mainSearchQuery.trim().toLowerCase();
            dataToExport = dataToExport.filter((item) => {
              return (
                item.date?.toLowerCase().includes(q) ||
                item.storeCode?.toLowerCase().includes(q) ||
                item.storeName?.toLowerCase().includes(q) ||
                item.eventType?.toLowerCase().includes(q) ||
                String(item.articleCount ?? '').toLowerCase().includes(q) ||
                String(item.qty ?? '').includes(q) ||
                String(item.amount ?? '').includes(q) ||
                String(item.amountDisplay ?? '').toLowerCase().includes(q) ||
                String(item.srNo ?? '').includes(q)
              );
            });
          }
        }
      }

      setMainExportProgress(100);

      const exportData = dataToExport.map((item, idx) => ({
        'Sr No': idx + 1,
        'Date': item.date,
        'Store Code': item.storeCode,
        'Store Name': item.storeName,
        'Article Count': item.articleCount,
        'Qty': item.qty,
        'Amount (INR)': item.amount,
        'Event Type': item.eventType || 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 14 },
        { wch: 12 },
        { wch: 22 },
        { wch: 14 },
        { wch: 10 },
        { wch: 16 },
        { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary Report');

      let dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      if (dateRange.fromDate && dateRange.toDate) {
        const fromFormatted = dateRange.fromDate.replace(/-/g, '_');
        const toFormatted = dateRange.toDate.replace(/-/g, '_');
        dateStr = fromFormatted === toFormatted ? fromFormatted : `${fromFormatted}_to_${toFormatted}`;
      }
      const typeSlug = mainSelectedEventType || 'All';
      XLSX.writeFile(workbook, `Main_Summary_Report_${typeSlug}_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Failed to export main summary to Excel:', err);
    } finally {
      setIsMainExporting(false);
      setMainExportProgress(0);
    }
  };

  const handleMainPrint = async () => {
    setMainExportMenuOpen(false);
    if (!filteredMainData || filteredMainData.length === 0) {
      setSweetAlert({
        title: 'No Records Found',
        message: 'No records available to print or save to PDF.',
        type: 'warning',
      });
      return;
    }
    setPrintType('main');
    setIsPrinting(true);

    try {
      let recordsToPrint = filteredMainData;

      // If server has more records than currently loaded page, fetch all records for printing
      if ((mainReportData.totalRecords || 0) > mainReportData.records.length) {
        const store = selectedStore;
        const fromDate = dateRange.fromDate;
        const toDate = dateRange.toDate;
        const preset = dateRange.label ? dateRange.label.replace(/\s+/g, '') : undefined;
        const eventType = mainSelectedEventType;

        const fullRes = await fetchIncidentReportSummary({
          Preset: preset,
          StoreCode: store,
          FromDate: fromDate || undefined,
          ToDate: toDate || undefined,
          EventType: eventType !== 'All' ? eventType : undefined,
          PageNumber: 1,
          PageSize: 10000,
          Search: mainSearchQuery.trim() || undefined,
        });

        if (fullRes?.records && fullRes.records.length > 0) {
          recordsToPrint = fullRes.records;
          if (mainSelectedEventType === 'Loss' || mainSelectedEventType === 'Theft') {
            recordsToPrint = recordsToPrint.filter((item) => item.eventType === 'Loss' || item.eventType === 'Theft');
          } else if (mainSelectedEventType === 'Checkout' || mainSelectedEventType === 'Untagged') {
            recordsToPrint = recordsToPrint.filter((item) => item.eventType === 'Checkout' || item.eventType === 'Untagged');
          }
          if (mainSearchQuery.trim()) {
            const q = mainSearchQuery.trim().toLowerCase();
            recordsToPrint = recordsToPrint.filter((item) => {
              return (
                item.date?.toLowerCase().includes(q) ||
                item.storeCode?.toLowerCase().includes(q) ||
                item.storeName?.toLowerCase().includes(q) ||
                item.eventType?.toLowerCase().includes(q) ||
                String(item.articleCount ?? '').toLowerCase().includes(q) ||
                String(item.qty ?? '').includes(q) ||
                String(item.amount ?? '').includes(q) ||
                String(item.amountDisplay ?? '').toLowerCase().includes(q) ||
                String(item.srNo ?? '').includes(q)
              );
            });
          }
        }
      }

      setPrintRecords(recordsToPrint);
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 350);
    } catch (err) {
      console.error('Failed to prepare main print records:', err);
      setPrintRecords(filteredMainData);
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 250);
    }
  };

  // -------------------------------------------------------------
  // 13. Modal Detailed Table Export Handlers
  // -------------------------------------------------------------
  const exportModalToExcel = async () => {
    setModalExportMenuOpen(false);

    if (!filteredModalData || filteredModalData.length === 0) {
      setSweetAlert({
        title: 'No Records Found',
        message: 'No detailed records available to export for this date and store.',
        type: 'warning',
      });
      return;
    }

    setIsModalExporting(true);
    setModalExportProgress(50);

    try {
      let dataToExport = filteredModalData;

      // If total records on server exceeds currently loaded page, fetch all records
      if ((modalReportData.totalRecords || 0) > modalReportData.records.length) {
        const fullRes = await fetchIncidentReportDetails({
          Date: selectedRowContext?.date,
          StoreCode: selectedRowContext?.storeCode,
          EventType: selectedRowContext?.eventType !== 'All' ? selectedRowContext?.eventType : undefined,
          PageNumber: 1,
          PageSize: 10000,
          Search: modalSearchQuery.trim() || undefined,
        });

        if (fullRes?.records && fullRes.records.length > 0) {
          dataToExport = fullRes.records;
          if (modalSearchQuery.trim()) {
            const q = modalSearchQuery.trim().toLowerCase();
            dataToExport = dataToExport.filter((item) => {
              return (
                item.epc?.toLowerCase().includes(q) ||
                item.articleNo?.toLowerCase().includes(q) ||
                item.articleDescription?.toLowerCase().includes(q) ||
                item.storeCode?.toLowerCase().includes(q) ||
                item.storeName?.toLowerCase().includes(q) ||
                item.time?.toLowerCase().includes(q) ||
                item.date?.toLowerCase().includes(q) ||
                item.eventType?.toLowerCase().includes(q) ||
                String(item.mrp ?? '').includes(q) ||
                String(item.amount ?? '').includes(q) ||
                String(item.srNo ?? '').includes(q)
              );
            });
          }
        }
      }

      setModalExportProgress(100);

      const exportData = dataToExport.map((item, idx) => ({
        'Sr No': idx + 1,
        'Date': item.date,
        'Time': item.time || '',
        'Store Code': item.storeCode,
        'Store Name': item.storeName,
        //'EPC Code': item.epc,
        'Article No': item.articleNo,
        'Article Description': item.articleDescription,
        'Qty': item.qty,
        'MRP (INR)': item.mrp,
        'Amount (INR)': item.amount,
        'Event Type':
          item.eventType === 'Theft' || item.eventType === 'Loss'
            ? 'Loss'
            : item.eventType === 'Untagged' || item.eventType === 'Checkout'
              ? 'Checkout'
              : item.eventType,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 18 },
        { wch: 28 },
        { wch: 14 },
        { wch: 32 },
        { wch: 8 },
        { wch: 12 },
        { wch: 14 },
        { wch: 12 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Detailed Incident Report');

      const dateSlug = (selectedRowContext?.date || 'Detail').replace(/[^a-zA-Z0-9]/g, '_');
      const storeSlug = (selectedRowContext?.storeCode || 'Store').replace(/[^a-zA-Z0-9]/g, '_');
      const typeSlug = selectedRowContext?.eventType || 'All';

      XLSX.writeFile(workbook, `Detailed_Report_${storeSlug}_${dateSlug}_${typeSlug}.xlsx`);
    } catch (err) {
      console.error('Failed to export modal detailed records to Excel:', err);
    } finally {
      setIsModalExporting(false);
      setModalExportProgress(0);
    }
  };

  const handleModalPrint = async () => {
    setModalExportMenuOpen(false);
    if (!filteredModalData || filteredModalData.length === 0) {
      setSweetAlert({
        title: 'No Records Found',
        message: 'No detailed records available to print or save to PDF.',
        type: 'warning',
      });
      return;
    }

    setPrintType('modal');
    setIsPrinting(true);

    try {
      let recordsToPrint = filteredModalData;

      // If server has more records than currently loaded page, fetch all records for printing
      if ((modalReportData.totalRecords || 0) > modalReportData.records.length) {
        const fullRes = await fetchIncidentReportDetails({
          Date: selectedRowContext?.date,
          StoreCode: selectedRowContext?.storeCode,
          EventType: selectedRowContext?.eventType !== 'All' ? selectedRowContext?.eventType : undefined,
          PageNumber: 1,
          PageSize: 10000,
          Search: modalSearchQuery.trim() || undefined,
        });

        if (fullRes?.records && fullRes.records.length > 0) {
          recordsToPrint = fullRes.records;
          if (modalSearchQuery.trim()) {
            const q = modalSearchQuery.trim().toLowerCase();
            recordsToPrint = recordsToPrint.filter((item) => {
              return (
                item.epc?.toLowerCase().includes(q) ||
                item.articleNo?.toLowerCase().includes(q) ||
                item.articleDescription?.toLowerCase().includes(q) ||
                item.storeCode?.toLowerCase().includes(q) ||
                item.storeName?.toLowerCase().includes(q) ||
                item.time?.toLowerCase().includes(q) ||
                item.date?.toLowerCase().includes(q) ||
                item.eventType?.toLowerCase().includes(q) ||
                String(item.mrp ?? '').includes(q) ||
                String(item.amount ?? '').includes(q) ||
                String(item.srNo ?? '').includes(q)
              );
            });
          }
        }
      }

      setPrintRecords(recordsToPrint);

      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 350);
    } catch (err) {
      console.error('Failed to prepare modal print records:', err);
      setPrintRecords(filteredModalData);
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 250);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header with Store & Date Range Filters (Hidden on Print) */}
      <PageHeader title="Reports" className="no-print">
        <SelectedStore onStoreChange={handleStoreChange} />
        <DateFilter selectedDate={dateRange.label} onDateChange={handleDateChange} />
      </PageHeader>

      {/* 2. Key Metrics Stat Cards (Hidden on Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <StatCard
          title="Total Tags"
          count={(mainReportData.totalTags ?? mainReportData.totalAll ?? 0).toLocaleString('en-IN')}
          icon={Tag}
          variant="green"
          loading={initialLoading}
          shimmer={mainLoading}
        />
        <StatCard
          title="Checkout"
          count={(mainReportData.checkout ?? mainReportData.totalCheckout ?? 0).toLocaleString('en-IN')}
          icon={TagX}
          variant="blue"
          loading={initialLoading}
          shimmer={mainLoading}
        />
        <StatCard
          title="Theft Alerts"
          count={(mainReportData.loss ?? mainReportData.totalLoss ?? 0).toLocaleString('en-IN')}
          icon={AlertTriangle}
          variant="gray"
          loading={initialLoading}
          shimmer={mainLoading}
        />
        <StatCard
          title="Revenue Loss"
          count={formatCurrency(mainReportData.potentialLoss)}
          icon={TrendingDown}
          variant="rose"
          loading={initialLoading}
          shimmer={mainLoading}
        />
      </div>

      {/* 3. Main Summary Table Container (Screen View + Printable Area) */}
      <div id="printable-report-area">
        {/* Print-Only Formal Header */}
        <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Loss Prevention & Goods Security
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                {printType === 'modal' ? 'Detailed Incident Report' : 'Consolidated Date-Wise Summary Report'}
              </p>
              {printType === 'modal' && selectedRowContext?.date && (
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Date: <span className="font-semibold text-slate-700">{selectedRowContext.date}</span>
                  {selectedRowContext.eventType && (
                    <>
                      {' '}• Event: <span className="font-semibold text-slate-700">{selectedRowContext.eventType}</span>
                    </>
                  )}
                </p>
              )}
            </div>
            <div className="text-right text-xs text-slate-600 space-y-0.5">
              <p>
                <span className="font-semibold text-slate-800">Generated:</span>{' '}
                {new Date().toLocaleDateString('en-GB')}{' '}
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Store:</span>{' '}
                {printStoreLabel}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Total Records:</span>{' '}
                {(printRecords || (printType === 'modal' ? filteredModalData : filteredMainData)).length} rows
              </p>
            </div>
          </div>
        </div>

        {/* Screen Interactive Main Summary Table (Hidden during Print) */}
        <div className="print:hidden">
          <DataTable
            columns={mainColumns}
            data={filteredMainData}
            keyField="id"
            pagination
            paginationServer={true}
            paginationTotalRows={mainReportData.totalRecords || filteredMainData.length}
            paginationDefaultPage={mainCurrentPage}
            paginationPerPage={mainRowsPerPage === 'All' ? 100000 : Number(mainRowsPerPage)}
            paginationRowsPerPageOptions={[10, 20, 50, 100, 'All']}
            onChangeRowsPerPage={handleMainRowsPerPageChange}
            onChangePage={handleMainPageChange}
            selectableRows={false}
            highlightOnHover
            pointerOnHover={false}
            progressPending={mainLoading}
            subHeader
            subHeaderComponent={
              <div className="p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left: Search Bar & Rows Dropdown Pill */}
                <div className="flex items-center gap-3 flex-1 flex-wrap sm:flex-nowrap">
                  <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by Date, Store Code, Store Name..."
                      value={mainSearchQuery}
                      onChange={handleMainSearchChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          loadMainReport({ search: mainSearchQuery, page: 1 });
                        }
                      }}
                      className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#00a8e7] focus:ring-2 focus:ring-[#00a8e7]/15 transition-all text-slate-900 placeholder-slate-400 font-medium"
                    />
                    {mainSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setMainSearchQuery('');
                          setMainCurrentPage(1);
                          loadMainReport({ search: '', page: 1 });
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                        title="Clear Search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Rows Per Page Dropdown */}
                  <div className="flex items-center gap-2 shrink-0" ref={mainRowsDropdownRef}>
                    <span className="text-xs sm:text-sm text-slate-500 font-medium">Rows:</span>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setMainRowsDropdownOpen((prev) => !prev)}
                        className="h-7.5 px-3 bg-white border border-slate-300 hover:border-slate-300 rounded-xl outline-none flex items-center justify-between gap-2.5 text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer min-w-[76px]"
                        aria-haspopup="listbox"
                        aria-expanded={mainRowsDropdownOpen}
                      >
                        <span className="truncate">{mainRowsPerPage}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${mainRowsDropdownOpen ? 'rotate-180 text-[#00a8e7]' : ''
                            }`}
                        />
                      </button>

                      {mainRowsDropdownOpen && (
                        <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-28 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden py-1">
                          {ROW_OPTIONS.map((opt) => {
                            const isSelected = mainRowsPerPage === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => handleMainRowsPerPageChange(opt.value)}
                                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${isSelected
                                  ? 'bg-[#00a8e7]/10 text-[#00a8e7] font-bold'
                                  : 'text-slate-700 hover:bg-slate-50 font-medium'
                                  }`}
                              >
                                <span>{opt.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#00a8e7] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Event Type Filter Tabs & Export Split Button for Main Summary Table */}
                <div className="flex items-center gap-2.5 self-end lg:self-auto flex-wrap">
                  {/* Event Type Filter Tabs for Main Table */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => handleMainEventTypeChange('All')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${mainSelectedEventType === 'All'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      All ({mainReportData.totalAll})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMainEventTypeChange('Loss')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${mainSelectedEventType === 'Loss' || mainSelectedEventType === 'Theft'
                        ? 'bg-rose-500 text-white shadow-2xs shadow-rose-500/25'
                        : 'text-slate-600 hover:text-rose-600'
                        }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Loss ({mainReportData.totalLoss})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMainEventTypeChange('Checkout')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${mainSelectedEventType === 'Checkout' || mainSelectedEventType === 'Untagged'
                        ? 'bg-[#00a8e7] text-white shadow-2xs shadow-sky-500/25'
                        : 'text-slate-600 hover:text-[#00a8e7]'
                        }`}
                    >
                      <TagX className="w-3 h-3" />
                      Checkout ({mainReportData.totalCheckout})
                    </button>
                  </div>

                  <div className="relative inline-flex items-stretch h-9 rounded-xl shadow-xs overflow-visible">
                    <div className="inline-flex items-stretch h-full rounded-xl overflow-hidden bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs shadow-emerald-600/20">
                      {/* Main Action (Export to Excel) */}
                      <button
                        type="button"
                        onClick={exportMainToExcel}
                        disabled={isMainExporting}
                        className="relative h-full pl-3.5 pr-2.5 bg-transparent hover:bg-black/10 active:bg-black/20 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-90 overflow-hidden"
                        title="Download Main Summary Excel (.xlsx)"
                      >
                        <FileSpreadsheet className="w-4 h-4 shrink-0 relative z-10" />
                        <span className="whitespace-nowrap relative z-10">
                          {isMainExporting ? 'Exporting...' : 'Export to Excel'}
                        </span>
                      </button>

                      {/* Vertical Divider Line */}
                      <div className="w-[1px] bg-white/25 self-stretch my-1.5" />

                      {/* Dropdown Toggle Arrow */}
                      <button
                        type="button"
                        onClick={() => setMainExportMenuOpen(!mainExportMenuOpen)}
                        className="h-full px-2.5 bg-transparent hover:bg-black/10 active:bg-black/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="More export options"
                        aria-label="More export options"
                      >
                        <ChevronDown className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Dropdown Menu */}
                    {mainExportMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={exportMainToExcel}
                          disabled={isMainExporting}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-75"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Microsoft Excel (.xlsx)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleMainPrint}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-rose-600 shrink-0" />
                          <div className="flex flex-col">
                            <span>Save to PDF / Print</span>
                            <span className="text-[10px] text-slate-400 font-normal">Prints summary table</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            }
          />
        </div>

        {/* Print-Only Table (Prints whichever table user printed) */}
        <div className="hidden print:block w-full">
          {printType === 'main' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300 text-[10px] font-bold text-slate-800 uppercase">
                  <th className="py-2 px-2 text-center w-10">Sr</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2 text-center">Store Code</th>
                  <th className="py-2 px-2">Store Name</th>
                  <th className="py-2 px-2 text-center">Article Count</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2 text-center">Event Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[9.5px] font-semibold text-slate-800">
                {(printRecords || filteredMainData).map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-slate-200">
                    <td className="py-1.5 px-2 text-center">{idx + 1}</td>
                    <td className="py-1.5 px-2">{item.date}</td>
                    <td className="py-1.5 px-2 text-center">{item.storeCode}</td>
                    <td className="py-1.5 px-2">{item.storeName}</td>
                    <td className="py-1.5 px-2 text-center">{item.articleCount}</td>
                    <td className="py-1.5 px-2 text-center">{item.qty}</td>
                    <td className="py-1.5 px-2 text-right">
                      {item.amountDisplay || (item.amount === 'N/A' ? 'N/A' : formatCurrency(item.amount))}
                    </td>
                    <td className="py-1.5 px-2 text-center">{item.eventType || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300 text-[10px] font-bold text-slate-800 uppercase">
                  <th className="py-2 px-2 text-center w-8">Sr</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2 text-center">Time</th>
                  <th className="py-2 px-2 text-center">Store</th>
                  <th className="py-2 px-2">Article No</th>
                  <th className="py-2 px-2">Description</th>
                  <th className="py-2 px-2 text-center">Qty</th>
                  <th className="py-2 px-2 text-right">MRP</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2 text-center">Event Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[9px] font-semibold text-slate-800">
                {(printRecords || filteredModalData).map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-slate-200">
                    <td className="py-1.5 px-2 text-center">{idx + 1}</td>
                    <td className="py-1.5 px-2">{item.date}</td>
                    <td className="py-1.5 px-2 text-center">{item.time}</td>
                    <td className="py-1.5 px-2 text-center">{item.storeCode}</td>
                    <td className="py-1.5 px-2 font-mono">{item.articleNo}</td>
                    <td className="py-1.5 px-2">{item.articleDescription}</td>
                    <td className="py-1.5 px-2 text-center">{item.qty}</td>
                    <td className="py-1.5 px-2 text-right">{formatCurrency(item.mrp)}</td>
                    <td className="py-1.5 px-2 text-right">{formatCurrency(item.amount)}</td>
                    <td className="py-1.5 px-2 text-center">{item.eventType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MODAL POPUP: Detailed Incident Report for Selected Date & Store */}
      {/* ------------------------------------------------------------- */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 print:hidden overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-incident-title"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="p-2 bg-[#00a8e7]/10 text-[#00a8e7] rounded-xl border border-[#00a8e7]/20">
                  <Layers className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 id="modal-incident-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Detailed Incident Report
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium flex-wrap">
                    <span className="inline-flex items-center gap-1 text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold">
                      <Calendar className="w-3 h-3 text-[#00a8e7]" />
                      {selectedRowContext?.date}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold">
                      <Store className="w-3 h-3 text-[#00a8e7]" />
                      {selectedRowContext?.storeCode} - {selectedRowContext?.storeName}
                    </span>
                    <span className="text-slate-300">•</span>
                    {/* Highlighted Event Type Badge */}
                    {selectedRowContext?.eventType === 'Loss' || selectedRowContext?.eventType === 'Theft' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-300 text-rose-700 font-bold text-[11px] shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 stroke-[2.2]" />
                        Event: Loss
                      </span>
                    ) : selectedRowContext?.eventType === 'Checkout' || selectedRowContext?.eventType === 'Untagged' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-300 text-[#007ba8] font-bold text-[11px] shadow-2xs">
                        <TagX className="w-3.5 h-3.5 text-[#00a8e7] shrink-0 stroke-[2.2]" />
                        Event: Checkout
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-800 font-bold text-[11px] shadow-2xs">
                        <Layers className="w-3.5 h-3.5 text-slate-600 shrink-0 stroke-[2.2]" />
                        Event: All
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-bold text-[#00a8e7] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                      {modalReportData.totalRecords || filteredModalData.length} Incidents
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Table View */}
            <div className="flex-1 min-h-0 p-3 sm:p-4 flex flex-col overflow-hidden">
              <DataTable
                columns={modalColumns}
                data={filteredModalData}
                keyField="id"
                pagination
                paginationServer={false}
                paginationTotalRows={filteredModalData.length}
                paginationDefaultPage={modalCurrentPage}
                paginationPerPage={modalRowsPerPage === 'All' ? 100000 : Number(modalRowsPerPage)}
                paginationRowsPerPageOptions={[10, 20, 50, 100, 'All']}
                onChangeRowsPerPage={handleModalRowsPerPageChange}
                onChangePage={handleModalPageChange}
                selectableRows={false}
                highlightOnHover
                pointerOnHover={false}
                progressPending={modalLoading}
                fixedHeader
                dense
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
                subHeader
                subHeaderComponent={
                  <div className="p-2 sm:p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
                    {/* Left: Modal Search Bar & Rows Dropdown Pill */}
                    <div className="flex items-center gap-3 flex-1 flex-wrap sm:flex-nowrap">
                      <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search across all columns (Article, Description, Time, Date, Store, Qty, Amount...)"
                          value={modalSearchQuery}
                          onChange={handleModalSearchChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                            }
                          }}
                          className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-[#00a8e7] focus:ring-2 focus:ring-[#00a8e7]/15 transition-all text-slate-900 placeholder-slate-400 font-medium"
                        />
                        {modalSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalSearchQuery('');
                              setModalCurrentPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                            title="Clear Search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Modal Rows Per Page Dropdown */}
                      <div className="flex items-center gap-2 shrink-0" ref={modalRowsDropdownRef}>
                        <span className="text-xs sm:text-sm text-slate-500 font-medium">Rows:</span>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setModalRowsDropdownOpen((prev) => !prev)}
                            className="h-7.5 px-3 bg-white border border-slate-300 hover:border-slate-300 rounded-xl outline-none flex items-center justify-between gap-2.5 text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer min-w-[76px]"
                            aria-haspopup="listbox"
                            aria-expanded={modalRowsDropdownOpen}
                          >
                            <span className="truncate">{modalRowsPerPage}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${modalRowsDropdownOpen ? 'rotate-180 text-[#00a8e7]' : ''
                                }`}
                            />
                          </button>

                          {modalRowsDropdownOpen && (
                            <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-28 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden py-1">
                              {ROW_OPTIONS.map((opt) => {
                                const isSelected = modalRowsPerPage === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => handleModalRowsPerPageChange(opt.value)}
                                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${isSelected
                                      ? 'bg-[#00a8e7]/10 text-[#00a8e7] font-bold'
                                      : 'text-slate-700 hover:bg-slate-50 font-medium'
                                      }`}
                                  >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#00a8e7] shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Modal Export Button (Event type pill removed as already displayed in modal header) */}
                      {/* Modal Export Button */}
                      <div className="relative inline-flex items-stretch h-9 rounded-xl shadow-xs overflow-visible">
                        <div className="inline-flex items-stretch h-full rounded-xl overflow-hidden bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs shadow-emerald-600/20">
                          <button
                            type="button"
                            onClick={exportModalToExcel}
                            disabled={isModalExporting}
                            className="relative h-full pl-3.5 pr-2.5 bg-transparent hover:bg-black/10 active:bg-black/20 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-90 overflow-hidden"
                            title="Download Modal Excel (.xlsx)"
                          >
                            <FileSpreadsheet className="w-4 h-4 shrink-0 relative z-10" />
                            <span className="whitespace-nowrap relative z-10">
                              {isModalExporting ? 'Exporting...' : 'Export to Excel'}
                            </span>
                          </button>

                          <div className="w-[1px] bg-white/25 self-stretch my-1.5" />

                          <button
                            type="button"
                            onClick={() => setModalExportMenuOpen(!modalExportMenuOpen)}
                            className="h-full px-2.5 bg-transparent hover:bg-black/10 active:bg-black/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="More export options"
                            aria-label="More export options"
                          >
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                          </button>
                        </div>

                        {modalExportMenuOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={exportModalToExcel}
                              disabled={isModalExporting}
                              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-75"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Microsoft Excel (.xlsx)</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleModalPrint}
                              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Printer className="w-4 h-4 text-rose-600 shrink-0" />
                              <div className="flex flex-col">
                                <span>Save to PDF / Print</span>
                                <span className="text-[10px] text-slate-400 font-normal">Prints detailed records</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                  </div>
                }
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600 shrink-0">
              <span className="font-medium">
                Showing detail records for <strong className="text-slate-800">{selectedRowContext?.date}</strong> at store{' '}
                <strong className="text-slate-800">{selectedRowContext?.storeCode}</strong>
                {selectedRowContext?.eventType && selectedRowContext.eventType !== 'All' ? (
                  <>
                    {' '}• Event:{' '}
                    <strong className={selectedRowContext.eventType === 'Loss' ? 'text-rose-600' : 'text-[#00a8e7]'}>
                      {selectedRowContext.eventType}
                    </strong>
                  </>
                ) : null}
              </span>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SweetAlert Modal Dialog */}
      <SweetAlertModal
        isOpen={Boolean(sweetAlert)}
        onClose={() => setSweetAlert(null)}
        title={sweetAlert?.title}
        message={sweetAlert?.message}
        type={sweetAlert?.type || 'warning'}
        confirmText="OK"
      />
    </div>
  );
};

export default ReportsView;
