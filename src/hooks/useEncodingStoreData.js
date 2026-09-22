import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getActiveUserId } from '../services/stockService';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getHeaders = () => ({
  'Accept': 'application/json'
});

/**
 * Hook to fetch Encoding Store Report data with pagination and filtering.
 */
export const useEncodingStoreData = ({
  storeName = '',
  fromDate = '',
  toDate = '',
  ean = '',
  articleNo = '',
  searchTerm = '',
  sortColumn = '',
  sortDirection = ''
}) => {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEncodingStoreData = async (signal) => {
    const params = new URLSearchParams();
    if (storeName) params.append('StoreName', storeName);
    if (fromDate) params.append('FromDate', fromDate);
    if (toDate) params.append('ToDate', toDate);
    if (ean) params.append('Ean', ean);
    if (articleNo) params.append('ArticleNo', articleNo);
    const uid = typeof getActiveUserId === 'function' ? getActiveUserId() : 1;
    params.append('UserId', uid);
    params.append('PageIndex', pageIndex);
    params.append('PageSize', pageSize);
    if (searchTerm) params.append('SearchTerm', searchTerm);
    if (sortColumn) params.append('SortColumn', sortColumn);
    if (sortDirection) params.append('SortDirection', sortDirection);

    const response = await axios.get(`${API_BASE}/api/Stock/GetEncodingStoreData?${params.toString()}`, {
      headers: getHeaders(),
      signal
    });
    return response.data;
  };

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      if (data.length === 0) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const result = await fetchEncodingStoreData(controller.signal);
        
        if (controller.signal.aborted) return;

        const rawData = result?.Data || result?.data || [];
        setData(rawData);
        
        const count = result?.RecordCount ?? result?.recordCount ?? result?.TotalCount ?? result?.totalCount ?? rawData.length;
        setTotalRecords(count);

        setSummary({
          AssignedStore: storeName || 'ALL',
          EanCount: new Set(rawData.map(d => d.EAN || d.Ean || d.ean)).size,
          EncodingTagsCount: rawData.reduce((sum, row) => sum + (Number(row.ENCODING_TAGS || row.Encoding_Tags || row.TAGS || row.QTY) || 0), 0)
        });

        if (count > 0) {
          setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
        } else {
          setTotalPages(1);
        }
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        console.error("Error fetching encoding store data:", err);
        setError("Unable to load data. Please check your connection.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    // Debounce for search term changes
    const delay = searchTerm ? 300 : 0;
    const timeout = setTimeout(fetchData, delay);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [storeName, fromDate, toDate, ean, articleNo, searchTerm, sortColumn, sortDirection, pageIndex, pageSize, refreshTrigger]);

  const refresh = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

  return {
    data,
    summary,
    isLoading,
    isRefreshing,
    error,
    refresh,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    totalRecords,
    totalPages
  };
};
