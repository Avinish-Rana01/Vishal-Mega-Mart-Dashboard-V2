import axios from 'axios';
import { getActiveUserId } from './stockService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';
const DEVELOPER_ID = '99999';

const getHeaders = () => {
  const uid = getActiveUserId() || DEVELOPER_ID;
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-User-Id': String(uid)
  };
};

/**
 * Fetch list of all registered devices with joined Store, Warehouse, and Device Type details.
 * Strictly requires Developer account (User ID: 99999).
 */
export const getDeviceList = async (roleId = 4, userId = 99999) => {
  const activeUid = getActiveUserId() || userId || DEVELOPER_ID;
  const response = await axios.get(`${API_BASE}/api/DeviceMaster/List`, {
    params: { roleId, userId: activeUid },
    headers: getHeaders()
  });
  return response.data;
};

/**
 * Fetch all dropdown lists required for Device Registration.
 * Strictly requires Developer account (User ID: 99999).
 */
export const getDeviceDropdowns = async () => {
  const activeUid = getActiveUserId() || DEVELOPER_ID;
  const response = await axios.get(`${API_BASE}/api/DeviceMaster/Dropdowns`, {
    params: { userId: activeUid },
    headers: getHeaders()
  });
  return response.data;
};

/**
 * Insert or Update a device record.
 * Strictly requires Developer account (User ID: 99999).
 */
export const saveDevice = async (payload) => {
  const activeUid = getActiveUserId() || DEVELOPER_ID;
  const response = await axios.post(
    `${API_BASE}/api/DeviceMaster/Save`,
    {
      ...payload,
      User_ID: Number(activeUid) || 99999
    },
    { 
      params: { userId: activeUid },
      headers: getHeaders() 
    }
  );
  return response.data;
};

/**
 * Toggle Active / In-Active status of a device.
 * Strictly requires Developer account (User ID: 99999).
 */
export const toggleDeviceStatus = async (deviceId) => {
  const activeUid = getActiveUserId() || DEVELOPER_ID;
  const response = await axios.post(
    `${API_BASE}/api/DeviceMaster/ToggleStatus`,
    { Device_ID: Number(deviceId) },
    { 
      params: { userId: activeUid },
      headers: getHeaders() 
    }
  );
  return response.data;
};
