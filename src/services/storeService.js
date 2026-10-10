import axios from 'axios';
import { getActiveUserId } from './stockService';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const getHeaders = () => {
  const uid = getActiveUserId();
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(uid ? { 'X-User-Id': String(uid) } : {})
  };
};

/**
 * Fetch list of authorized stores for Counter Status dropdown.
 * Replaces legacy bindStore() in Counter_Status.aspx.
 * Attempts the dedicated counter-status-stores endpoint first, then falls back to Master/Execute.
 *
 * @param {number|string|null} [userId=null] - The user ID to query stores for, or defaults to active session user.
 * @returns {Promise<Array<Object>>} Resolves to the array of accessible stores.
 */
export const getCounterStatusStores = async (userId = null) => {
  const effectiveUserId = userId || getActiveUserId();
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

  const fallback = await axios.post(`${API_BASE}/api/Master/Execute?userId=${effectiveUserId}`, {
    status: 'STORENAME_FOR_COUNTER_STATUS',
    user_ID: effectiveUserId,
    userId: effectiveUserId
  }, { headers: getHeaders() });
  return fallback.data?.data || [];
};

/**
 * Fetch real-time counter status cards for a selected store.
 * Replaces legacy CallCardData(store) in Counter_Status.aspx.
 * Attempts the dedicated counter-status endpoint first, then falls back to Master/Execute.
 *
 * @param {number|string} storeId - The ID of the store to fetch counter metrics for.
 * @returns {Promise<Array<Object>>} Resolves to the array of counter detail records.
 */
export const getCounterStatusDetails = async (storeId) => {
  if (!storeId) return [];
  const currentUserId = getActiveUserId();
  try {
    const response = await axios.get(`${API_BASE}/api/Store/counter-status?storeId=${storeId}&userId=${currentUserId}`, {
      headers: getHeaders()
    });
    if (response.data && response.data.success) {
      return response.data.data || [];
    }
  } catch (err) {
    // Fallback to universal Master/Execute endpoint
    console.warn('Dedicated counter endpoint unavailable, falling back to Master/Execute');
  }

  const fallback = await axios.post(`${API_BASE}/api/Master/Execute?userId=${currentUserId}`, {
    status: 'COUNTER_STATUS_DETAILS',
    store_ID: Number(storeId),
    user_ID: currentUserId,
    userId: currentUserId
  }, { headers: getHeaders() });
  return fallback.data?.data || [];
};
