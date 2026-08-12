import React from 'react';
import WarehouseEncodingBarChart from '../../../components/charts/WarehouseEncodingBarChart';
import { useWarehouseEncoding } from '../../../hooks/useDashboardData';

export default function DcEncodingSection() {
  const { chartData, isLoading } = useWarehouseEncoding();

  return (
    <WarehouseEncodingBarChart
      title="DC ENCODING"
      data={chartData}
      isLoading={isLoading}
    />
  );
}
