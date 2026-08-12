import React from 'react';
import DataTableCard from '../../../components/common/DataTableCard';
import { saleDashboardColumns } from '../dashboardColumns';
import { useSaleDashboard } from '../../../hooks/useDashboardData';

export default function SaleDashboardSection() {
  const {
    data,
    totals,
    isLoading,
    error,
    setSearchQuery,
    refresh
  } = useSaleDashboard();

  return (
    <DataTableCard
      title="SALE DASHBOARD"
      columns={saleDashboardColumns}
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
