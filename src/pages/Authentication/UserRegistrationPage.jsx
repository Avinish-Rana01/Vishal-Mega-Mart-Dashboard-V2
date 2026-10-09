import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, EyeOff, Power, Crown, UserPlus, Check, Bell, BellRing, BellOff } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import ConfirmModal from '../../components/common/ConfirmModal';
import ToastNotification from '../../components/common/ToastNotification';
import { SearchButton, ClearButton } from '../../components/common/ReportActionButton';
import { 
  getUserRoles, 
  getStoreDropdown, 
  getWarehouseDropdown, 
  getUserList, 
  createUser, 
  updateUser, 
  toggleUserStatus 
} from '../../services/masterAuthService';
import '../Report/common-reports.css';
import './Authentication.css';

export default function UserRegistrationPage() {
  const navigate = useNavigate();

  // Dropdown options
  const [roleOptions, setRoleOptions] = useState([]);
  const [storeOptions, setStoreOptions] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);

  // Form State
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('');
  const [storeId, setStoreId] = useState('');
  const [whId, setWhId] = useState('');
  const [emailId, setEmailId] = useState('');
  const [isEmailRequired, setIsEmailRequired] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editTriggerAnim, setEditTriggerAnim] = useState(false);
  const usernameInputRef = useRef(null);

  // Table Data & Loading State
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Search, Sorting & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('User_ID');
  const [sortDirection, setSortDirection] = useState('asc');

  // Feedback Notification Banner
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }
  const [bottomToast, setBottomToast] = useState(null); // Mobile downside toast: { message: string, icon: JSX }

  // Confirm Modal Dialog State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    user: null,
    isActivating: false,
    isLoading: false
  });

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  // Auto-dismiss mobile bottom toast after 1.8 seconds (snappy feedback)
  useEffect(() => {
    if (!bottomToast) return;
    const timer = setTimeout(() => setBottomToast(null), 1800);
    return () => clearTimeout(timer);
  }, [bottomToast]);

  // Determine role-based conditional dropdown visibility
  // Store Admin is a roving/general administrator and does not require a store assignment during user registration.
  // Only regular store staff (Store User / Store) require an assigned store.
  const isStoreRole = useMemo(() => {
    if (!userType) return false;
    const lower = userType.toLowerCase().trim();
    if (lower === 'store admin' || lower.includes('store admin')) return false;
    return lower === 'store' || lower.includes('store');
  }, [userType]);

  const isWarehouseRole = useMemo(() => {
    if (!userType) return false;
    const lower = userType.toLowerCase();
    return lower.includes('warehouse');
  }, [userType]);

  // Notification toggle requires an email address
  const hasEmail = Boolean(emailId && emailId.trim());

  // Automatically reset notifications if email is cleared
  useEffect(() => {
    if (!hasEmail && isEmailRequired) {
      setIsEmailRequired(false);
    }
  }, [hasEmail, isEmailRequired]);

  // Load dropdown lists on mount
  const loadDropdowns = useCallback(async () => {
    try {
      const [rolesData, storesData, whData] = await Promise.all([
        getUserRoles().catch(() => []),
        getStoreDropdown().catch(() => []),
        getWarehouseDropdown().catch(() => [])
      ]);

      if (Array.isArray(rolesData)) {
        setRoleOptions(
          rolesData.map(r => {
            const val = r.User_Type ?? r.user_Type ?? r.userType ?? String(r);
            return { value: val, text: val };
          })
        );
      }

      if (Array.isArray(storesData)) {
        setStoreOptions(
          storesData.map(s => ({
            value: s.Store_ID ?? s.store_ID ?? s.id,
            text: s.Store_Name ?? s.store_Name ?? `Store ${s.Store_ID ?? s.store_ID}`
          }))
        );
      }

      if (Array.isArray(whData)) {
        setWarehouseOptions(
          whData.map(w => ({
            value: w.WH_ID ?? w.wh_ID ?? w.id,
            text: w.Wh_Name ?? w.wh_Name ?? `Warehouse ${w.WH_ID ?? w.wh_ID}`
          }))
        );
      }
    } catch (err) {
      console.error('Error loading dropdown options:', err);
    }
  }, []);

  // Fetch full users list
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUserList();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setAlert({
        type: 'error',
        message: 'Failed to load user directory. Please ensure the backend is running.'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDropdowns();
    fetchUsers();
  }, [loadDropdowns, fetchUsers]);

  // Keyboard shortcut: Escape cancels edit mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isEditing) {
        resetForm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]);

  // Sync edit mode state to document.body for sidebar green gradient transition
  useEffect(() => {
    if (isEditing) {
      document.body.classList.add('vmm-edit-mode-active');
    } else {
      document.body.classList.remove('vmm-edit-mode-active');
    }
    return () => {
      document.body.classList.remove('vmm-edit-mode-active');
    };
  }, [isEditing]);

  // Reset / Clear form
  const resetForm = () => {
    setUserName('');
    setPassword('');
    setUserType('');
    setStoreId('');
    setWhId('');
    setEmailId('');
    setIsEmailRequired(false);
    setIsEditing(false);
    setEditingUserId(null);
    setEditTriggerAnim(false);
    setBottomToast(null);
  };

  // Toggle notification updates with mobile downside toast alert
  const handleToggleNotification = () => {
    if (!hasEmail) return;
    const nextState = !isEmailRequired;
    setIsEmailRequired(nextState);

    const cleanEmail = emailId.trim();
    if (nextState) {
      setBottomToast({
        message: `${cleanEmail} now receives email updates`,
        icon: <BellRing size={15} color="#F59E0B" />
      });
    } else {
      setBottomToast({
        message: `Email updates turned off for ${cleanEmail}`,
        icon: <BellOff size={15} color="#94A3B8" />
      });
    }
  };

  // Populate form for Edit Mode
  const handleEditClick = (user) => {
    setIsEditing(true);
    setEditingUserId(user.User_ID ?? user.user_ID ?? user.id);
    setUserName(user.User_Name ?? user.user_Name ?? '');
    setPassword(user.Password ?? user.password ?? '');
    setUserType(user.User_Type ?? user.user_Type ?? '');
    setEmailId(user.Email_ID ?? user.email_ID ?? user.emailId ?? '');
    const rawReq = user.Is_Email_Required ?? user.is_Email_Required ?? user.isEmailRequired;
    setIsEmailRequired(rawReq === true || rawReq === 1 || String(rawReq).toLowerCase() === 'true' || String(rawReq) === '1');

    const userStoreId = user.Store_ID ?? user.store_ID;
    if (userStoreId && Number(userStoreId) > 0) {
      setStoreId(userStoreId);
    } else if (user.Store_Name && user.Store_Name !== 'NA') {
      const match = storeOptions.find(s => s.text === user.Store_Name);
      setStoreId(match ? match.value : '');
    } else {
      setStoreId('');
    }

    if (user.Warehouse_Name && user.Warehouse_Name !== 'NA') {
      const match = warehouseOptions.find(w => w.text === user.Warehouse_Name);
      setWhId(match ? match.value : '');
    } else {
      setWhId('');
    }

    // Trigger snappy entrance shake animation
    setEditTriggerAnim(true);
    setTimeout(() => setEditTriggerAnim(false), 550);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!userName.trim()) {
      setAlert({ type: 'error', message: 'Username is required.' });
      return;
    }
    if (!password.trim()) {
      setAlert({ type: 'error', message: 'Password is required.' });
      return;
    }
    if (!userType) {
      setAlert({ type: 'error', message: 'Please select a User Type / Role.' });
      return;
    }
    if (isStoreRole && !storeId) {
      setAlert({ type: 'error', message: 'Please select an assigned store for Store users.' });
      return;
    }
    if (isWarehouseRole && !whId) {
      setAlert({ type: 'error', message: 'Please select an assigned warehouse for Warehouse users.' });
      return;
    }
    if (isEmailRequired && !emailId.trim()) {
      setAlert({ type: 'error', message: 'Email ID is required when "Recieved E-mail Updates" is enabled.' });
      return;
    }
    if (emailId.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailId.trim())) {
        setAlert({ type: 'error', message: 'Please enter a valid email address.' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let res;
      if (isEditing) {
        res = await updateUser({
          userId: editingUserId,
          userName: userName.trim(),
          password: password.trim(),
          userType: userType.trim(),
          storeId: isStoreRole ? storeId : 0,
          whId: isWarehouseRole ? whId : 0,
          emailId: emailId.trim(),
          isEmailRequired
        });
      } else {
        res = await createUser({
          userName: userName.trim(),
          password: password.trim(),
          userType: userType.trim(),
          storeId: isStoreRole ? storeId : 0,
          whId: isWarehouseRole ? whId : 0,
          emailId: emailId.trim(),
          isEmailRequired
        });
      }

      if (res && res.success !== false) {
        setAlert({
          type: 'success',
          message: res.message || (isEditing ? 'User updated successfully!' : 'User created successfully!')
        });
        resetForm();
        fetchUsers();
      } else {
        setAlert({
          type: 'error',
          message: res?.message || 'Operation failed. Please verify credentials or uniqueness.'
        });
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'An error occurred while saving the user.';
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modern Confirm Modal (Activate / Deactivate)
  const handleToggleStatus = (user) => {
    const currentStatus = user.Status ?? user.status ?? '';
    const isActive = String(currentStatus).toLowerCase().includes('active') && !String(currentStatus).toLowerCase().includes('in');
    setConfirmModal({
      isOpen: true,
      user,
      isActivating: !isActive,
      isLoading: false
    });
  };

  // Execute status toggle after user confirms in modern modal
  const handleConfirmToggle = async () => {
    if (!confirmModal.user) return;
    const user = confirmModal.user;
    const userId = user.User_ID ?? user.user_ID ?? user.id;
    const name = user.User_Name ?? user.user_Name ?? `User ${userId}`;

    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await toggleUserStatus(userId);
      if (res && res.success !== false) {
        setAlert({
          type: 'success',
          message: res.message || `User "${name}" status toggled successfully.`
        });
        fetchUsers();
      } else {
        setAlert({
          type: 'error',
          message: res?.message || `Failed to toggle status for user "${name}".`
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to toggle user status.'
      });
    } finally {
      setConfirmModal({ isOpen: false, user: null, isActivating: false, isLoading: false });
    }
  };

  // Client-side search and sorting
  const sortedAndFilteredUsers = useMemo(() => {
    let list = [...users];

    // Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(u => {
        const name = String(u.User_Name ?? u.user_Name ?? '').toLowerCase();
        const role = String(u.User_Type ?? u.user_Type ?? '').toLowerCase();
        const store = String(u.Store_Name ?? u.store_Name ?? '').toLowerCase();
        const wh = String(u.Warehouse_Name ?? u.warehouse_Name ?? '').toLowerCase();
        const email = String(u.Email_ID ?? u.email_ID ?? u.emailId ?? '').toLowerCase();
        const id = String(u.User_ID ?? u.user_ID ?? '');
        return name.includes(term) || role.includes(term) || store.includes(term) || wh.includes(term) || email.includes(term) || id.includes(term);
      });
    }

    // Sort
    if (sortColumn) {
      list.sort((a, b) => {
        let valA = a[sortColumn] ?? '';
        let valB = b[sortColumn] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'desc' ? valB - valA : valA - valB;
        }
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        if (valA < valB) return sortDirection === 'desc' ? 1 : -1;
        if (valA > valB) return sortDirection === 'desc' ? -1 : 1;
        return 0;
      });
    }

    return list;
  }, [users, searchTerm, sortColumn, sortDirection]);

  // Paginated slice for current page
  const paginatedData = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return sortedAndFilteredUsers.slice(start, start + pageSize);
  }, [sortedAndFilteredUsers, pageIndex, pageSize]);

  // Clean formatted data for Excel Export (N/A for missing cells)
  const exportFormattedUsers = useMemo(() => {
    return sortedAndFilteredUsers.map(u => ({
      ...u,
      User_Name: u.User_Name || 'N/A',
      User_Type: u.User_Type || 'N/A',
      Store_Name: (!u.Store_Name || u.Store_Name === 'NA' || u.Store_Name === '—') ? 'N/A' : u.Store_Name,
      Warehouse_Name: (!u.Warehouse_Name || u.Warehouse_Name === 'NA' || u.Warehouse_Name === '—') ? 'N/A' : u.Warehouse_Name,
      Email_ID: u.Email_ID || 'N/A',
      Is_Email_Required: (u.Is_Email_Required === true || u.Is_Email_Required === 1 || u.Is_Email_Required === 'True') ? 'Yes' : 'No',
      Status: u.Status || 'Active'
    }));
  }, [sortedAndFilteredUsers]);

  // Table Columns Definition
  const columns = useMemo(() => [
    {
      key: 'User_ID',
      label: 'USER ID',
      align: 'center',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: '#334155' }}>
          {val ?? row?.User_ID ?? row?.user_ID}
        </span>
      )
    },
    {
      key: 'User_Name',
      label: 'USERNAME',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>
          {val ?? row?.User_Name ?? row?.user_Name ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'User_Type',
      label: 'ROLE / USER TYPE',
      sortable: true,
      render: (val, row) => {
        const role = String(val ?? row?.User_Type ?? row?.user_Type ?? 'N/A');
        const isSuperAdmin = /super\s*admin/i.test(role);
        const isAdmin = role.toLowerCase().includes('admin');

        if (isSuperAdmin) {
          return (
            <span 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontWeight: 700, 
                color: '#d97706',
                letterSpacing: '0.2px' 
              }}
            >
              <Crown 
                size={15} 
                color="#d97706" 
                fill="#f59e0b" 
                style={{ 
                  filter: 'drop-shadow(0 1px 2px rgba(217, 119, 6, 0.4))',
                  flexShrink: 0 
                }} 
              />
              <span 
                style={{ 
                  background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 1px 1px rgba(245, 158, 11, 0.25))'
                }}
              >
                {role}
              </span>
            </span>
          );
        }

        return (
          <span style={{ fontWeight: 600, color: isAdmin ? '#3B82F6' : '#475569' }}>
            {role}
          </span>
        );
      }
    },
    {
      key: 'Store_Name',
      label: 'ASSIGNED STORE',
      sortable: true,
      render: (val, row) => {
        const s = val ?? row?.Store_Name ?? row?.store_Name;
        return (!s || s === 'NA' || s === '—') ? (
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>N/A</span>
        ) : (
          <span style={{ fontWeight: 500, color: '#334155' }}>{s}</span>
        );
      }
    },
    {
      key: 'Warehouse_Name',
      label: 'ASSIGNED WAREHOUSE',
      sortable: true,
      render: (val, row) => {
        const w = val ?? row?.Warehouse_Name ?? row?.warehouse_Name;
        return (!w || w === 'NA' || w === '—') ? (
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>N/A</span>
        ) : (
          <span style={{ fontWeight: 500, color: '#334155' }}>{w}</span>
        );
      }
    },
    {
      key: 'Email_ID',
      label: 'EMAIL ID',
      sortable: true,
      render: (val, row) => {
        const email = val ?? row?.Email_ID ?? row?.email_ID ?? row?.emailId;
        return (!email || email === '—') ? (
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>N/A</span>
        ) : (
          <span style={{ fontWeight: 500, color: '#334155' }}>{email}</span>
        );
      }
    },
    {
      key: 'Is_Email_Required',
      label: 'RECEIVES UPDATES',
      align: 'center',
      width: '130px',
      sortable: true,
      render: (val, row) => {
        const rawVal = val ?? row?.Is_Email_Required ?? row?.is_Email_Required ?? row?.isEmailRequired;
        const isReq = rawVal === true || rawVal === 1 || String(rawVal).toLowerCase() === 'true' || String(rawVal).toLowerCase() === 'yes';
        return isReq ? (
          <span className="vmm-bell-table-badge active" title="Receives Updates Active">
            <BellRing size={11} className="vmm-bell-icon active" />
            <span>Active</span>
          </span>
        ) : (
          <span className="vmm-bell-table-badge inactive" title="Receives Updates Inactive">
            <BellOff size={11} />
            <span>Off</span>
          </span>
        );
      }
    },
    {
      key: 'Status',
      label: 'STATUS',
      align: 'center',
      width: '110px',
      sortable: true,
      render: (val, row) => {
        const statusStr = String(val ?? row?.Status ?? row?.status ?? 'Active');
        const isActive = statusStr.toLowerCase().includes('active') && !statusStr.toLowerCase().includes('in');
        return (
          <span className={`vmm-status-pill ${isActive ? 'active' : 'inactive'}`}>
            <span className="vmm-status-dot" />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'center',
      width: '100px',
      sortable: false,
      render: (_, row) => {
        const statusStr = String(row?.Status ?? row?.status ?? 'Active');
        const isActive = statusStr.toLowerCase().includes('active') && !statusStr.toLowerCase().includes('in');
        return (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
            <button
              type="button"
              className="vmm-table-action-btn edit-icon"
              onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}
              title="Edit User"
              aria-label="Edit User"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              className={`vmm-ios-toggle ${isActive ? 'active' : 'inactive'}`}
              onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
              title={isActive ? 'Deactivate User' : 'Activate User'}
              aria-label={isActive ? 'Deactivate User' : 'Activate User'}
            >
              <span className="vmm-ios-toggle-knob" />
            </button>
          </div>
        );
      }
    }
  ], []);

  const handleSortChange = (colKey, dir) => {
    setSortColumn(colKey);
    setSortDirection(dir);
    setPageIndex(1);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
    setPageIndex(1);
  };

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - AUTHENTICATION - <span className="active">USER REGISTRATION</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      {/* Floating Alert Notification Toast */}
      <ToastNotification alert={alert} onClose={() => setAlert(null)} />

      {/* Mobile Downside Toast (Snackbar) rendered via Portal directly to body */}
      {bottomToast && typeof document !== 'undefined' && createPortal(
        <div className="vmm-mobile-toast" role="status" aria-live="polite">
          {bottomToast.icon}
          <span>{bottomToast.message}</span>
        </div>,
        document.body
      )}

      {/* Top Search / Form Card (VMM Standard Design) */}
      <div className={`report-search-card ${editTriggerAnim ? 'vmm-edit-shake-anim' : ''}`}>
        <div className={`report-search-header ${isEditing ? 'vmm-edit-mode-header' : ''}`}>
          <span>
            {isEditing 
              ? `EDITING USER ${editingUserId} - PRESS ESC TO EXIT EDIT MODE` 
              : 'USER REGISTRATION - NOTE : FIELDS MARKED WITH (*) ARE REQUIRED'}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="report-search-body">
            {/* 1. User Type */}
            <div className="search-field">
              <label>User Type *</label>
              <SearchableDropdown
                options={roleOptions}
                value={userType}
                onChange={setUserType}
                placeholder="Select User Role"
              />
            </div>

            {/* 2. Conditional Store Dropdown */}
            {isStoreRole && (
              <div className="search-field">
                <label>Assigned Store *</label>
                <SearchableDropdown
                  options={storeOptions}
                  value={storeId}
                  onChange={setStoreId}
                  placeholder="Select Store"
                />
              </div>
            )}

            {/* 2b. Conditional Warehouse Dropdown */}
            {isWarehouseRole && (
              <div className="search-field">
                <label>Assigned Warehouse *</label>
                <SearchableDropdown
                  options={warehouseOptions}
                  value={whId}
                  onChange={setWhId}
                  placeholder="Select Warehouse"
                />
              </div>
            )}

            {/* 3. Username */}
            <div className="search-field">
              <label>Username *</label>
              <input
                ref={usernameInputRef}
                type="text"
                className="vmm-auth-input"
                placeholder="Enter username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            {/* 4. Password */}
            <div className="search-field">
              <label>Password *</label>
              <div className="vmm-auth-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="vmm-auth-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="vmm-password-eye-btn"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex="-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* 5. Email ID */}
            <div className="search-field">
              <label>Email ID {isEmailRequired && '*'}</label>
              <input
                type="email"
                className="vmm-auth-input"
                placeholder="Enter email address"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            {/* 6. Receives Updates Notification & Action Buttons (Single line on mobile) */}
            <div className="vmm-bottom-actions-row">
              <div className="search-field vmm-notif-search-field">
                <label>Notifications</label>
                <button
                  type="button"
                  className={`vmm-notification-toggle-btn ${isEmailRequired ? 'active' : ''}`}
                  onClick={handleToggleNotification}
                  disabled={isSubmitting || !hasEmail}
                  title={
                    !hasEmail
                      ? 'Enter an email address to enable notifications'
                      : (isEmailRequired ? 'Click to disable email updates' : 'Click to enable email updates')
                  }
                  aria-pressed={isEmailRequired}
                >
                  {isEmailRequired ? (
                    <BellRing size={13} className="vmm-bell-icon active" />
                  ) : (
                    <Bell size={13} className="vmm-bell-icon" />
                  )}
                  <span>Recieved E-mail Updates</span>
                  {isEmailRequired && <span className="vmm-bell-live-dot" />}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="search-buttons">
                <SearchButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  label={isEditing ? 'Update User' : 'Create User'}
                  icon={isEditing ? <Edit2 size={13} /> : <UserPlus size={13} />}
                  className={isEditing ? 'btn-edit-mode' : ''}
                />
                <ClearButton
                  onClick={resetForm}
                  disabled={isSubmitting}
                  label={isEditing ? 'Cancel Edit' : 'Reset'}
                />
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Standard VMM ReportDataTableCard */}
      <div >
        <ReportDataTableCard
          columns={columns}
          data={paginatedData}
          exportData={exportFormattedUsers}
          isLoading={isLoading}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageIndex(1);
          }}
          totalRecords={sortedAndFilteredUsers.length}
          exportFileName="User_Registration_Directory.xlsx"
          searchPlaceholder="Search by username, role, store..."
          searchValue={searchTerm}
          onSearch={handleSearchChange}
          onSortChange={handleSortChange}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          getRowClassName={(row) => {
            const rowId = row?.User_ID ?? row?.user_ID ?? row?.id;
            const isCurrentlyEditing = isEditing && Number(editingUserId) === Number(rowId);
            const role = String(row?.User_Type ?? row?.user_Type ?? '');
            const isSuperAdmin = /super\s*admin/i.test(role);

            const classes = [];
            if (isSuperAdmin) classes.push('super-admin-row');
            if (isCurrentlyEditing) classes.push('vmm-row-currently-editing');
            return classes.join(' ');
          }}
        />
      </div>

      {/* Modern Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null, isActivating: false, isLoading: false })}
        onConfirm={handleConfirmToggle}
        title={confirmModal.isActivating ? 'Activate User Account' : 'Deactivate User Account'}
        message={
          <div>
            Are you sure you want to {confirmModal.isActivating ? 'activate' : 'deactivate'} user{' '}
            <strong style={{ color: '#0f172a' }}>"{confirmModal.user?.User_Name ?? confirmModal.user?.user_Name}"</strong>?
            {!confirmModal.isActivating && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
                This user will no longer be able to log in to the POS system.
              </div>
            )}
          </div>
        }
        confirmText={confirmModal.isActivating ? 'Activate User' : 'Deactivate User'}
        confirmVariant={confirmModal.isActivating ? 'success' : 'danger'}
        isLoading={confirmModal.isLoading}
      />
    </AppLayout>
  );
}
