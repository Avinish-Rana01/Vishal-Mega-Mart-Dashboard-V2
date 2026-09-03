import React, { useState, useMemo } from 'react';
import { useDcValidation } from '../../../hooks/useDashboardData';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import DashboardDataGrid from '../../../components/charts/DashboardDataGrid';
import CustomDropdown from '../../../components/common/CustomDropdown';
import ChartToolbar from '../../../components/common/ChartToolbar';
import ChartSearchInput from '../../../components/common/ChartSearchInput';
import ChartLegend from '../../../components/common/ChartLegend';
import { SearchEmptyState } from '../../../components/common/ChartEmptyState';
import DashboardShimmer from '../../../components/common/DashboardShimmer';
import '../../../components/charts/DashboardSection.css';
import './CycleCountSection.css';
import * as Icons from 'lucide-react';

const COLOR_PROCESSED = '#06b6d4'; // Cyan
const COLOR_UNPROCESSED = '#64748b'; // Gray

export default function DcValidationSection() {
  const { data, totals, isLoading, error } = useDcValidation();

  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('UNPROCESSED_DESC');
  const [tableSort, setTableSort] = useState('UNPROCESSED_DESC');

  const sortOptions = useMemo(() => [
    { value: 'PROCESSED_DESC', label: 'Most Processed HU' },
    { value: 'PROCESSED_ASC', label: 'Least Processed HU' },
    { value: 'UNPROCESSED_DESC', label: 'Most Unprocessed HU' },
    { value: 'UNPROCESSED_ASC', label: 'Least Unprocessed HU' },
    { value: 'ARTICLES_DESC', label: 'Highest Article Qty' }
  ], []);

  // Filtered + sorted data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    let result = [...data];

    // Search
    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase();
      result = result.filter(row =>
        (row.Reciving_Plant && row.Reciving_Plant.toLowerCase().includes(term)) ||
        (row.STORE_NAME && row.STORE_NAME.toLowerCase().includes(term))
      );
    }

    // Sort
    if (sortBy === 'PROCESSED_DESC') {
      result.sort((a, b) => Number(b.PROCESSED_HU || 0) - Number(a.PROCESSED_HU || 0));
    } else if (sortBy === 'PROCESSED_ASC') {
      result.sort((a, b) => Number(a.PROCESSED_HU || 0) - Number(b.PROCESSED_HU || 0));
    } else if (sortBy === 'UNPROCESSED_DESC') {
      result.sort((a, b) => Number(b.UNPROCESSED_HU || 0) - Number(a.UNPROCESSED_HU || 0));
    } else if (sortBy === 'UNPROCESSED_ASC') {
      result.sort((a, b) => Number(a.UNPROCESSED_HU || 0) - Number(b.UNPROCESSED_HU || 0));
    } else if (sortBy === 'ARTICLES_DESC') {
      result.sort((a, b) => Number(b.PROCESSED_ARTICLE_QTY || 0) - Number(a.PROCESSED_ARTICLE_QTY || 0));
    }

    // Format for GroupedBarChart
    return result.map(row => ({
      name: row.Reciving_Plant, 
      fullName: row.STORE_NAME || row.Reciving_Plant,
      Processed: Number(row.PROCESSED_HU || 0),
      Unprocessed: Number(row.UNPROCESSED_HU || 0)
    }));
  }, [data, searchFilter, sortBy]);

  // Separate sorted data for the Data Grid
  const tableData = useMemo(() => {
    if (!data || data.length === 0) return [];
    let result = [...data];

    // Sort for table
    if (tableSort === 'PROCESSED_DESC') {
      result.sort((a, b) => Number(b.PROCESSED_HU || 0) - Number(a.PROCESSED_HU || 0));
    } else if (tableSort === 'PROCESSED_ASC') {
      result.sort((a, b) => Number(a.PROCESSED_HU || 0) - Number(b.PROCESSED_HU || 0));
    } else if (tableSort === 'UNPROCESSED_DESC') {
      result.sort((a, b) => Number(b.UNPROCESSED_HU || 0) - Number(a.UNPROCESSED_HU || 0));
    } else if (tableSort === 'UNPROCESSED_ASC') {
      result.sort((a, b) => Number(a.UNPROCESSED_HU || 0) - Number(b.UNPROCESSED_HU || 0));
    } else if (tableSort === 'ARTICLES_DESC') {
      result.sort((a, b) => Number(b.PROCESSED_ARTICLE_QTY || 0) - Number(a.PROCESSED_ARTICLE_QTY || 0));
    }

    return result;
  }, [data, tableSort]);

  if (isLoading) return <DashboardShimmer title="DC Validation" />;

  if (error) {
    return <div className="ds-error">{error}</div>;
  }

  const processedTotal = Number(totals?.PROCESSED_HU || 0);
  const unprocessedTotal = Number(totals?.UNPROCESSED_HU || 0);
  const totalHUs = processedTotal + unprocessedTotal;
  const processingRate = totalHUs > 0 ? ((processedTotal / totalHUs) * 100).toFixed(2) : 0;



  return (
    <div className="cc-container">
      <SectionHeader title="DC Validation" rightContent={<DateBadge />} />

      {/* 1. KPI Row */}
      <div className="cc-kpi-row" style={{ '--kpi-cols': 4 }}>
        <KpiCard
          title="Processed HUs"
          value={processedTotal.toLocaleString('en-IN')}
          badgeVariant="success"
          icon={<Icons.CheckSquare />}
        />
        <KpiCard
          title="Unprocessed HUs"
          value={unprocessedTotal.toLocaleString('en-IN')}
          badge="Backlog"
          badgeVariant="warning"
          icon={<Icons.Package />}
        />
        <KpiCard
          title="Validated Articles"
          value={Number(totals?.PROCESSED_ARTICLE_QTY || 0).toLocaleString('en-IN')}
          subtext="Total items inside processed HUs"
          badgeVariant="info"
          icon={<Icons.Layers />}
        />
        <KpiCard
          title="Processing Rate"
          value={`${processingRate}%`}
          badgeVariant={processingRate >= 95 ? "success" : processingRate >= 80 ? "warning" : "danger"}
          icon={<Icons.CheckSquare />}
        />
      </div>

      {/* 2. Charts Row */}
      <div className="cc-card">
        <ChartToolbar
          leftContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Processed vs Unprocessed
              </h3>
            </div>
          }
          rightContent={
            <>
              <CustomDropdown
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                prefix="Sort:"
                buttonStyle={{ minWidth: 'auto', gap: '8px' }}
                menuStyle={{ left: 'auto', right: 0, minWidth: '200px' }}
              />
              <ChartSearchInput
                value={searchFilter}
                onChange={setSearchFilter}
                onClear={() => setSearchFilter('')}
              />
            </>
          }
        />

        {/* Legend */}
        <ChartLegend items={[
          { color: COLOR_PROCESSED, label: 'Processed HU' },
          { color: COLOR_UNPROCESSED, label: 'Unprocessed HU' },
        ]} />

        {/* Chart Scroll Area */}
        <div className="cc-chart-scroll" style={{ minHeight: '275px', maxHeight: '275px', overflowY: 'hidden' }}>
          {chartData.length === 0 ? (
            <SearchEmptyState 
              searchFilter={searchFilter}
              title={`No Stores Found for "${searchFilter}"`}
              subtitle="Try a different store code or clear your search."
              onClearSearch={() => setSearchFilter('')}
            />
          ) : (
            <div style={{ minWidth: `max(100%, ${chartData.length * 60}px)`, height: '100%' }}>
              <GroupedBarChart
                data={chartData}
                bars={[
                  { dataKey: 'Processed', color: COLOR_PROCESSED, label: 'Processed HU' },
                  { dataKey: 'Unprocessed', color: COLOR_UNPROCESSED, label: 'Unprocessed HU' }
                ]}
                height="100%"
                hideLegend={true}
                showValues={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Data Grid */}
      <DashboardDataGrid
        title={
          <span>
            DC VALIDATION <span className="hide-on-mobile">SUMMARY</span>
          </span>
        }
        subtitle={
          <span className="hide-on-mobile">
            {`${tableData.length} store${tableData.length !== 1 ? 's' : ''}`}
          </span>
        }
        innerWrapperStyle={{ minWidth: 'auto' }}
        tableStyle={{ width: 'auto', margin: '0 auto' }}
        headerAction={
          <CustomDropdown
            options={sortOptions}
            value={tableSort}
            onChange={setTableSort}
            prefix="Sort:"
            buttonStyle={{ minWidth: 'auto', gap: '8px' }}
            menuStyle={{ left: 'auto', right: 0, minWidth: '200px' }}
          />
        }
        headers={[
          <div style={{ width: '100px' }}>Store</div>,
          <div style={{ width: '130px', textAlign: 'center' }}>Processed HU Qty</div>,
          <div style={{ width: '150px', textAlign: 'center' }}>Unprocessed HU Qty</div>,
          <div style={{ width: '150px', textAlign: 'center', whiteSpace: 'normal' }}>Validated HU Article Qty</div>
        ]}
        data={tableData}
        emptyStateContent={
          <tr>
            <td colSpan={4} className="cc-data-grid-empty-cell">
              No validation data found
            </td>
          </tr>
        }
        renderRow={(row, idx) => {
          const processed = Number(row.PROCESSED_HU || 0);
          const unprocessed = Number(row.UNPROCESSED_HU || 0);
          const articles = Number(row.PROCESSED_ARTICLE_QTY || 0);

          return (
            <tr key={row.Reciving_Plant || idx} className="cc-data-grid-tr">
              <td className="cc-data-grid-td cc-data-grid-td-bold" style={{ width: '100px' }}>
                <div className="cc-row-tooltip-wrapper">
                  {row.Reciving_Plant || '—'}
                  {row.STORE_NAME && (
                    <div className="cc-row-tooltip">
                      {row.STORE_NAME}
                    </div>
                  )}
                </div>
              </td>
              <td className="cc-data-grid-td" style={{ width: '130px', textAlign: 'center' }}>
                <span style={{ color: COLOR_PROCESSED, fontWeight: 700 }}>{processed.toLocaleString('en-IN')}</span>
              </td>
              <td className="cc-data-grid-td" style={{ width: '150px', textAlign: 'center' }}>
                {unprocessed > 0 ? (
                  <span style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '70px', background: '#fef3c7', color: '#d97706', fontWeight: 700, borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>
                    {unprocessed.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '70px', background: '#dcfce7', color: '#16a34a', fontWeight: 700, borderRadius: '6px', padding: '2px 8px', fontSize: '12px' }}>✓ Clear</span>
                )}
              </td>
              <td className="cc-data-grid-td" style={{ width: '150px', textAlign: 'center' }}>
                <span style={{ fontWeight: 600 }}>{articles.toLocaleString('en-IN')}</span>
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
}


