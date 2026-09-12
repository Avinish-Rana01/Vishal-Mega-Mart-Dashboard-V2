import { createContext, useContext, useState, useEffect } from 'react';
import { liveStockSocket } from '../services/liveStockSocket';

const AuthContext = createContext();

// Session expires after 1 hour (in milliseconds)
const SESSION_DURATION_MS = 60 * 60 * 1000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
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
          const role = parsed.userType ?? parsed.UserType ?? parsed.role ?? parsed.Role ?? null;
          if (role) setUserRole(role);
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
    const role = userData?.userType ?? userData?.UserType ?? userData?.role ?? userData?.Role ?? null;
    const sections = userData?.allowedSections ?? userData?.AllowedSections ?? [];

    setLoggedInUser(username);
    if (uid) setUserId(uid);
    if (role) setUserRole(role);
    setAllowedSections(Array.isArray(sections) ? sections : []);

    setIsLoggedIn(true);
    sessionStorage.setItem('vmm_user', typeof userData === 'string' ? userData : JSON.stringify(userData));
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
    if (userRole === 'Store Admin') {
      return ['live_stock', 'cycle_count', 'store_validation', 'sale', 'void', 'return'].includes(sectionKey);
    }
    if (userRole === 'Warehouse Admin') {
      return ['dc_validation', 'dc_encoding', 'tag_management', 'vendor_discrepancy'].includes(sectionKey);
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
    allowedSections,
    hasSection,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
