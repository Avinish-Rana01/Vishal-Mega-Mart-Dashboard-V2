import React from 'react';
import DataTableCard from '../../../components/common/DataTableCard';
import { dcValidationColumns } from '../dashboardColumns';
import { useDcValidation } from '../../../hooks/useDashboardData';

export default function DcValidationSection() {
  const {
    data,
    totals,
    isLoading,
    error,
    setSearchQuery,
    refresh
  } = useDcValidation();

  return (
    <DataTableCard
      title="DC VALIDATION"
      columns={dcValidationColumns}
      data={data}
      totals={totals}
      isLoading={isLoading}
      error={error}
      onRefresh={refresh}
      onSearch={setSearchQuery}
      toolbarLeft={<button className="vmm-btn-primary vmm-btn-hu-summary">HU Summary</button>}
      enablePagination={true}
      pageSize={3}
    />
  );
}
