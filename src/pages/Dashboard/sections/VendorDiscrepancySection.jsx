import React, { useMemo } from 'react';
import { useVendorDiscrepancy } from '../../../hooks/useDashboardData';
import SectionHeader, { DateBadge } from '../../../components/common/SectionHeader';
import KpiCard from '../../../components/charts/KpiCard';
import GroupedBarChart from '../../../components/charts/GroupedBarChart';
import SemiDonutChart from '../../../components/charts/SemiDonutChart';
import '../../../components/charts/DashboardSection.css';
import WorkInProgress from '../../../components/common/WorkInProgress';
import * as Icons from 'lucide-react';

export default function VendorDiscrepancySection() {
  const { data, totals, isLoading, error } = useVendorDiscrepancy();

  // Derived Metrics for Charts & Lists
  const { barData, totalExpectedRaw, totalScannedRaw } = useMemo(() => {
    if (!data || !totals) return { barData: [], totalExpectedRaw: 0, totalScannedRaw: 0 };

    // 1. Bar Chart Data (Top 10 vendors by Expected Qty)
    const sortedData = [...data].sort((a, b) => Number(b.ACTUAL_QTY || 0) - Number(a.ACTUAL_QTY || 0));
    const barData = sortedData.slice(0, 10).map(row => ({
      name: row.VENDOR_CODE,
      fullName: row.VENDOR_NAME,
      Expected: Number(row.ACTUAL_QTY || 0),
      Scanned: Number(row.SCANNED_QTY || 0)
    }));

    // 2. Global Breakdowns
    const totalExpectedRaw = Number((totals.ACTUAL_QTY || '0').replace(/,/g, ''));
    const totalScannedRaw = Number((totals.SCANNED_QTY || '0').replace(/,/g, ''));

    return { barData, totalExpectedRaw, totalScannedRaw };
  }, [data, totals]);

  if (isLoading) {
    return (
      <section className="ds-section">
        <SectionHeader title="VENDOR DISCREPANCY" rightContent={<DateBadge />} />
        
        {/* 1. KPI Skeleton Row */}
        <div className="ds-charts-row ds-charts-row--kpi" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="ds-skeleton-box" style={{ height: '80px', borderRadius: '12px' }}>
              <div className="ds-shimmer" />
            </div>
          ))}
        </div>

        {/* 2. Charts Skeleton Row */}
        <div className="ds-charts-row ds-charts-row--2col">
          <div className="ds-skeleton-box" style={{ height: '330px', borderRadius: '20px' }}>
            <div className="ds-shimmer" />
          </div>
          <div className="ds-skeleton-box" style={{ height: '330px', borderRadius: '20px' }}>
            <div className="ds-shimmer" />
          </div>
        </div>
      </section>
    );
  }

  // if (error) {
  //   return <div className="ds-error">{error}</div>;
  // }

  return (
    <section className="ds-section">
      <SectionHeader title="VENDOR DISCREPANCY" rightContent={<DateBadge />} />
      <div style={{ height: '370px' }}>
        <WorkInProgress 
          title="VENDOR DISCREPANCY" 
          description="We are currently upgrading this section."  
          targetDate="2026-08-29T15:00:00"
        />
      </div>
    </section>
  );

  // return (
  //   <section className="ds-section">
  //     <SectionHeader title="VENDOR DISCREPANCY" rightContent={<DateBadge />} />

  //     {/* 1. KPI Row */}
  //     <div className="ds-charts-row ds-charts-row--kpi" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
  //       <KpiCard
  //         title="Total Expected Qty"
  //         value={totals?.ACTUAL_QTY || '0'}
  //         icon={<Icons.Truck size={20} />}
  //       />
  //       <KpiCard
  //         title="Total Scanned Qty"
  //         value={totals?.SCANNED_QTY || '0'}
  //         badgeVariant="success"
  //         icon={<Icons.PackageCheck size={20} />}
  //       />
  //       <KpiCard
  //         title="Current Discrepancy"
  //         value={totals?.DIFF_QTY || '0'}
  //         badge="Action Needed"
  //         badgeVariant="danger"
  //         icon={<Icons.AlertTriangle size={20} />}
  //       />
  //       <KpiCard
  //         title="Historical Discrepancy"
  //         value={totals?.DIFF_TILL_DATE || '0'}
  //         subtext="Cumulative shortfalls"
  //         badgeVariant="warning"
  //         icon={<Icons.History size={20} />}
  //       />
  //     </div>

  //     {/* 2. Charts Row */}
  //     <div className="ds-charts-row ds-charts-row--2col">
  //       {/* Left: Grouped Bar Chart */}
  //       <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
  //         <div className="ds-card-title--flex">
  //           <h3 className="ds-card-title">Expected vs Scanned (Top 10 Vendors)</h3>
  //         </div>
  //         <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Comparison of expected vs physically scanned quantities</p>
  //         <div style={{ flex: 1, minHeight: 0 }}>
  //           <GroupedBarChart
  //             data={barData}
  //             bars={[
  //               { dataKey: 'Expected', color: '#94a3b8', label: 'Expected Qty' },
  //               { dataKey: 'Scanned', color: '#0d9488', label: 'Scanned Qty' }
  //             ]}
  //             height={260}
  //           />
  //         </div>
  //       </div>

  //       {/* Right: SemiDonut Chart */}
  //       <div className="ds-card" style={{ display: 'flex', flexDirection: 'column' }}>
  //         <h3 className="ds-card-title">Global Receiving Accuracy</h3>
  //         <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>Overall receipt fulfillment rate across all vendor shipments</p>
  //         <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
  //           <SemiDonutChart
  //             value={totalScannedRaw}
  //             maxValue={totalExpectedRaw}
  //             centerLabel="Received"
  //             primaryColor="#0d9488"
  //           />
  //         </div>
  //       </div>
  //     </div>
  //   </section>
  // );
}
