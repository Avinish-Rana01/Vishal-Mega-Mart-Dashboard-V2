import axios from 'axios';
import { getActiveUserId } from './stockService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';

const getHeaders = () => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

/**
 * Helper to dynamically get the active user's role from session storage
 */
export const getActiveUserRole = () => {
  try {
    const raw = sessionStorage.getItem('vmm_user');
    if (raw) {
      const user = JSON.parse(raw);
      return user.userType || user.UserType || user.User_Type || user.role || user.Role || 'Super Admin';
    }
  } catch (e) {
    // fallback
  }
  return 'Super Admin';
};

/**
 * Universal dispatcher for SP_Master calls
 */
export const executeMaster = async (status, payload = {}) => {
  const requestBody = {
    status,
    ...payload
  };

  const response = await axios.post(`${API_BASE}/api/Master/Execute`, requestBody, {
    headers: getHeaders()
  });
  return response.data;
};

/**
 * 1. Fetch available system user roles (Super Admin, Store Admin, etc.)
 */
export const getUserRoles = async () => {
  const res = await executeMaster('BIND_USER_TYPE');
  return res?.data || [];
};

/**
 * 2. Fetch stores dropdown for user assignment
 */
export const getStoreDropdown = async () => {
  const userId = getActiveUserId() || 26;
  const userType = getActiveUserRole() || 'Super Admin';
  const res = await executeMaster('SP_DDL_StoreID', {
    user_ID: Number(userId),
    user_Type: userType
  });
  return res?.data || [];
};

/**
 * 3. Fetch warehouses dropdown for user assignment
 */
export const getWarehouseDropdown = async () => {
  const userId = getActiveUserId() || 26;
  const userType = getActiveUserRole() || 'Super Admin';
  const res = await executeMaster('SP_DDL_WarehouseID', {
    user_ID: Number(userId),
    user_Type: userType
  });
  return res?.data || [];
};

/**
 * 4. Fetch the full users directory
 */
export const getUserList = async () => {
  const userId = getActiveUserId() || 26;
  const userType = getActiveUserRole() || 'Super Admin';
  const res = await executeMaster('SP_Bind_User_Master', {
    user_ID: Number(userId),
    user_Type: userType
  });
  return res?.data || [];
};

/**
 * 5. Create a new user
 */
export const createUser = async ({ userName, password, userType, storeId = 0, whId = 0, emailId = '', isEmailRequired = false }) => {
  const entryBy = getActiveUserId() || 26;
  return await executeMaster('Insert_user_registration', {
    user_Name: userName?.trim(),
    password: password?.trim(),
    user_Type: userType?.trim(),
    store_ID: Number(storeId) || 0,
    wh_ID: Number(whId) || 0,
    email_ID: emailId?.trim() || '',
    is_Email_Required: Boolean(isEmailRequired),
    entry_By: Number(entryBy)
  });
};

/**
 * 6. Update existing user details (password, role, assigned store/warehouse)
 */
export const updateUser = async ({ userId, userName, password, userType, storeId = 0, whId = 0, emailId = '', isEmailRequired = false }) => {
  const modifyBy = getActiveUserId() || 26;
  return await executeMaster('Update_user_registration', {
    user_ID: Number(userId),
    user_Name: userName?.trim(),
    password: password?.trim(),
    user_Type: userType?.trim(),
    store_ID: Number(storeId) || 0,
    wh_ID: Number(whId) || 0,
    email_ID: emailId?.trim() || '',
    is_Email_Required: Boolean(isEmailRequired),
    modify_By: Number(modifyBy)
  });
};

/**
 * 7. Toggle user account status (Active <-> Inactive)
 */
export const toggleUserStatus = async (userId) => {
  return await executeMaster('Delete_user_registration', {
    user_ID: Number(userId)
  });
};

/**
 * 8. Fetch the full Store Master directory
 */
export const getStoreMasterList = async () => {
  const res = await executeMaster('SP_Bind_StoreMaster');
  return res?.data || [];
};

/**
 * 9. Create a new store
 */
export const createStoreMaster = async ({ storeCode, storeName, state = '', city = '', storeManager = '', areaManager = '', zfm = '', lp = '' }) => {
  const entryBy = getActiveUserId() || 26;
  return await executeMaster('Insert_tbl_Store_Master', {
    store_Code: storeCode?.trim(),
    store_Name: storeName?.trim(),
    state: state?.trim() || '',
    city: city?.trim() || '',
    store_Manager: storeManager?.trim() || '',
    area_Manager: areaManager?.trim() || '',
    zfm: zfm?.trim() || '',
    lp: lp?.trim() || '',
    entry_By: Number(entryBy)
  });
};

/**
 * 10. Update existing store details
 */
export const updateStoreMaster = async ({ storeId, storeCode, storeName, state = '', city = '', storeManager = '', areaManager = '', zfm = '', lp = '' }) => {
  const modifyBy = getActiveUserId() || 26;
  return await executeMaster('Update_tbl_Store_Master', {
    store_ID: Number(storeId),
    store_Code: storeCode?.trim(),
    store_Name: storeName?.trim(),
    state: state?.trim() || '',
    city: city?.trim() || '',
    store_Manager: storeManager?.trim() || '',
    area_Manager: areaManager?.trim() || '',
    zfm: zfm?.trim() || '',
    lp: lp?.trim() || '',
    modify_By: Number(modifyBy)
  });
};

/**
 * 11. Toggle store operational status (Active <-> In-Active)
 */
export const toggleStoreStatus = async (storeId) => {
  return await executeMaster('Delete_tbl_Store_Master', {
    store_ID: Number(storeId)
  });
};

/**
 * 12. Fetch the full Warehouse Master directory
 */
export const getWarehouseMasterList = async () => {
  const res = await executeMaster('SP_Bind_warehouseMaster');
  return res?.data || [];
};

/**
 * 13. Create a new warehouse
 */
export const createWarehouseMaster = async ({ whCode, whName, whAddress = '' }) => {
  const entryBy = getActiveUserId() || 26;
  return await executeMaster('Insert_tbl_Warehouse_Master', {
    wh_Code: whCode?.trim(),
    wh_Name: whName?.trim(),
    wh_Address: whAddress?.trim(),
    entry_By: Number(entryBy)
  });
};

/**
 * 14. Update existing warehouse details
 */
export const updateWarehouseMaster = async ({ whId, whCode, whName, whAddress = '' }) => {
  const modifyBy = getActiveUserId() || 26;
  return await executeMaster('Update_tbl_warehouse_Master', {
    wh_ID: Number(whId),
    wh_Code: whCode?.trim(),
    wh_Name: whName?.trim(),
    wh_Address: whAddress?.trim(),
    modify_By: Number(modifyBy)
  });
};

/**
 * 15. Toggle warehouse operational status (Active <-> In-Active)
 */
export const toggleWarehouseStatus = async (whId) => {
  return await executeMaster('Delete_tbl_warehouse_Master', {
    wh_ID: Number(whId)
  });
};

/**
 * 16. Fetch the full Floor Master directory
 */
export const getFloorMasterList = async () => {
  const res = await executeMaster('SP_Bind_FloorMaster');
  return res?.data || [];
};

/**
 * 17. Create a new store floor
 */
export const createFloorMaster = async ({ storeId, floorName }) => {
  const entryBy = getActiveUserId() || 26;
  return await executeMaster('Insert_tbl_Store_Floor_Mst', {
    store_ID: Number(storeId),
    store_Floor: floorName?.trim(),
    entry_By: Number(entryBy)
  });
};

/**
 * 18. Update existing floor details
 */
export const updateFloorMaster = async ({ floorId, storeId, floorName }) => {
  const modifyBy = getActiveUserId() || 26;
  return await executeMaster('Update_tbl_Store_Floor_Mst', {
    store_Floor_ID: Number(floorId),
    store_ID: Number(storeId),
    store_Floor: floorName?.trim(),
    modify_By: Number(modifyBy)
  });
};

/**
 * 19. Toggle floor operational status (Active <-> In-Active)
 */
export const toggleFloorStatus = async (floorId) => {
  return await executeMaster('Delete_tbl_Store_Floor_Mst', {
    store_Floor_ID: Number(floorId)
  });
};


