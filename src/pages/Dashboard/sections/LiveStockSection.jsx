import React from 'react';
import { useNavigate } from 'react-router-dom';
import DataTableCard from '../../../components/common/DataTableCard';
import { liveStockColumns } from '../dashboardColumns';
import { useLiveStock } from '../../../hooks/useDashboardData';

export default function LiveStockSection() {
  const navigate = useNavigate();
  const {
    data,
    totals,
    isLoading,
    error,
    setSearchQuery,
    refresh
  } = useLiveStock();

  return (
    <DataTableCard
      title="LIVE STOCK"
      columns={liveStockColumns}
      data={data}
      totals={totals}
      isLoading={isLoading}
      error={error}
      onRefresh={refresh}
      onSearch={setSearchQuery}
      onRowClick={(row) => navigate('/reports/live-stock', { state: { store: row.STORE_CODE, date: row.DATE } })}
      enablePagination={true}
      pageSize={3}
    />
  );
}
