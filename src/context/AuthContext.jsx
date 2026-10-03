import { createContext, useContext, useState, useEffect } from 'react';
import { liveStockSocket } from '../services/liveStockSocket';

const AuthContext = createContext();

// Session expires after 1 hour (in milliseconds)
const SESSION_DURATION_MS = 60 * 60 * 1000;

/**
 * Custom hook to access authentication context state and dispatchers.
 *
 * @throws {Error} If consumed outside of an <AuthProvider> tree.
 * @returns {Object} The current authentication context value.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Context Provider that manages user session persistence,
 * socket disconnect on logout, and role-based permissions across the application.
 *
 * @param {Object} props - React component props.
 * @param {React.ReactNode} props.children - Child elements wrapped by the provider.
 */
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [storeName, setStoreName] = useState(null);
  const [storeCode, setStoreCode] = useState(null);
  const [warehouseName, setWarehouseName] = useState(null);
  const [warehouseCode, setWarehouseCode] = useState(null);
  const [allowedSections, setAllowedSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    try {
      liveStockSocket.disconnect();
    } catch (e) {
      // ignore
    }
    setLoggedInUser(null);
    setUserId(null);
    setUserRole(null);
    setStoreName(null);
    setStoreCode(null);
    setWarehouseName(null);
    setWarehouseCode(null);
    setAllowedSections([]);
    setIsLoggedIn(false);
    sessionStorage.removeItem('vmm_user');
    sessionStorage.removeItem('vmm_login_time');
    // Also clear any legacy localStorage keys
    localStorage.removeItem('vmm_user');
    localStorage.removeItem('vmm_login_time');
  };

  useEffect(() => {
    // Clear any lingering localStorage from previous versions
    localStorage.removeItem('vmm_user');
    localStorage.removeItem('vmm_login_time');

    const storedUser = sessionStorage.getItem('vmm_user');
    const loginTime = sessionStorage.getItem('vmm_login_time');

    if (storedUser && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime, 10);
      if (elapsed < SESSION_DURATION_MS) {
        setIsLoggedIn(true);
        try {
          const parsed = JSON.parse(storedUser);
          setLoggedInUser(parsed.userName || parsed.username || parsed.name || 'User');
          const uid = parsed.userID ?? parsed.userId ?? parsed.UserID ?? parsed.User_Id ?? parsed.USER_ID ?? parsed.user_id ?? parsed.id ?? parsed.Id;
          if (uid) setUserId(uid);
          const role = parsed.userRole ?? parsed.UserRole ?? parsed.userType ?? parsed.UserType ?? parsed.User_Type ?? parsed.role ?? parsed.Role ?? null;
          if (role) setUserRole(role);
          setStoreName(parsed.storeName ?? parsed.StoreName ?? null);
          setStoreCode(parsed.storeCode ?? parsed.StoreCode ?? null);
          setWarehouseName(parsed.warehouseName ?? parsed.WarehouseName ?? null);
          setWarehouseCode(parsed.warehouseCode ?? parsed.WarehouseCode ?? null);
          const sections = parsed.allowedSections ?? parsed.AllowedSections ?? [];
          setAllowedSections(Array.isArray(sections) ? sections : []);
        } catch (e) {
          setLoggedInUser(storedUser);
        }
      } else {
        // Session expired (older than 1 hour)
        logout();
      }
    } else {
      // Missing timestamp or no stored session
      logout();
    }
    setLoading(false);
  }, []);

  // Periodic check while the page is actively kept open
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkExpiration = () => {
      const loginTime = sessionStorage.getItem('vmm_login_time');
      if (!loginTime || (Date.now() - parseInt(loginTime, 10)) >= SESSION_DURATION_MS) {
        logout();
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkExpiration, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const login = (userData) => {
    const username = userData?.userName || userData?.username || (typeof userData === 'string' ? userData : 'Admin');
    const uid = userData?.userID ?? userData?.userId ?? userData?.UserID ?? userData?.User_Id ?? userData?.USER_ID ?? userData?.user_id ?? userData?.id ?? userData?.Id;
    const role = userData?.userRole ?? userData?.UserRole ?? userData?.userType ?? userData?.UserType ?? userData?.User_Type ?? userData?.role ?? userData?.Role ?? null;
    const sName = userData?.storeName ?? userData?.StoreName ?? null;
    const sCode = userData?.storeCode ?? userData?.StoreCode ?? null;
    const whName = userData?.warehouseName ?? userData?.WarehouseName ?? null;
    const whCode = userData?.warehouseCode ?? userData?.WarehouseCode ?? null;
    const sections = userData?.allowedSections ?? userData?.AllowedSections ?? [];

    setLoggedInUser(username);
    if (uid) setUserId(uid);
    if (role) setUserRole(role);
    setStoreName(sName);
    setStoreCode(sCode);
    setWarehouseName(whName);
    setWarehouseCode(whCode);
    setAllowedSections(Array.isArray(sections) ? sections : []);

    setIsLoggedIn(true);
    const sessionPayload = typeof userData === 'object' && userData !== null
      ? { ...userData, userRole: role, userType: role }
      : userData;
    sessionStorage.setItem('vmm_user', typeof sessionPayload === 'string' ? sessionPayload : JSON.stringify(sessionPayload));
    sessionStorage.setItem('vmm_login_time', Date.now().toString());
  };

  const hasSection = (sectionKey) => {
    if (!sectionKey) return false;
    // Super Admin has access to all sections
    if (userRole === 'Super Admin') return true;
    if (Array.isArray(allowedSections) && allowedSections.length > 0) {
      return allowedSections.includes(sectionKey);
    }
    // Fallback based on userRole if allowedSections array is not yet present
    const role = (userRole || '').trim();
    if (role === 'Store Admin') {
      return ['live_stock', 'cycle_count', 'store_validation', 'sale', 'void', 'return', 'store_counter_status', 'get_sap_stock_take', 'user_registration'].includes(sectionKey);
    }
    if (role === 'Store User' || role === 'Store') {
      return ['live_stock', 'cycle_count', 'store_validation', 'sale', 'void', 'return', 'store_counter_status'].includes(sectionKey);
    }
    if (role === 'Warehouse Admin' || role === 'WH Admin') {
      return ['dc_validation', 'dc_encoding', 'tag_management', 'vendor_discrepancy', 'user_registration'].includes(sectionKey);
    }
    if (role === 'Warehouse User' || role === 'Warehouse' || role === 'WH' || role === 'WH User') {
      return ['dc_validation', 'dc_encoding'].includes(sectionKey);
    }
    if (role === 'Dispatch Admin') {
      return ['dc_validation', 'dc_encoding', 'tag_management'].includes(sectionKey);
    }
    if (role === 'Tag Admin') {
      return ['tag_management', 'cycle_count', 'tag_cleaning'].includes(sectionKey);
    }
    return false;
  };

  if (loading) {
    // Optionally return a loader here while checking auth status
    return <div className="se-pre-con"></div>;
  }

  const value = {
    isLoggedIn,
    loggedInUser,
    userId,
    userRole,
    userType: userRole,
    storeName,
    storeCode,
    warehouseName,
    warehouseCode,
    allowedSections,
    hasSection,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
