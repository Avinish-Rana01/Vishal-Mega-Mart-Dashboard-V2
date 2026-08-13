import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Search, Bell } from 'lucide-react';
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
        <h1 className="vmm-brand-title" style={{
          background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block'
        }}>
          {APP_INFO.TITLE}
        </h1>
        <div className="vmm-breadcrumbs">{breadcrumb}</div>
      </div>

      <div className="vmm-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="vmm-search-box" style={{
          display: 'flex', alignItems: 'center', background: '#ffffffff', borderRadius: '20px', padding: '6px 12px', width: '250px'
        }}>
          <Search size={16} color="#94a3b8" />
          <input type="text" placeholder="Search..." style={{
            background: 'transparent', border: 'none', outline: 'none', marginLeft: '8px', fontSize: '13px', color: '#334155', width: '100%'
          }} />
        </div>

        <button className="vmm-icon-btn" style={{
          background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', position: 'relative'
        }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', width: '8px', height: '8px', borderRadius: '50%'
          }}></span>
        </button>

        <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>

        <div className="vmm-header-user" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showBackButton && (
            <button
              className="btn-back"
              onClick={onBackClick || (() => navigate(-1))}
              title="Go Back"
              style={{
                background: '#f87171', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
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
      </div>
    </header>
  );
}
