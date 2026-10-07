import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, KeyRound, Shield, Store, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { APP_INFO } from '../../config/constants';
import ChangePasswordModal from '../modals/ChangePasswordModal';
import './Header.css';

export default function Header({ 
  breadcrumb = 'HOME - PAGES - DASHBOARD',
  showBackButton = false,
  onBackClick,
  onMenuClick 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { loggedInUser, userRole, userType, storeName, storeCode, warehouseName, warehouseCode, logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login', { replace: true });
  };

  // Dynamic role directly from database / auth context - NEVER hardcoded!
  const displayRole = (userRole || userType || (() => {
    try {
      const s = sessionStorage.getItem('vmm_user');
      if (s) {
        const p = JSON.parse(s);
        return p.userRole || p.UserRole || p.userType || p.UserType || '';
      }
    } catch (e) {}
    return '';
  })() || 'User').trim();

  // Initials generator
  const getInitials = (name) => {
    if (!name) return 'U';
    const clean = name.trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  // Dynamic role color theme
  const getRoleTheme = (role) => {
    const r = (role || '').toLowerCase();
    if (r.includes('super admin')) {
      return { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', dot: '#6366f1' };
    }
    if (r.includes('store admin')) {
      return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', dot: '#10b981' };
    }
    if (r.includes('store')) {
      return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', dot: '#22c55e' };
    }
    if (r.includes('warehouse admin') || r.includes('wh admin')) {
      return { bg: '#fffbeb', text: '#92400e', border: '#fde68a', dot: '#f59e0b' };
    }
    if (r.includes('warehouse') || r.includes('wh')) {
      return { bg: '#fefce8', text: '#854d0e', border: '#fef08a', dot: '#eab308' };
    }
    if (r.includes('dispatch')) {
      return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' };
    }
    if (r.includes('tag')) {
      return { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff', dot: '#a855f7' };
    }
    return { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0', dot: '#64748b' };
  };

  const roleTheme = getRoleTheme(displayRole);
  const locationLabel = storeName || warehouseName || storeCode || warehouseCode || null;
  const locationType = (storeName || storeCode) ? 'Store' : ((warehouseName || warehouseCode) ? 'Warehouse' : 'Assigned');

  return (
    <header className="vmm-top-header" style={{ position: 'relative', zIndex: 1000 }}>
      <div className="vmm-brand-section">
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
              marginRight: '10px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
        )}
        <div className="vmm-brand-text">
          <h1 className="vmm-brand-title" style={{
            background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            {APP_INFO.TITLE}
          </h1>
          <div className="vmm-breadcrumbs" title={typeof breadcrumb === 'string' ? breadcrumb : undefined}>
            {breadcrumb}
          </div>
        </div>
      </div>

      <div className="vmm-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)' }}>
        <div className="vmm-header-user" ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1001 }}>
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
              {/* Profile Identity Pod */}
              <div className="vmm-user-profile-header">
                <div className="vmm-user-avatar-pod">
                  {getInitials(loggedInUser)}
                  <span className="vmm-status-dot" />
                </div>
                <div className="vmm-user-meta">
                  <span className="vmm-user-greeting">Signed In As</span>
                  <span className="vmm-user-fullname" title={loggedInUser || 'User'}>
                    {loggedInUser || 'User'}
                  </span>
                </div>
              </div>

              {/* Dynamic Role & Location Card */}
              <div className="vmm-user-role-card">
                <div className="vmm-user-role-row">
                  <div className="vmm-user-role-label">
                    <Shield size={13} color="#64748b" />
                    <span>Role</span>
                  </div>
                  <div 
                    className="vmm-user-role-pill" 
                    style={{ 
                      background: roleTheme.bg, 
                      color: roleTheme.text, 
                      border: `1px solid ${roleTheme.border}` 
                    }}
                  >
                    <span className="role-indicator-dot" style={{ background: roleTheme.dot }} />
                    {displayRole}
                  </div>
                </div>

                {locationLabel && (
                  <div className="vmm-user-role-row">
                    <div className="vmm-user-role-label">
                      <Store size={13} color="#64748b" />
                      <span>{locationType}</span>
                    </div>
                    <div 
                      className="vmm-user-role-pill" 
                      style={{ 
                        background: '#f1f5f9', 
                        color: '#334155', 
                        border: '1px solid #e2e8f0',
                        maxWidth: '140px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={locationLabel}
                    >
                      {locationLabel}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Actions */}
              <div className="vmm-profile-actions">
                <button
                  type="button"
                  className="vmm-profile-action-btn"
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsChangePasswordOpen(true);
                  }}
                >
                  <div className="btn-left-content">
                    <KeyRound size={16} color="#2563eb" />
                    <span>Change Password</span>
                  </div>
                  <ChevronRight size={14} color="#94a3b8" />
                </button>

                <div className="vmm-profile-divider" />

                <button
                  type="button"
                  className="vmm-profile-action-btn btn-danger"
                  onClick={handleLogout}
                >
                  <div className="btn-left-content">
                    <LogOut size={16} color="#ef4444" />
                    <span>Sign Out</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        userName={loggedInUser || 'Admin'}
      />
    </header>
  );
}
