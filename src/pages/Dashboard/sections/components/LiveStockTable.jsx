import React, { useState, useEffect } from 'react';
import ReportDataTableCard from '../../../../components/common/ReportDataTableCard';
import { getReportLiveStock } from '../../../../services/stockService';

export default function LiveStockTable({ storeCode, storeName, date }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    if (!storeCode || !date) return;
    
    const controller = new AbortController();
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getReportLiveStock(storeCode, date, '', pageIndex, pageSize, controller.signal);
        
        if (controller.signal.aborted) return;
        
        const itemsArray = result.items || result.data || [];
        const mappedData = itemsArray.map((item) => ({
          srNo: item.RowNumber,
          stockDate: (item.STOCK_DATE || item.DATE) ? (item.STOCK_DATE || item.DATE).split('T')[0] : '',
          articleNo: item.ARTICLE,
          sapStock: item.SAP_STOCK,
          rfidStock: item.RFID_STOCK,
          diff: item.DIFFERENCE || item.DIFF
        }));
        
        setData(mappedData);

        if (result.summary) {
          setTotalRecords(result.summary.totalCount || result.summary.totalRecords || 0);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError("Unable to load detailed article report.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [storeCode, date, pageIndex, pageSize]);

  const numRenderer = (val) => <span style={{ fontWeight: '500' }}>{typeof val === 'number' ? val.toLocaleString('en-IN') : val}</span>;
  const linkRenderer = (val) => <span style={{ color: '#0284c7', cursor: 'pointer', fontWeight: '500' }}>{val}</span>;

  const columns = [
    { key: 'srNo', label: 'SR.NO' },
    { key: 'stockDate', label: 'STOCK DATE' },
    { key: 'articleNo', label: 'ARTICLE NO', render: linkRenderer },
    { key: 'sapStock', label: 'SAP STOCK', render: numRenderer },
    { key: 'rfidStock', label: 'RFID STOCK', render: numRenderer },
    { key: 'diff', label: 'DIFFERENCE', render: numRenderer }
  ];

  if (error) {
    return <div style={{ padding: '20px', color: '#ef4444' }}>{error}</div>;
  }

  return (
    <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <ReportDataTableCard 
        columns={columns}
        data={data}
        isLoading={isLoading}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalRecords={totalRecords || data.length}
      />
    </div>
  );
}
