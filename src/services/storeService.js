import axios from 'axios';
import { getActiveUserId } from './stockService';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

/**
 * Fetch list of authorized stores for Counter Status dropdown.
 * Replaces legacy bindStore() in Counter_Status.aspx
 */
export const getCounterStatusStores = async (userId = null) => {
  const effectiveUserId = userId || getActiveUserId() || 26;
  try {
    const response = await axios.get(`${API_BASE}/api/Store/counter-status-stores?userId=${effectiveUserId}`, {
      headers: getHeaders()
    });
    if (response.data && response.data.success) {
      return response.data.data || [];
    }
  } catch (err) {
    // Fallback to universal Master/Execute endpoint
    console.warn('Dedicated store endpoint unavailable, falling back to Master/Execute');
  }

  const fallback = await axios.post(`${API_BASE}/api/Master/Execute`, {
    status: 'STORENAME_FOR_COUNTER_STATUS',
    user_ID: effectiveUserId
  }, { headers: getHeaders() });
  return fallback.data?.data || [];
};

/**
 * Fetch real-time counter status cards for a selected store.
 * Replaces legacy CallCardData(store) in Counter_Status.aspx
 */
export const getCounterStatusDetails = async (storeId) => {
  if (!storeId) return [];
  try {
    const response = await axios.get(`${API_BASE}/api/Store/counter-status?storeId=${storeId}`, {
      headers: getHeaders()
    });
    if (response.data && response.data.success) {
      return response.data.data || [];
    }
  } catch (err) {
    // Fallback to universal Master/Execute endpoint
    console.warn('Dedicated counter endpoint unavailable, falling back to Master/Execute');
  }

  const fallback = await axios.post(`${API_BASE}/api/Master/Execute`, {
    status: 'COUNTER_STATUS_DETAILS',
    store_ID: Number(storeId)
  }, { headers: getHeaders() });
  return fallback.data?.data || [];
};
