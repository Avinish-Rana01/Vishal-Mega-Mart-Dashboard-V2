import React, { useState, useMemo } from 'react';
import DataTableCard from '../../../components/common/DataTableCard';
import { getCycleCountColumns } from '../dashboardColumns';
import { useCycleCount } from '../../../hooks/useDashboardData';
import CycleCountModal from '../../../components/modals/CycleCountModal';

export default function CycleCountSection() {
  const {
    data,
    totals,
    isLoading,
    error,
    setSearchQuery,
    refresh
  } = useCycleCount();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);

  const handleRefClick = (row) => {
    setSelectedRowData(row);
    setIsModalOpen(true);
  };

  const columns = useMemo(() => getCycleCountColumns(handleRefClick), []);

  return (
    <>
      <DataTableCard
        title="CYCLE COUNT DASHBOARD"
        columns={columns}
        data={data}
        totals={totals}
        isLoading={isLoading}
        error={error}
        onRefresh={refresh}
        onSearch={setSearchQuery}
        enablePagination={true}
        pageSize={3}
      />
      {isModalOpen && (
        <CycleCountModal 
          modalData={selectedRowData} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}
