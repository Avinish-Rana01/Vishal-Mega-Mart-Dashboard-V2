import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaleDashboard } from '../../../hooks/useDashboardData';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import { motion } from 'framer-motion';
import DashboardDataGrid from '../../../components/charts/DashboardDataGrid';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import DashboardShimmer from '../../../components/common/DashboardShimmer';
import ChartToolbar from '../../../components/common/ChartToolbar';
import ChartSearchInput from '../../../components/common/ChartSearchInput';
import CustomDropdown from '../../../components/common/CustomDropdown';
import { SearchEmptyState, GlobalEmptyState } from '../../../components/common/ChartEmptyState';
import '../../../components/charts/DashboardSection.css';
import './common.css';
import './CycleCountSection.css'; // For cc-container, cc-kpi-row, cc-split-layout, etc.

// SVG Icons
const Icons = {
  Cart: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>,
  Tag: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
  Manual: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Star: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Alert: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
};

const SORT_OPTIONS = [
  { value: 'DPOS_DESC', label: 'Total Sales (High to Low)' },
  { value: 'DPOS_ASC', label: 'Total Sales (Low to High)' },
  { value: 'RFID_DESC', label: 'Highest RFID Checkout' },
  { value: 'RFID_ASC', label: 'Lowest RFID Checkout' },
  { value: 'TAFFETA_DESC', label: 'Highest Taffeta Sale' },
  { value: 'TAFFETA_ASC', label: 'Lowest Taffeta Sale' },
  { value: 'MANUAL_DESC', label: 'Highest Manual Sale' },
  { value: 'MANUAL_ASC', label: 'Lowest Manual Sale' }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', minWidth: '180px' }}>
        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px', fontSize: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{data.fullName || label}</span>
          {data.name && data.name !== data.fullName && (
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', marginLeft: '12px' }}>{data.name}</span>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
          <span style={{ color: '#64748b' }}>Total DPOS Sale:</span>
          <span style={{ fontWeight: 700, color: '#1e293b' }}>{data.DPOS?.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }}></div>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: entry.color }}>
            <span>{entry.name}:</span>
            <span style={{ fontWeight: 500 }}>{entry.value?.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SaleDashboardSection() {
  const { data, totals, isLoading, error } = useSaleDashboard();
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('DPOS_DESC');
  const [tableSort, setTableSort] = useState('DPOS_DESC');

  // Derived Metrics for Charts & Lists
  const { barData, tableData } = useMemo(() => {
    if (!data || !totals) return { barData: [], tableData: [] };

    const term = searchFilter.trim().toLowerCase();

    // Parse all numbers once without filtering (O(N))
    const parsedData = data.map(row => ({
      ...row, // Keep original data for table rendering
      _DPOS: Number(row.TOTAL_DPOS_SALE || 0),
      _RFID: Number(row.TOTAL_RFID_CHECKOUT || 0),
      _Taffeta: Number(row.TOTAL_TAFFETA_SALE || 0),
      _Manual: Number(row.TOTAL_MANUAL_SALE || 0)
    }));

    // Reusable fast sorting function
    const sortArray = (arr, sortType) => {
      return [...arr].sort((a, b) => {
        switch (sortType) {
          case 'DPOS_DESC': return b._DPOS - a._DPOS;
          case 'DPOS_ASC': return a._DPOS - b._DPOS;
          case 'RFID_DESC': return b._RFID - a._RFID;
          case 'RFID_ASC': return a._RFID - b._RFID;
          case 'TAFFETA_DESC': return b._Taffeta - a._Taffeta;
          case 'TAFFETA_ASC': return a._Taffeta - b._Taffeta;
          case 'MANUAL_DESC': return b._Manual - a._Manual;
          case 'MANUAL_ASC': return a._Manual - b._Manual;
          default: return 0;
        }
      });
    };

    // 1. Filter and Sort Data for Chart
    let chartDataUnsorted = parsedData;
    if (term) {
      chartDataUnsorted = parsedData.filter(row => {
        const storeCode = (row.STORE || '').toLowerCase();
        const storeName = (row.STORE_NAME || '').toLowerCase();
        return storeCode.includes(term) || storeName.includes(term);
      });
    }
    const chartSortedData = sortArray(chartDataUnsorted, sortBy);
    
    const barData = chartSortedData.map(row => ({
      name: row.STORE,
      fullName: row.STORE_NAME,
      DPOS: row._DPOS,
      RFID: row._RFID,
      Taffeta: row._Taffeta,
      Manual: row._Manual
    }));

    // 2. Sort Data for Table (completely unaffected by chart search)
    const tableData = sortArray(parsedData, tableSort);

    return { barData, tableData };
  }, [data, totals, searchFilter, sortBy, tableSort]);

  // Loading Skeleton
  if (isLoading) return <DashboardShimmer title="Sale Operations" />;

  if (error) return <div className="ds-error">{error}</div>;

  if (!data || data.length === 0) {
    return (
      <div className="cc-container">
        <SectionHeader title="Sale Operations" rightContent={<DateBadge />} />
        <GlobalEmptyState
          title="No Sales Data Available"
          subtitle="There is currently no sales data for today."
        />
      </div>
    );
  }



  return (
    <div className="cc-container">
      <SectionHeader title="Sale Operations" rightContent={<DateBadge />} />

      {/* 1. KPI Row */}
      <div className="cc-kpi-row">
        <KpiCard
          title="Total DPOS Sale"
          value={totals?.TOTAL_DPOS_SALE || '0'}
          badgeVariant="default"
          icon={<Icons.Cart />}
        />
        <KpiCard
          title="Total RFID Checkout"
          value={totals?.TOTAL_RFID_CHECKOUT || '0'}
          badgeVariant="info"
          icon={<Icons.Tag />}
        />
        <KpiCard
          title="Taffeta Sales"
          value={totals?.TOTAL_TAFFETA_SALE || '0'}
          badgeVariant="success"
          icon={<Icons.Star />}
        />
        <KpiCard
          title="Manual Sales"
          value={totals?.TOTAL_MANUAL_SALE || '0'}
          badgeVariant="warning"
          icon={<Icons.Manual />}
        />
        <KpiCard
          title="RFID Sales Share"
          value={totals?.RFID_SALES_SHARE || '0%'}
          badgeVariant="default"
          icon={<Icons.Tag />}
        />
      </div>

      {/* 2. Charts Row (Full Width Stacked Bar) */}
      <div className="cc-card">
        <ChartToolbar
          leftContent={
            <h3 className="cc-data-grid-title" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sales Breakdown <span className="hide-on-mobile">by Store</span>
            </h3>
          }
          rightContent={
            <>
              <CustomDropdown
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={setSortBy}
                buttonStyle={{ minWidth: 'auto', gap: '8px' }}
                menuStyle={{ left: 'auto', right: 0, minWidth: '200px' }}
              />
              <ChartSearchInput
                value={searchFilter}
                onChange={setSearchFilter}
                onClear={() => setSearchFilter('')}
                placeholder="Search Store..."
              />
            </>
          }
        />
        <div style={{ position: 'relative' }}>
          {barData.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '14px', margin: '4px 0 10px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Manual Sale</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Taffeta Sale</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>RFID Checkout</span>
              </div>
            </div>
          )}
          <div className="cc-chart-scroll">
            {barData.length === 0 ? (
              <SearchEmptyState searchFilter={searchFilter} onClearSearch={() => setSearchFilter('')} />
            ) : (
              <div style={{ minWidth: `max(100%, ${barData.length * 60}px)` }}>
                <GroupedBarChart
                  data={barData}
                  stacked={true}
                  customTooltip={<CustomTooltip />}
                  bars={[
                    { dataKey: 'RFID', color: '#10b981', label: 'RFID Checkout' },
                    { dataKey: 'Taffeta', color: '#8b5cf6', label: 'Taffeta Sale' },
                    { dataKey: 'Manual', color: '#f59e0b', label: 'Manual Sale' }
                  ]}
                  height={280}
                  hideLegend={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. NATIVE TABLE / DATA GRID */}
      <DashboardDataGrid
        title={
          <span>
            ALL STORES <span className="hide-on-mobile">DATA</span>
          </span>
        }
        subtitle={
          <span className="hide-on-mobile">
            {`${tableData.length} records`}
          </span>
        }
        headerAction={
          <CustomDropdown
            options={SORT_OPTIONS}
            value={tableSort}
            onChange={(val) => setTableSort(val)}
            prefix="Sort:"
            buttonStyle={{ minWidth: 'auto', gap: '8px' }}
            menuStyle={{ left: 'auto', right: 0, minWidth: '180px' }}
          />
        }
        headers={[
          'Store Code', 'Date', 'Total Sales', 'RFID Checkout', 'Taffeta Sales', 'Manual Sales'
        ]}
        data={tableData}
        emptyStateContent={
          <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <td colSpan={6} className="cc-data-grid-empty-cell">
              No sales data found
            </td>
          </motion.tr>
        }
        renderRow={(row) => (
          <motion.tr
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            key={row.STORE}
            className="cc-data-grid-tr"
          >
            <td className="cc-data-grid-td cc-data-grid-td-bold" style={{ padding: '8px' }}>
              <div className="cc-row-tooltip-wrapper">
                {row.STORE || '—'}
                {row.STORE_NAME && (
                  <div className="cc-row-tooltip">
                    {row.STORE_NAME}
                  </div>
                )}
              </div>
            </td>
            <td className="cc-data-grid-td" style={{ padding: '8px', fontSize: '12px', color: '#64748b' }}>
              {row.DATE ? row.DATE.split(' ')[0] : '—'}
            </td>
            <td className="cc-data-grid-td" style={{ padding: '8px' }}>{row.TOTAL_DPOS_SALE || '0'}</td>
            <td className="cc-data-grid-td" style={{ padding: '8px' }}>{row.TOTAL_RFID_CHECKOUT || '0'}</td>
            <td className="cc-data-grid-td" style={{ padding: '8px' }}>{row.TOTAL_TAFFETA_SALE || '0'}</td>
            <td className="cc-data-grid-td" style={{ padding: '8px' }}>{row.TOTAL_MANUAL_SALE || '0'}</td>
          </motion.tr>
        )}
      />


    </div>
  );
}
