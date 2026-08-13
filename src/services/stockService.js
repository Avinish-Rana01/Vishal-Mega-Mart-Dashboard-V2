import axios from 'axios';
import { API_DEFAULTS } from '../config/constants';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Helper for default headers
const getHeaders = () => ({
  'Accept': 'application/json'
});

// ==============================================================
// Dashboard APIs
// ==============================================================

export const getLiveStock = async (searchQuery = '', pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/live-details?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&userId=${API_DEFAULTS.USER_ID}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getCycleCount = async (searchQuery = '', pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/cycle-count-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=STORE%20CODE&sortDirection=ASC&userId=${API_DEFAULTS.USER_ID}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getVendorDiscrepancy = async (searchQuery = '', pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/vendor-hu-discrepancy?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=DIFF_TILL_DATE&sortDirection=asc&userId=${API_DEFAULTS.USER_ID}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getTagLocation = async (signal) => {
  const response = await axios.get(`${API_BASE}/api/stock/tag-management-location`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getTagCycleCount = async (signal) => {
  const response = await axios.get(`${API_BASE}/api/stock/tag-cycle-count`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getStoreDashboard = async (searchQuery = '', pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/store-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=Store&sortDirection=asc&userId=${API_DEFAULTS.USER_ID}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getSaleDashboard = async (searchQuery = '', pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/sale-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=Store&sortDirection=asc&userId=${API_DEFAULTS.USER_ID}`, {
    headers: getHeaders(),
    signal
  });
  // Mock Data for Demo
  if (response.data) {
    const todayStr = new Date().toISOString().split('T')[0];
    response.data.summary = { 
      TOTAL_DPOS_SALE: "154200", TOTAL_RFID_CHECKOUT: "151000", RFID_CHECKOUT_MATCHING_WITH_DPOS_SALE: "150000", RFID_CHECKOUT_NOT_MATCHING_WITH_DPOS_SALE: "1000", TOTAL_MANUAL_SALE: "3200", TOTAL_VOID: "450"
    };
    response.data.items = [
      { STORE: 'S101', STORE_NAME: 'VMM Delhi', DATE: todayStr, TOTAL_DPOS_SALE: "45000", TOTAL_RFID_CHECKOUT: "44000", RFID_CHECKOUT_MATCHING_WITH_DPOS_SALE: "43500", RFID_CHECKOUT_NOT_MATCHING_WITH_DPOS_SALE: "500", TOTAL_MANUAL_SALE: "1000", TOTAL_VOID: "120" },
      { STORE: 'S102', STORE_NAME: 'VMM Mumbai', DATE: todayStr, TOTAL_DPOS_SALE: "65000", TOTAL_RFID_CHECKOUT: "64000", RFID_CHECKOUT_MATCHING_WITH_DPOS_SALE: "63800", RFID_CHECKOUT_NOT_MATCHING_WITH_DPOS_SALE: "200", TOTAL_MANUAL_SALE: "1000", TOTAL_VOID: "200" },
      { STORE: 'S103', STORE_NAME: 'VMM Bangalore', DATE: todayStr, TOTAL_DPOS_SALE: "44200", TOTAL_RFID_CHECKOUT: "43000", RFID_CHECKOUT_MATCHING_WITH_DPOS_SALE: "42700", RFID_CHECKOUT_NOT_MATCHING_WITH_DPOS_SALE: "300", TOTAL_MANUAL_SALE: "1200", TOTAL_VOID: "130" }
    ];
  }

  return response.data;
};

export const getVoidDashboard = async (searchQuery = '', pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/void-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=Store&sortDirection=asc&userId=${API_DEFAULTS.USER_ID}`, {
    headers: getHeaders(),
    signal
  });
  // Mock Data for Demo
  if (response.data) {
    const todayStr = new Date().toISOString().split('T')[0];
    response.data.summary = { VOID_QTY: "12450", ENCODE_QTY: "12100", DIFFERENCE_QTY: "350" };
    response.data.items = [
      { STORE: 'S101', STORE_NAME: 'VMM Delhi', DATE: todayStr, VOID_QTY: "4000", ENCODE_QTY: "3900", DIFFERENCE_QTY: "100" },
      { STORE: 'S102', STORE_NAME: 'VMM Mumbai', DATE: todayStr, VOID_QTY: "5000", ENCODE_QTY: "4900", DIFFERENCE_QTY: "100" },
      { STORE: 'S103', STORE_NAME: 'VMM Bangalore', DATE: todayStr, VOID_QTY: "3450", ENCODE_QTY: "3300", DIFFERENCE_QTY: "150" }
    ];
  }

  return response.data;
};

export const getReturnDashboard = async (searchQuery = '', pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/return-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=Store&sortDirection=asc&userId=${API_DEFAULTS.USER_ID}`, {
    headers: getHeaders(),
    signal
  });
  // Mock Data for Demo
  if (response.data) {
    const todayStr = new Date().toISOString().split('T')[0];
    response.data.summary = { RETURN_QTY: "8400", ENCODE_QTY: "8200", DIFFERENCE_QTY: "200" };
    response.data.items = [
      { Store_Code: 'S101', STORE_NAME: 'VMM Delhi', DATE: todayStr, RETURN_QTY: "3000", ENCODE_QTY: "2950", DIFFERENCE_QTY: "50" },
      { Store_Code: 'S102', STORE_NAME: 'VMM Mumbai', DATE: todayStr, RETURN_QTY: "4000", ENCODE_QTY: "3900", DIFFERENCE_QTY: "100" },
      { Store_Code: 'S103', STORE_NAME: 'VMM Bangalore', DATE: todayStr, RETURN_QTY: "1400", ENCODE_QTY: "1350", DIFFERENCE_QTY: "50" }
    ];
  }

  return response.data;
};

export const getWarehouseEncoding = async (fromDate, toDate, signal) => {
  const defaultDate = new Date().toISOString().split('T')[0];
  const fDate = fromDate || defaultDate;
  const tDate = toDate || defaultDate;
  const response = await axios.get(`${API_BASE}/api/stock/warehouse-encoding?fromDate=${fDate}&toDate=${tDate}`, {
    headers: getHeaders(),
    signal
  });
  // Mock Data for Demo
  if (response.data) {
    response.data.summary = { 
      hour8To9: 1200, hour9To10: 2500, hour10To11: 4100, hour11To12: 5800, 
      hour12To13: 4900, hour13To14: 3200, hour14To15: 3800, hour15To16: 6200, 
      hour16To17: 5500, hour17To18: 3100, hour18To19: 1500, hour19To20: 800 
    };
  }

  return response.data;
};

export const getDcValidation = async (searchQuery = '', pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/dc-validate-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&userId=${API_DEFAULTS.USER_ID}`, {
    headers: getHeaders(),
    signal
  });
  // Mock Data for Demo
  if (response.data) {
    response.data.summary = { recordCount: 150, PROCESSED_HU: "142", UNPROCESSED_HU: "8", PROCESSED_ARTICLE_QTY: "24500" };
    response.data.items = [
      { STORE_NAME: 'VMM Delhi', Reciving_Plant: 'DC North', PROCESSED_HU: "45", UNPROCESSED_HU: "2", PROCESSED_ARTICLE_QTY: "8000" },
      { STORE_NAME: 'VMM Mumbai', Reciving_Plant: 'DC West', PROCESSED_HU: "60", UNPROCESSED_HU: "3", PROCESSED_ARTICLE_QTY: "10000" },
      { STORE_NAME: 'VMM Bangalore', Reciving_Plant: 'DC South', PROCESSED_HU: "37", UNPROCESSED_HU: "3", PROCESSED_ARTICLE_QTY: "6500" }
    ];
  }

  return response.data;
};

// ==============================================================
// Report APIs
// ==============================================================

export const getReportStores = async (signal) => {
  const response = await axios.get(`${API_BASE}/api/report/stores?userId=${API_DEFAULTS.USER_ID}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const searchReportArticles = async (searchTerm, storeCode, fromDate, toDate, signal) => {
  const term = encodeURIComponent(searchTerm || '');
  const store = encodeURIComponent(storeCode || '');
  const response = await axios.get(`${API_BASE}/api/report/articles/search?searchTerm=${term}&storeCode=${store}&fromDate=${fromDate}&toDate=${toDate}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getReportLiveStock = async (storeCode, stockDate, articleNo, pageIndex, pageSize, signal) => {
  const store = encodeURIComponent(storeCode || '');
  const date = encodeURIComponent(stockDate || '');
  let url = `${API_BASE}/api/report/live-stock?pageIndex=${pageIndex}&pageSize=${pageSize}&storeName=${store}&stockDate=${date}&sortColumn=STOCK_DATE&sortDirection=asc`;
  
  if (articleNo) {
    url += `&articleNo=${encodeURIComponent(articleNo)}`;
  }
  
  const response = await axios.get(url, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const searchGrcHuNumbers = async (searchTerm, grcStatus = '1', storeCode = '', fromDate = '', toDate = '', signal) => {
  const term = encodeURIComponent(searchTerm || '');
  const url = `${API_BASE}/api/grc-report/hu-numbers/search?grcStatus=${grcStatus}&searchTerm=${term}&storeCode=${storeCode}&fromDate=${fromDate}&toDate=${toDate}`;
  const response = await axios.get(url, { headers: getHeaders(), signal });
  return response.data;
};

export const getGrcDetails = async (pageIndex, pageSize, grcStatus = '1', storeName = '', huNo = '', fromDate = '', toDate = '', signal) => {
  let url = `${API_BASE}/api/grc-report/details?pageIndex=${pageIndex}&pageSize=${pageSize}&grcStatus=${grcStatus}&storeName=${encodeURIComponent(storeName)}&fromDate=${fromDate}&toDate=${toDate}`;
  if (huNo) {
    url += `&huNo=${encodeURIComponent(huNo)}`;
  }
  const response = await axios.get(url, { headers: getHeaders(), signal });
  return response.data;
};

export const getStoreGrcReport = async (storeCode, fromDate, toDate, pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, signal) => {
  const store = encodeURIComponent(storeCode || '');
  const response = await axios.get(`${API_BASE}/api/stock/store-grc-report?storeCode=${store}&fromDate=${fromDate}&toDate=${toDate}&pageIndex=${pageIndex}&pageSize=${pageSize}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getBindStores = async (fromDate, toDate, signal) => {
  const response = await axios.get(`${API_BASE}/api/report/stores?userId=${API_DEFAULTS.USER_ID}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getCycleCountReport = async (pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, searchTerm = '', storeCode = '', fromDate = '', toDate = '', signal) => {
  const term = encodeURIComponent(searchTerm || '');
  const store = encodeURIComponent(storeCode || '');
  const response = await axios.get(`${API_BASE}/api/stock/cycle-count-report?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&storeCode=${store}&fromDate=${fromDate}&toDate=${toDate}&sortColumn=DATE&sortDirection=DESC`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getCycleCountDetails = async (pageIndex = API_DEFAULTS.PAGE_INDEX, pageSize = API_DEFAULTS.PAGE_SIZE, searchTerm = '', storeCode = '', fromDate = '', toDate = '', refNo = '', signal) => {
  const term = encodeURIComponent(searchTerm || '');
  const store = encodeURIComponent(storeCode || '');
  const ref = encodeURIComponent(refNo || '');
  const response = await axios.get(`${API_BASE}/api/stock/cycle-count-details?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&storeCode=${store}&fromDate=${fromDate}&toDate=${toDate}&refNo=${ref}&sortColumn=STORE_CODE&sortDirection=asc`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};
