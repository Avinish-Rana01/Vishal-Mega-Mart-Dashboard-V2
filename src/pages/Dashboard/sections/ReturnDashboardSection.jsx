import React from 'react';
import DataTableCard from '../../../components/common/DataTableCard';
import { returnDashboardColumns } from '../dashboardColumns';
import { useReturnDashboard } from '../../../hooks/useDashboardData';

export default function ReturnDashboardSection() {
  const {
    data,
    totals,
    isLoading,
    error,
    setSearchQuery,
    refresh
  } = useReturnDashboard();

  return (
    <DataTableCard
      title="RETURN DASHBOARD"
      columns={returnDashboardColumns}
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
