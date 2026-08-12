import  { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

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

  useEffect(() => {
    const storedUser = localStorage.getItem('vmm_user');
    if (storedUser) {
      setIsLoggedIn(true);
      try {
        const parsed = JSON.parse(storedUser);
        setLoggedInUser(parsed.userName || parsed.username || parsed.name || 'User');
      } catch (e) {
        setLoggedInUser(storedUser);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const username = userData?.userName || userData?.username || (typeof userData === 'string' ? userData : 'Admin');
    setLoggedInUser(username);
    setIsLoggedIn(true);
    localStorage.setItem('vmm_user', typeof userData === 'string' ? userData : JSON.stringify(userData));
  };

  const logout = () => {
    setLoggedInUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('vmm_user');
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
