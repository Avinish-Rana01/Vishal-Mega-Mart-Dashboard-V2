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
    return 1;
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

export const getVoidDetails = async (storeName = '', fromDate = '', toDate = '', pageIndex = 1, pageSize = 100, sortColumn = 'DATE', sortDirection = 'asc', signal) => {
  const store = encodeURIComponent(storeName || '');
  const response = await axios.get(`${API_BASE}/api/stock/GetVoidDetails?storeName=${store}&fromDate=${fromDate}&toDate=${toDate}&pageIndex=${pageIndex}&pageSize=${pageSize}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getVoidReconciliationData = async (storeName = '', fromDate = '', toDate = '', pos = '', ean = '', pageIndex = 1, pageSize = 100, sortColumn = 'DATE', sortDirection = 'asc', signal) => {
  const store = encodeURIComponent(storeName || '');
  const p = encodeURIComponent(pos || '');
  const e = encodeURIComponent(ean || '');
  const response = await axios.get(`${API_BASE}/api/stock/GetVoidReconciliationData?storeName=${store}&fromDate=${fromDate}&toDate=${toDate}&pos=${p}&ean=${e}&pageIndex=${pageIndex}&pageSize=${pageSize}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getVoidReconciliationDataModel = async ({
  storeCode = '',
  billDate = '',
  pos = '',
  ean = '',
  pageIndex = 1,
  pageSize = 10,
  searchTerm = '',
  sortColumn = 'VOID_DATE',
  sortDirection = 'ASC',
  signal
} = {}) => {
  const params = new URLSearchParams();
  if (storeCode) params.append('StoreCode', storeCode);
  if (billDate) params.append('BillDate', billDate);
  if (pos) params.append('Pos', pos);
  if (ean) params.append('Ean', ean);
  if (pageIndex) params.append('PageIndex', pageIndex);
  if (pageSize) params.append('PageSize', pageSize);
  if (searchTerm) params.append('SearchTerm', searchTerm);
  if (sortColumn) params.append('SortColumn', sortColumn);
  if (sortDirection) params.append('SortDirection', sortDirection);

  const response = await axios.get(
    `${API_BASE}/api/Stock/GetVoidReconciliationDataModel?${params.toString()}`,
    {
      headers: getHeaders(),
      signal
    }
  );
  return response.data;
};

export const getVoidPosCounters = async (store = '', fromDate = '', toDate = '', signal) => {
  const storeEnc = encodeURIComponent(store || '');
  const response = await axios.get(`${API_BASE}/api/stock/void/pos-counters?store=${storeEnc}&fromDate=${fromDate}&toDate=${toDate}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getVoidSearchEAN = async (store = '', fromDate = '', toDate = '', searchTerm = '', pos = '', signal) => {
  const storeEnc = encodeURIComponent(store || '');
  const searchEnc = encodeURIComponent(searchTerm || '');
  const posEnc = encodeURIComponent(pos || '');
  const response = await axios.get(`${API_BASE}/api/stock/void-SearchEAN?store=${storeEnc}&fromDate=${fromDate}&toDate=${toDate}&searchTerm=${searchEnc}&pos=${posEnc}`, {
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

export const getReturnDetails = async (storeName = '', fromDate = '', toDate = '', pageIndex = 1, pageSize = 100, sortColumn = 'DATE', sortDirection = 'asc', signal) => {
  const store = encodeURIComponent(storeName || '');
  const response = await axios.get(`${API_BASE}/api/stock/dashboard/return-details?storeName=${store}&fromDate=${fromDate}&toDate=${toDate}&pageIndex=${pageIndex}&pageSize=${pageSize}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getReturnReconciliationData = async (storeName = '', fromDate = '', toDate = '', pos = '', ean = '', pageIndex = 1, pageSize = 100, sortColumn = 'BILL_DATE', sortDirection = 'asc', signal) => {
  const store = encodeURIComponent(storeName || '');
  const p = encodeURIComponent(pos || '');
  const e = encodeURIComponent(ean || '');
  const response = await axios.get(`${API_BASE}/api/stock/void/return-reconciliation?storeName=${store}&fromDate=${fromDate}&toDate=${toDate}&pos=${p}&ean=${e}&pageIndex=${pageIndex}&pageSize=${pageSize}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getReturnReconciliationDataModel = async ({
  storeCode = '',
  billDate = '',
  pos = '',
  ean = '',
  pageIndex = 1,
  pageSize = 10,
  searchTerm = '',
  sortColumn = 'BILL_DATE',
  sortDirection = 'ASC',
  signal
} = {}) => {
  const params = new URLSearchParams();
  if (storeCode) params.append('StoreCode', storeCode);
  if (billDate) params.append('BillDate', billDate);
  if (pos) params.append('Pos', pos);
  if (ean) params.append('Ean', ean);
  if (pageIndex) params.append('PageIndex', pageIndex);
  if (pageSize) params.append('PageSize', pageSize);
  if (searchTerm) params.append('SearchTerm', searchTerm);
  if (sortColumn) params.append('SortColumn', sortColumn);
  if (sortDirection) params.append('SortDirection', sortDirection);

  const response = await axios.get(
    `${API_BASE}/api/Stock/GetReturnReconciliationDataModel?${params.toString()}`,
    {
      headers: getHeaders(),
      signal
    }
  );
  return response.data;
};

export const getReturnPosCounters = async (store = '', fromDate = '', toDate = '', signal) => {
  const storeEnc = encodeURIComponent(store || '');
  const response = await axios.get(`${API_BASE}/api/stock/return/pos-counters?store=${storeEnc}&fromDate=${fromDate}&toDate=${toDate}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getReturnSearchEAN = async (store = '', fromDate = '', toDate = '', searchTerm = '', pos = '', signal) => {
  const storeEnc = encodeURIComponent(store || '');
  const searchEnc = encodeURIComponent(searchTerm || '');
  const posEnc = encodeURIComponent(pos || '');
  const response = await axios.get(`${API_BASE}/api/stock/return-SearchEAN?store=${storeEnc}&fromDate=${fromDate}&toDate=${toDate}&searchTerm=${searchEnc}&pos=${posEnc}`, {
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

export const getReportLiveStock = async (storeCode, stockDate, articleNo, pageIndex, pageSize, sortColumn = 'STOCK_DATE', sortDirection = 'asc', signal) => {
  const store = encodeURIComponent(storeCode || '');
  const date = encodeURIComponent(stockDate || '');
  let url = `${API_BASE}/api/report/live-stock?pageIndex=${pageIndex}&pageSize=${pageSize}&storeName=${store}&stockDate=${date}&sortColumn=${sortColumn || 'STOCK_DATE'}&sortDirection=${sortDirection || 'asc'}`;
  
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

export const getGrcDetails = async (pageIndex, pageSize, grcStatus = '1', storeName = '', huNo = '', fromDate = '', toDate = '', sortColumn = 'GRC_DATE', sortDirection = 'asc', signal) => {
  let url = `${API_BASE}/api/grc-report/details?pageIndex=${pageIndex}&pageSize=${pageSize}&grcStatus=${grcStatus}&storeName=${encodeURIComponent(storeName)}&fromDate=${fromDate}&toDate=${toDate}&sortColumn=${sortColumn || 'GRC_DATE'}&sortDirection=${sortDirection || 'asc'}`;
  if (huNo) {
    url += `&huNo=${encodeURIComponent(huNo)}`;
  }
  const response = await axios.get(url, { headers: getHeaders(), signal });
  return response.data;
};

export const getStoreGrcReport = async (storeCode, fromDate, toDate, pageIndex = 1, pageSize = 100, sortColumn = 'DATE', sortDirection = 'DESC', signal) => {
  const store = encodeURIComponent(storeCode || '');
  const response = await axios.get(`${API_BASE}/api/stock/store-grc-report?storeCode=${store}&fromDate=${fromDate}&toDate=${toDate}&pageIndex=${pageIndex}&pageSize=${pageSize}&sortColumn=${sortColumn || 'DATE'}&sortDirection=${sortDirection || 'DESC'}`, {
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

export const getCycleCountReport = async (pageIndex = 1, pageSize = 100, searchTerm = '', storeCode = '', fromDate = '', toDate = '', sortColumn = 'DATE', sortDirection = 'DESC', signal) => {
  const term = encodeURIComponent(searchTerm || '');
  const store = encodeURIComponent(storeCode || '');
  const response = await axios.get(`${API_BASE}/api/stock/cycle-count-report?pageIndex=${pageIndex}&pageSize=${pageSize}&searchTerm=${term}&storeCode=${store}&fromDate=${fromDate}&toDate=${toDate}&sortColumn=${sortColumn || 'DATE'}&sortDirection=${sortDirection || 'DESC'}`, {
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

// ==============================================================
// DC Validation & Drilldown APIs
// ==============================================================

export const getDCDetails = async ({
  storeName = '',
  fromDate = '',
  toDate = '',
  pageIndex = 1,
  pageSize = 10,
  searchTerm = '',
  sortColumn = 'DATE',
  sortDirection = 'desc'
} = {}, signal) => {
  const params = new URLSearchParams();
  if (storeName) params.append('StoreName', storeName);
  if (fromDate) params.append('FromDate', fromDate);
  if (toDate) params.append('ToDate', toDate);
  params.append('PageIndex', pageIndex);
  params.append('PageSize', pageSize);
  if (searchTerm) params.append('SearchTerm', searchTerm);
  if (sortColumn) params.append('SortColumn', sortColumn);
  if (sortDirection) params.append('SortDirection', sortDirection);

  const response = await axios.get(`${API_BASE}/api/Stock/GetDCDetails?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getHuDetails = async ({
  receivingPlant = '',
  huStatus = '',
  fromDate = '',
  toDate = '',
  huNo = '',
  pageIndex = 1,
  pageSize = 10,
  searchTerm = '',
  sortColumn = 'HU_Number',
  sortDirection = 'asc'
} = {}, signal) => {
  const params = new URLSearchParams();
  if (receivingPlant) params.append('ReceivingPlant', receivingPlant);
  if (huStatus !== undefined && huStatus !== null && huStatus !== '') params.append('HUStatus', huStatus);
  if (fromDate) params.append('FromDate', fromDate);
  if (toDate) params.append('ToDate', toDate);
  if (huNo) params.append('HUNo', huNo);
  params.append('PageIndex', pageIndex);
  params.append('PageSize', pageSize);
  if (searchTerm) params.append('SearchTerm', searchTerm);
  if (sortColumn) params.append('SortColumn', sortColumn);
  if (sortDirection) params.append('SortDirection', sortDirection);

  const response = await axios.get(`${API_BASE}/api/stock/Hu-details?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getHuReportViewDetails = async ({
  searchTerm = '',
  pageIndex = 1,
  pageSize = 10,
  huStatus = '1',
  huNo = '',
  fromDate = '',
  toDate = '',
  refNo = '',
  sortColumn = 'HU_Number',
  sortDirection = 'asc'
} = {}, signal) => {
  const params = new URLSearchParams();
  if (searchTerm) params.append('SearchTerm', searchTerm);
  params.append('PageIndex', pageIndex);
  params.append('PageSize', pageSize);
  if (huStatus !== undefined && huStatus !== null && huStatus !== '') params.append('HUStatus', huStatus);
  if (huNo) params.append('HUNo', huNo);
  if (fromDate) params.append('FromDate', fromDate);
  if (toDate) params.append('ToDate', toDate);
  if (refNo) params.append('RefNo', refNo);
  if (sortColumn) params.append('SortColumn', sortColumn);
  if (sortDirection) params.append('SortDirection', sortDirection);

  const response = await axios.get(`${API_BASE}/api/stock/hu-report-details?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getEncodingStoreData = async ({
  storeName = '',
  fromDate = '',
  toDate = '',
  ean = '',
  articleNo = '',
  userId = null,
  pageIndex = 1,
  pageSize = 10,
  searchTerm = '',
  sortColumn = 'ARTICLE',
  sortDirection = 'asc'
} = {}, signal) => {
  const params = new URLSearchParams();
  if (storeName) params.append('StoreName', storeName);
  if (fromDate) params.append('FromDate', fromDate);
  if (toDate) params.append('ToDate', toDate);
  if (ean) params.append('Ean', ean);
  if (articleNo) params.append('ArticleNo', articleNo);
  params.append('UserId', userId ?? getActiveUserId());
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

export const getEncodingReportDetailsModal = async ({
  storeName = '',
  fromDate = '',
  toDate = '',
  ean = '',
  articleNo = '',
  pageIndex = 1,
  pageSize = 10,
  searchTerm = '',
  sortColumn = 'ARTICLE',
  sortDirection = 'asc'
} = {}, signal) => {
  const params = new URLSearchParams();
  if (storeName) params.append('StoreName', storeName);
  if (fromDate) params.append('FromDate', fromDate);
  if (toDate) params.append('ToDate', toDate);
  if (ean) params.append('Ean', ean);
  if (articleNo) params.append('ArticleNo', articleNo);
  params.append('PageIndex', pageIndex);
  params.append('PageSize', pageSize);
  if (searchTerm) params.append('SearchTerm', searchTerm);
  if (sortColumn) params.append('SortColumn', sortColumn);
  if (sortDirection) params.append('SortDirection', sortDirection);

  const response = await axios.get(`${API_BASE}/api/Stock/GetEncodingReportDetailsModal?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getEncodingStoreSearchEAN = async (storeName = '', fromDate = '', toDate = '', searchTerm = '', signal) => {
  const params = new URLSearchParams();
  if (storeName) params.append('StoreName', storeName);
  if (fromDate) params.append('FromDate', fromDate);
  if (toDate) params.append('ToDate', toDate);
  if (searchTerm) params.append('SearchTerm', searchTerm);

  const response = await axios.get(`${API_BASE}/api/Stock/encoding-store-SearchEAN?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const getEncodingStoreSearchArticle = async (storeName = '', fromDate = '', toDate = '', searchTerm = '', signal) => {
  const params = new URLSearchParams();
  if (storeName) params.append('StoreName', storeName);
  if (fromDate) params.append('FromDate', fromDate);
  if (toDate) params.append('ToDate', toDate);
  if (searchTerm) params.append('SearchTerm', searchTerm);

  const response = await axios.get(`${API_BASE}/api/Stock/encoding-store-SearchArticle?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};

export const searchValidationHuNumbers = async ({
  huStatus = '1',
  receivingPlant = '',
  fromDate = '',
  toDate = '',
  searchTerm = ''
} = {}, signal) => {
  const params = new URLSearchParams();
  if (huStatus !== undefined && huStatus !== null) params.append('huStatus', huStatus);
  if (receivingPlant) params.append('receivingPlant', receivingPlant);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  if (searchTerm) params.append('searchTerm', searchTerm);

  const response = await axios.get(`${API_BASE}/api/stock/hu-numbers/search?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};


// ==============================================================
// Warehouse (DC) Encoding Summary Report
// ==============================================================

export const getWHEncodingDetails = async ({
  searchTerm = '',
  pageIndex = 1,
  pageSize = 10,
  user = '',
  fromDate = '',
  toDate = '',
  sortColumn = 'ENCODE_DATE',
  sortDirection = 'desc'
} = {}, signal) => {
  const params = new URLSearchParams();
  if (searchTerm) params.append('SearchTerm', searchTerm);
  params.append('PageIndex', pageIndex);
  params.append('PageSize', pageSize);
  if (user) {
    if (!isNaN(user) && Number(user) > 0) {
      params.append('User', user);
    } else if (!searchTerm) {
      params.append('SearchTerm', user);
    }
  }
  if (fromDate) params.append('FromDate', fromDate);
  if (toDate) params.append('ToDate', toDate);
  if (sortColumn) params.append('SortColumn', sortColumn);
  if (sortDirection) params.append('SortDirection', sortDirection);

  const response = await axios.get(`${API_BASE}/GetWHEncodingDetails?${params.toString()}`, {
    headers: getHeaders(),
    signal
  });
  return response.data;
};
