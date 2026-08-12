import React from 'react';
import DataTableCard from '../../../components/common/DataTableCard';
import { voidDashboardColumns } from '../dashboardColumns';
import { useVoidDashboard } from '../../../hooks/useDashboardData';

export default function VoidDashboardSection() {
  const {
    data,
    totals,
    isLoading,
    error,
    setSearchQuery,
    refresh
  } = useVoidDashboard();

  return (
    <DataTableCard
      title="VOID DASHBOARD"
      columns={voidDashboardColumns}
      data={data}
      totals={totals}
      isLoading={isLoading}
      error={error}
      onRefresh={refresh}
      onSearch={setSearchQuery}
      enablePagination={true}
      pageSize={3}
    />
  );
}
