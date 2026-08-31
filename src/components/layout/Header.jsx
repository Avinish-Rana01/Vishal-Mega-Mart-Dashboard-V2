import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_INFO } from '../../config/constants';

export default function Header({ 
  breadcrumb = 'HOME - PAGES - DASHBOARD',
  showBackButton = false,
  onBackClick,
  onMenuClick 
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {onMenuClick && (
            <button 
              className="vmm-mobile-menu-btn" 
              onClick={onMenuClick}
              title="Open Menu"
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#1e3a8a', 
                cursor: 'pointer',
                marginRight: '12px',
                padding: 0,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Menu size={26} strokeWidth={2.5} />
            </button>
          )}
          <h1 className="vmm-brand-title" style={{
            background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            {APP_INFO.TITLE}
          </h1>
        </div>
        <div className="vmm-breadcrumbs">{breadcrumb}</div>
      </div>

      <div className="vmm-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)' }}>
        {/*
        <div className="vmm-search-box" style={{
          display: 'flex', alignItems: 'center', background: '#ffffffff', borderRadius: '20px', padding: '6px 12px', flex: '1 1 auto', minWidth: '120px', maxWidth: '250px'
        }}>
          <Search size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input type="text" placeholder="Search..." style={{
            background: 'transparent', border: 'none', outline: 'none', marginLeft: '8px', fontSize: '13px', color: '#334155', width: '100%'
          }} />
        </div>

        <button className="vmm-icon-btn" style={{
          background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', position: 'relative', flexShrink: 0
        }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', width: '8px', height: '8px', borderRadius: '50%'
          }}></span>
        </button>
        */}

        {/* <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>  */}

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
            <div className="vmm-user-dropdown" style={{ width: '260px', padding: '16px', borderRadius: '12px' }}>
              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '50%', background: '#dbeafe', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="18" r="8" fill="#94a3b8"/>
                    <path d="M12 38C12 31.3726 17.3726 26 24 26C30.6274 26 36 31.3726 36 38V40H12V38Z" fill="#64748b"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Welcome</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', textDecoration: 'underline', textTransform: 'uppercase' }}>
                    {loggedInUser || 'Admin'}
                  </div>
                </div>
              </div>

              {/* Role Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontSize: '14px', fontWeight: 600 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  Role -
                </div>
                <div style={{ background: '#f1f5f9', color: '#334155', fontSize: '13px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px' }}>
                  Super Admin
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                className="vmm-dropdown-item"
                onClick={handleLogout}
                style={{ color: '#1e293b', fontSize: '14px', fontWeight: 600, padding: '8px 4px', gap: '8px' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#1e293b'; }}
              >
                <LogOut size={18} strokeWidth={2.5} /> Sign Out
              </button>
            </div>
          )}
      </div>
      </div>
    </header>
  );
}
