import React from 'react';
import { useNavigate } from 'react-router-dom';
import DataTableCard from '../../../components/common/DataTableCard';
import { storeDashboardColumns } from '../dashboardColumns';
import { useStoreDashboard } from '../../../hooks/useDashboardData';

export default function StoreValidationSection() {
  const navigate = useNavigate();
  const {
    data,
    totals,
    isLoading,
    error,
    setSearchQuery,
    refresh
  } = useStoreDashboard();

  const handleCellClick = (row, status, e) => {
    e.stopPropagation(); // Prevent row click if any
    navigate('/reports/grc', { 
      state: { 
        store: row.STORE || row.Store_Code, 
        fromDate: row.DATE || row.Date,
        toDate: row.DATE || row.Date,
        grcStatus: status
      } 
    });
  };

  // Override specific columns to be clickable with their respective grcStatus mappings
  const columns = storeDashboardColumns.map(col => {
    if (col.key === 'STORE') {
      return { 
        ...col, 
        render: (val, row) => (
          <span 
            className="vmm-link-num" 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/reports/store-grc', { 
                state: { 
                  store: val,
                  rowDate: row.DATE || row.Date || row.GRC_DATE || row.Grc_Date || row.date
                } 
              });
            }}
          >
            {val}
          </span>
        ) 
      };
    }
    if (col.key === 'HU_RECEIVED_QTY') {
      return { ...col, render: (val, row) => <span className="vmm-link-num" onClick={(e) => handleCellClick(row, '4', e)}>{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span> };
    }
    if (col.key === 'HU_VALIDATED_QTY') {
      return { ...col, render: (val, row) => <span className="vmm-link-num" onClick={(e) => handleCellClick(row, '1', e)}>{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span> };
    }
    if (col.key === 'HHT_VALIDATE_QTY') {
      return { ...col, render: (val, row) => <span className="vmm-link-num" onClick={(e) => handleCellClick(row, '2', e)}>{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span> };
    }
    if (col.key === 'STORE_PENDING_QTY') {
      return { ...col, render: (val, row) => <span className="vmm-link-num" onClick={(e) => handleCellClick(row, '3', e)}>{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span> };
    }
    if (col.key === 'HU_WRONG_QTY') {
      return { ...col, render: (val, row) => <span className="vmm-link-num" onClick={(e) => handleCellClick(row, '0', e)}>{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span> };
    }
    return col;
  });

  return (
    <DataTableCard
      title="STORE VALIDATION"
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
  );
}
