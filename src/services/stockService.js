import axios from 'axios';


const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Helper for default headers
const getHeaders = () => ({
  'Accept': 'application/json'
});

  // Helper to dynamically get the active user ID from current authenticated session
  export const getActiveUserId = () => {
    try {
      const raw = sessionStorage.getItem('vmm_user');
      if (raw) {
        const user = JSON.parse(raw);
        // Direct match for all common casings (notably userID from login response)
        const direct = user.userID ?? user.userId ?? user.UserID ?? user.User_Id ?? user.USER_ID ?? user.user_id ?? user.id ?? user.Id;
        if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
          return direct;
        }
        // Case-insensitive key scan fallback
        for (const key of Object.keys(user)) {
          const lower = key.toLowerCase();
          if (lower === 'userid' || lower === 'user_id') {
            const val = user[key];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              return val;
            }
          }
        }
      }
    } catch (e) {
      // fallback if parse fails
    }
    return API_DEFAULTS.USER_ID;
  };

// ==============================================================
// Dashboard APIs
// ==============================================================

export const getLiveStock = async (searchQuery = '', pageIndex = 1, pageSize = 100, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/live-details?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&userId=${getActiveUserId()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getCycleCount = async (searchQuery = '', pageIndex = 1, pageSize = 100, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/cycle-count-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=STORE%20CODE&sortDirection=ASC&userId=${getActiveUserId()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getVendorDiscrepancy = async (searchQuery = '', pageIndex = 1, pageSize = 100, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/vendor-hu-discrepancy?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=DIFF_TILL_DATE&sortDirection=asc&userId=${getActiveUserId()}`, {
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

export const getStoreDashboard = async (searchQuery = '', pageIndex = 1, pageSize = 100, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/store-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=Store&sortDirection=asc&userId=${getActiveUserId()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getSaleDashboard = async (searchQuery = '', pageIndex = 1, pageSize = 100, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/sale-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=Store&sortDirection=asc&userId=${getActiveUserId()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getVoidDashboard = async (searchQuery = '', pageIndex = 1, pageSize = 100, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/void-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=Store&sortDirection=asc&userId=${getActiveUserId()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getReturnDashboard = async (searchQuery = '', pageIndex = 1, pageSize = 100, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/return-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&sortColumn=Store&sortDirection=asc&userId=${getActiveUserId()}`, {
    headers: getHeaders(),
    signal
  });
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
  return response.data;
};

export const getDcValidation = async (searchQuery = '', pageIndex = 1, pageSize = 100, signal) => {
  const term = encodeURIComponent(searchQuery || '');
  const response = await axios.get(`${API_BASE}/api/stock/dc-validate-dashboard?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&userId=${getActiveUserId()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

// ==============================================================
// Report APIs
// ==============================================================

export const getReportStores = async (signal) => {
  const response = await axios.get(`${API_BASE}/api/report/stores?userId=${getActiveUserId()}`, {
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

export const getStoreGrcReport = async (storeCode, fromDate, toDate, pageIndex = 1, pageSize = 100, signal) => {
  const store = encodeURIComponent(storeCode || '');
  const response = await axios.get(`${API_BASE}/api/stock/store-grc-report?storeCode=${store}&fromDate=${fromDate}&toDate=${toDate}&pageIndex=${pageIndex}&pageSize=${pageSize}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getBindStores = async (fromDate, toDate, signal) => {
  const response = await axios.get(`${API_BASE}/api/report/stores?userId=${getActiveUserId()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getCycleCountReport = async (pageIndex = 1, pageSize = 100, searchTerm = '', storeCode = '', fromDate = '', toDate = '', signal) => {
  const term = encodeURIComponent(searchTerm || '');
  const store = encodeURIComponent(storeCode || '');
  const response = await axios.get(`${API_BASE}/api/stock/cycle-count-report?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&storeCode=${store}&fromDate=${fromDate}&toDate=${toDate}&sortColumn=DATE&sortDirection=DESC`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getCycleCountDetails = async (pageIndex = 1, pageSize = 100, searchTerm = '', storeCode = '', fromDate = '', toDate = '', refNo = '', signal) => {
  const term = encodeURIComponent(searchTerm || '');
  const store = encodeURIComponent(storeCode || '');
  const ref = encodeURIComponent(refNo || '');
  const response = await axios.get(`${API_BASE}/api/stock/cycle-count-details?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&storeCode=${store}&fromDate=${fromDate}&toDate=${toDate}&refNo=${ref}&sortColumn=STORE_CODE&sortDirection=asc`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getStoreSaleReport = async ({
  storeCode = '',
  fromDate = '',
  toDate = '',
  searchTerm = '',
  pageIndex = 1,
  pageSize = 100,
  sortColumn = 'DATE',
  sortDirection = 'desc'
} = {}, signal) => {
  const params = new URLSearchParams({
    userId: String(getActiveUserId()),
    searchTerm: searchTerm || '',
    storeCode: storeCode || '',
    fromDate: fromDate || '',
    toDate: toDate || '',
    pageIndex: String(pageIndex || 1),
    pageSize: String(pageSize || 10),
    sortColumn: sortColumn || 'DATE',
    sortDirection: sortDirection || 'desc'
  });

  const response = await axios.get(`${API_BASE}/api/stock/store-sale-report?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getSaleData = async ({
  columnName = 'TOTAL_DPOS_SALE',
  storeName = '',
  store = '',
  storeCode = '',
  fromDate = '',
  toDate = '',
  pos = '',
  articleNo = '',
  ean = '',
  pageIndex = 1,
  pageSize = 100,
  searchTerm = '',
  sortColumn = 'ITEM_CD',
  sortDirection = 'asc'
} = {}, signal) => {
  const effectiveStore = storeCode || store || storeName || '';
  const params = new URLSearchParams({
    columnName: columnName || 'TOTAL_DPOS_SALE',
    storeName: effectiveStore,
    store: effectiveStore,
    storeCode: effectiveStore,
    fromDate: fromDate || '',
    toDate: toDate || '',
    pos: pos || '',
    articleNo: articleNo || '',
    ean: ean || '',
    pageIndex: String(pageIndex || 1),
    pageSize: String(pageSize || 10),
    searchTerm: searchTerm || '',
    sortColumn: sortColumn || 'ITEM_CD',
    sortDirection: sortDirection || 'asc',
    userId: String(getActiveUserId())
  });

  const response = await axios.get(`${API_BASE}/api/stock/sale-data?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getSalePosCounters = async ({ columnName = 'TOTAL_DPOS_SALE', store = '', fromDate = '', toDate = '' } = {}, signal) => {
  const params = new URLSearchParams({
    columnName: columnName || 'TOTAL_DPOS_SALE',
    store: store || '',
    fromDate: fromDate || '',
    toDate: toDate || ''
  });
  const response = await axios.get(`${API_BASE}/api/stock/sale/pos-counters?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const searchSaleArticles = async ({ columnName = 'TOTAL_DPOS_SALE', store = '', pos = '', fromDate = '', toDate = '', searchTerm = '' } = {}, signal) => {
  const params = new URLSearchParams({
    columnName: columnName || 'TOTAL_DPOS_SALE',
    store: store || '',
    pos: pos || '',
    fromDate: fromDate || '',
    toDate: toDate || '',
    searchTerm: searchTerm || ''
  });
  const response = await axios.get(`${API_BASE}/api/stock/sale/articles?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const searchSaleEans = async ({ columnName = 'TOTAL_DPOS_SALE', store = '', pos = '', fromDate = '', toDate = '', material = '', searchTerm = '' } = {}, signal) => {
  const params = new URLSearchParams({
    columnName: columnName || 'TOTAL_DPOS_SALE',
    store: store || '',
    pos: pos || '',
    fromDate: fromDate || '',
    toDate: toDate || '',
    material: material || '',
    searchTerm: searchTerm || ''
  });
  const response = await axios.get(`${API_BASE}/api/stock/sale/eans?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getGrcModalDetails = async ({
  huNo = '',
  article = '',
  scanTime = '',
  storeCode = '',
  grcStatus = '',
  pageIndex = 1,
  pageSize = 10,
  searchTerm = ''
} = {}, signal) => {
  const params = new URLSearchParams();
  if (huNo) params.append('huNo', huNo);
  if (article) params.append('article', article);
  if (scanTime) params.append('scanTime', scanTime);
  if (storeCode) params.append('storeCode', storeCode);
  if (grcStatus) params.append('grcStatus', grcStatus);
  params.append('pageIndex', pageIndex);
  params.append('pageSize', pageSize);
  if (searchTerm) params.append('searchTerm', searchTerm);

  const response = await axios.get(`${API_BASE}/api/grc-report/modal-details?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};


