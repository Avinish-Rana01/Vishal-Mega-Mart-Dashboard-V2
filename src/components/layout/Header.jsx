import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_INFO } from '../../config/constants';

export default function Header({ 
  breadcrumb = 'HOME - PAGES - DASHBOARD',
  showBackButton = false,
  onBackClick 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { loggedInUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="vmm-top-header">
      <div className="vmm-brand-section">
        <h1 className="vmm-brand-title">{APP_INFO.TITLE}</h1>
        <div className="vmm-breadcrumbs">{breadcrumb}</div>
      </div>

      <div className="vmm-header-user">
        {showBackButton && (
          <button
            className="btn-back"
            onClick={onBackClick || (() => navigate(-1))}
            title="Go Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </button>
        )}
        <button
          className="vmm-user-btn"
          onClick={() => setShowUserMenu(!showUserMenu)}
          title="User Account"
        >
          <User size={18} />
        </button>

        {showUserMenu && (
          <div className="vmm-user-dropdown">
            <div className="vmm-user-info">
              <div className="vmm-user-name">{loggedInUser || 'Admin User'}</div>
              <div className="vmm-user-role">Administrator</div>
            </div>
            <button
              className="vmm-dropdown-item"
              onClick={handleLogout}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
