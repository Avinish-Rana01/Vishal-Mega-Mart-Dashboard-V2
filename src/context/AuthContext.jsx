import  { createContext, useContext, useState, useEffect } from 'react';

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
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setLoggedInUser(null);
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
    setLoggedInUser(username);
    setIsLoggedIn(true);
    sessionStorage.setItem('vmm_user', typeof userData === 'string' ? userData : JSON.stringify(userData));
    sessionStorage.setItem('vmm_login_time', Date.now().toString());
  };

  if (loading) {
    // Optionally return a loader here while checking auth status
    return <div className="se-pre-con"></div>;
  }

  const value = {
    isLoggedIn,
    loggedInUser,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
