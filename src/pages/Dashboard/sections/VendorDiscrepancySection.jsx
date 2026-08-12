import React from 'react';
import DataTableCard from '../../../components/common/DataTableCard';
import { vendorDiscrepancyColumns } from '../dashboardColumns';
import { useVendorDiscrepancy } from '../../../hooks/useDashboardData';

export default function VendorDiscrepancySection() {
  const {
    data,
    totals,
    isLoading,
    error,
    setSearchQuery,
    refresh
  } = useVendorDiscrepancy();

  return (
    <DataTableCard
      title="VENDOR DISCREPANCY"
      columns={vendorDiscrepancyColumns}
      data={data}
      totals={totals}
      isLoading={isLoading}
      error={error}
      onRefresh={refresh}
      onSearch={setSearchQuery}
      enablePagination={true}
      pageSize={3}
      fullWidth={true}
    />
  );
}
