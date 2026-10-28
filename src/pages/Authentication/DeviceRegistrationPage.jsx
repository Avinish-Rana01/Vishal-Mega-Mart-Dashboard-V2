import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Edit2, Cpu, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import ConfirmModal from '../../components/common/ConfirmModal';
import ToastNotification from '../../components/common/ToastNotification';
import { SearchButton, ClearButton } from '../../components/common/ReportActionButton';
import { 
  getDeviceList, 
  getDeviceDropdowns, 
  saveDevice, 
  toggleDeviceStatus 
} from '../../services/deviceMasterService';
import '../Report/common-reports.css';
import './Authentication.css';

export default function DeviceRegistrationPage() {
  const navigate = useNavigate();
  const { userRole, userId, hasSection } = useAuth();

  // Strict Developer Authorization Guard:
  // Only the Developer role or User ID 99999 is permitted. All other users are blocked.
  const isAuthorized = userRole === 'Developer' || String(userId) === '99999' || hasSection('Devices');

  // If any non-developer manually changes the route/URL to this page, immediately bounce them to /dashboard
  useEffect(() => {
    if (!isAuthorized) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthorized, navigate]);

  // Dropdown options
  const [deviceTypeOptions, setDeviceTypeOptions] = useState([]);
  const [storeOptions, setStoreOptions] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);

  // Form State
  const [storeId, setStoreId] = useState('');
  const [whId, setWhId] = useState('');
  const [cashCounterNo, setCashCounterNo] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [deviceEsn, setDeviceEsn] = useState('');

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [editTriggerAnim, setEditTriggerAnim] = useState(false);
  const esnInputRef = useRef(null);

  // Table Data & Loading State
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Search, Sorting & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('Device_ID');
  const [sortDirection, setSortDirection] = useState('desc');

  // Feedback Notification Banner
  const [alert, setAlert] = useState(null);
  const [bottomToast, setBottomToast] = useState(null);

  // Confirm Modal Dialog State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    device: null,
    isActivating: false,
    isLoading: false
  });

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  // Auto-dismiss bottom toast after 1.8 seconds
  useEffect(() => {
    if (!bottomToast) return;
    const timer = setTimeout(() => setBottomToast(null), 1800);
    return () => clearTimeout(timer);
  }, [bottomToast]);

  // Load dropdown lists on mount (strictly only if authorized)
  const loadDropdowns = useCallback(async () => {
    if (!isAuthorized) return;
    try {
      const data = await getDeviceDropdowns();
      if (data) {
        if (Array.isArray(data.deviceTypes || data.DeviceTypes)) {
          const list = data.deviceTypes || data.DeviceTypes;
          setDeviceTypeOptions(
            list.map(dt => ({
              value: dt.device_Type_ID ?? dt.Device_Type_ID,
              text: `${dt.device_Type_Name ?? dt.Device_Type_Name}${dt.description || dt.Description ? ` - ${dt.description || dt.Description}` : ''}`
            }))
          );
        }

        if (Array.isArray(data.stores || data.Stores)) {
          const list = data.stores || data.Stores;
          setStoreOptions(
            list.map(s => {
              const val = s.store_ID ?? s.Store_ID ?? s.ID ?? s.id;
              const txt = s.store_Name ?? s.Store_Name ?? s.Name ?? s.name ?? `Store ${val}`;
              const code = s.store_Code ?? s.Store_Code ? ` (${s.store_Code ?? s.Store_Code})` : '';
              return { value: val, text: `${txt}${code}` };
            })
          );
        }

        if (Array.isArray(data.warehouses || data.Warehouses)) {
          const list = data.warehouses || data.Warehouses;
          setWarehouseOptions(
            list.map(w => {
              const val = w.wH_ID ?? w.WH_ID ?? w.ID ?? w.id;
              const txt = w.wh_Name ?? w.Wh_Name ?? w.Name ?? w.name ?? `Warehouse ${val}`;
              const code = w.wh_Code ?? w.Wh_Code ? ` (${w.wh_Code ?? w.Wh_Code})` : '';
              return { value: val, text: `${txt}${code}` };
            })
          );
        }
      }
    } catch (err) {
      console.error('Error loading device dropdown options:', err);
    }
  }, [isAuthorized]);

  // Fetch full device directory (strictly only if authorized)
  const fetchDevices = useCallback(async () => {
    if (!isAuthorized) return;
    setIsLoading(true);
    try {
      const data = await getDeviceList();
      if (Array.isArray(data)) {
        setDevices(data);
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error('Error fetching device list:', err);
      setAlert({
        type: 'error',
        message: 'Failed to load device directory. Please ensure the backend is running.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      loadDropdowns();
      fetchDevices();
    }
  }, [isAuthorized, loadDropdowns, fetchDevices]);

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

  // If unauthorized, do not render page contents at all
  if (!isAuthorized) {
    return null;
  }

  // Reset / Clear form
  const resetForm = () => {
    setStoreId('');
    setWhId('');
    setCashCounterNo('');
    setDeviceTypeId('');
    setDeviceEsn('');
    setIsEditing(false);
    setEditingDeviceId(null);
    setEditTriggerAnim(false);
    setBottomToast(null);
  };

  // Populate form for Edit Mode
  const handleEditClick = (device) => {
    setIsEditing(true);
    setEditingDeviceId(device.device_ID ?? device.Device_ID);

    const devStoreId = device.store_ID ?? device.Store_ID;
    const devWhId = device.wH_ID ?? device.WH_ID;

    if (devWhId && Number(devWhId) > 0) {
      setWhId(Number(devWhId));
      setStoreId('');
      setCashCounterNo('');
    } else if (devStoreId && Number(devStoreId) > 0) {
      setStoreId(Number(devStoreId));
      setWhId('');
      setCashCounterNo(
        device.cash_Counter_No === 'N/A' || device.cash_Counter_No === 'NA' ? '' : (device.cash_Counter_No ?? device.Cash_Counter_No ?? '')
      );
    } else {
      setStoreId('');
      setWhId('');
      setCashCounterNo('');
    }

    setDeviceTypeId(device.device_Type_ID ?? device.Device_Type_ID ?? '');
    setDeviceEsn(device.device_ESN ?? device.Device_ESN ?? '');

    // Trigger visual scroll and focus
    setEditTriggerAnim(true);
    setTimeout(() => setEditTriggerAnim(false), 600);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      if (esnInputRef.current) esnInputRef.current.focus();
    }, 250);
  };

  // Submit Handler: Add or Update Device
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!storeId && !whId) {
      setAlert({ type: 'error', message: 'Please select either an Assigned Store or an Assigned Warehouse.' });
      return;
    }

    if (!deviceTypeId) {
      setAlert({ type: 'error', message: 'Please select a Device Type.' });
      return;
    }

    if (!deviceEsn.trim()) {
      setAlert({ type: 'error', message: 'Please enter Device ESN / Serial Number.' });
      if (esnInputRef.current) esnInputRef.current.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        Device_ID: isEditing ? Number(editingDeviceId) : 0,
        Store_ID: storeId ? Number(storeId) : null,
        WH_ID: whId ? Number(whId) : null,
        Cash_Counter_No: storeId && cashCounterNo.trim() ? cashCounterNo.trim() : null,
        Device_Type_ID: Number(deviceTypeId),
        Device_ESN: deviceEsn.trim(),
        User_ID: 99999
      };

      const res = await saveDevice(payload);

      if (res && res.success) {
        setAlert({
          type: 'success',
          message: res.message || (isEditing ? 'Device updated successfully.' : 'Device registered successfully.')
        });
        resetForm();
        fetchDevices();
      } else {
        setAlert({
          type: 'error',
          message: res?.message || 'Failed to save device. Please check values.'
        });
      }
    } catch (err) {
      console.error('Error saving device:', err);
      const backendMsg = err.response?.data?.message || err.message;
      setAlert({
        type: 'error',
        message: backendMsg || 'An error occurred while saving the device.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open confirmation modal for toggle status
  const handleToggleStatus = (device) => {
    const statusStr = String(device?.status ?? device?.Status ?? 'Active');
    const isActive = statusStr.toLowerCase().includes('active') && !statusStr.toLowerCase().includes('in');
    setConfirmModal({
      isOpen: true,
      device,
      isActivating: !isActive,
      isLoading: false
    });
  };

  // Execute Toggle Status via Modal Confirmation
  const handleConfirmToggle = async () => {
    const dev = confirmModal.device;
    if (!dev) return;

    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      const devId = dev.device_ID ?? dev.Device_ID;
      const res = await toggleDeviceStatus(devId);
      if (res && res.success) {
        setAlert({
          type: 'success',
          message: res.message || `Device ${confirmModal.isActivating ? 'activated' : 'deactivated'} successfully.`
        });
        setConfirmModal({ isOpen: false, device: null, isActivating: false, isLoading: false });
        fetchDevices();
      } else {
        setAlert({
          type: 'error',
          message: res?.message || 'Failed to toggle device status.'
        });
        setConfirmModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.error('Error toggling device status:', err);
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to toggle status.'
      });
      setConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Filtered and Sorted Table Data
  const sortedAndFilteredDevices = useMemo(() => {
    let result = [...devices];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(d => {
        const id = String(d.device_ID ?? d.Device_ID ?? '');
        const type = String(d.device_Type_Name ?? d.Device_Type_Name ?? '').toLowerCase();
        const esn = String(d.device_ESN ?? d.Device_ESN ?? '').toLowerCase();
        const store = String(d.store_Name ?? d.Store_Name ?? '').toLowerCase();
        const wh = String(d.wh_Name ?? d.Wh_Name ?? '').toLowerCase();
        const counter = String(d.cash_Counter_No ?? d.Cash_Counter_No ?? '').toLowerCase();
        const status = String(d.status ?? d.Status ?? '').toLowerCase();
        return id.includes(term) || type.includes(term) || esn.includes(term) || store.includes(term) || wh.includes(term) || counter.includes(term) || status.includes(term);
      });
    }

    // Sort safely guarding against null sortColumn / null sortDirection
    if (sortColumn && sortDirection) {
      const lowerCol = String(sortColumn).toLowerCase();
      result.sort((a, b) => {
        let valA = a[sortColumn] ?? a[lowerCol] ?? '';
        let valB = b[sortColumn] ?? b[lowerCol] ?? '';

        if (valA === '' && valB === '') {
          const keyA = Object.keys(a).find(k => k.toLowerCase() === lowerCol);
          const keyB = Object.keys(b).find(k => k.toLowerCase() === lowerCol);
          if (keyA) valA = a[keyA] ?? '';
          if (keyB) valB = b[keyB] ?? '';
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'desc' ? valB - valA : valA - valB;
        }

        valA = String(valA ?? '').toLowerCase();
        valB = String(valB ?? '').toLowerCase();
        if (valA < valB) return sortDirection === 'desc' ? 1 : -1;
        if (valA > valB) return sortDirection === 'desc' ? -1 : 1;
        return 0;
      });
    }

    return result;
  }, [devices, searchTerm, sortColumn, sortDirection]);

  // Paginated Table Data
  const paginatedData = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return sortedAndFilteredDevices.slice(start, start + pageSize);
  }, [sortedAndFilteredDevices, pageIndex, pageSize]);

  // Export Data Formatter
  const exportFormattedDevices = useMemo(() => {
    return sortedAndFilteredDevices.map((d, index) => ({
      'S.No': index + 1,
      'Device ID': d.device_ID ?? d.Device_ID,
      'Device Type': d.device_Type_Name ?? d.Device_Type_Name,
      'Device ESN / MAC': d.device_ESN ?? d.Device_ESN,
      'Assigned Store': d.store_Name ?? d.Store_Name,
      'Store Code': d.store_Code ?? d.Store_Code,
      'Assigned Warehouse': d.wh_Name ?? d.Wh_Name,
      'Warehouse Code': d.wh_Code ?? d.Wh_Code,
      'Cash Counter': d.cash_Counter_No ?? d.Cash_Counter_No,
      'Status': d.status ?? d.Status,
      'Created Date': d.created_Date ?? d.Created_Date
    }));
  }, [sortedAndFilteredDevices]);

  // Table Columns
  const columns = useMemo(() => [
    {
      key: 'Device_ID',
      label: 'DEVICE ID',
      align: 'center',
      width: '90px',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#334155' }}>
          #{val ?? row?.device_ID ?? row?.Device_ID}
        </span>
      )
    },
    {
      key: 'Device_Type_Name',
      label: 'DEVICE TYPE',
      sortable: true,
      render: (val, row) => {
        const typeName = val ?? row?.device_Type_Name ?? row?.Device_Type_Name ?? 'Unknown';
        return (
          <span 
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: '#EFF6FF',
              color: '#1D4ED8',
              fontWeight: 600,
              fontSize: '12px',
              border: '1px solid #BFDBFE'
            }}
          >
            <Cpu size={13} color="#3B82F6" />
            {typeName}
          </span>
        );
      }
    },
    {
      key: 'Device_ESN',
      label: 'DEVICE ESN / MAC',
      sortable: true,
      render: (val, row) => {
        const esn = val ?? row?.device_ESN ?? row?.Device_ESN ?? 'N/A';
        return (
          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A', letterSpacing: '0.3px' }}>
            {esn}
          </span>
        );
      }
    },
    {
      key: 'Store_Name',
      label: 'ASSIGNED STORE',
      sortable: true,
      render: (val, row) => {
        const s = val ?? row?.store_Name ?? row?.Store_Name;
        return (!s || s === 'NA' || s === 'N/A') ? (
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>N/A</span>
        ) : (
          <span style={{ fontWeight: 500, color: '#334155' }}>{s}</span>
        );
      }
    },
    {
      key: 'Wh_Name',
      label: 'ASSIGNED WAREHOUSE',
      sortable: true,
      render: (val, row) => {
        const w = val ?? row?.wh_Name ?? row?.Wh_Name;
        return (!w || w === 'NA' || w === 'N/A') ? (
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>N/A</span>
        ) : (
          <span style={{ fontWeight: 500, color: '#334155' }}>{w}</span>
        );
      }
    },
    {
      key: 'Cash_Counter_No',
      label: 'CASH COUNTER',
      sortable: true,
      render: (val, row) => {
        const c = val ?? row?.cash_Counter_No ?? row?.Cash_Counter_No;
        return (!c || c === 'NA' || c === 'N/A') ? (
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>—</span>
        ) : (
          <span style={{ fontWeight: 600, color: '#0369A1' }}>{c}</span>
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
        const statusStr = String(val ?? row?.status ?? row?.Status ?? 'Active');
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
        const statusStr = String(row?.status ?? row?.Status ?? 'Active');
        const isActive = statusStr.toLowerCase().includes('active') && !statusStr.toLowerCase().includes('in');
        return (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
            <button
              type="button"
              className="vmm-table-action-btn edit-icon"
              onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}
              title="Edit Device"
              aria-label="Edit Device"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              className={`vmm-ios-toggle ${isActive ? 'active' : 'inactive'}`}
              onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
              title={isActive ? 'Deactivate Device' : 'Activate Device'}
              aria-label={isActive ? 'Deactivate Device' : 'Activate Device'}
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

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPageIndex(1);
  };

  return (
    <AppLayout
      headerProps={{
        breadcrumb: (
          <>
            HOME - PAGES - AUTHENTICATION - <span className="active">DEVICE REGISTRATION</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      {/* Floating Alert Notification Toast */}
      <ToastNotification alert={alert} onClose={() => setAlert(null)} />

      {/* Mobile Downside Toast (Snackbar) */}
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
              ? `EDITING DEVICE #${editingDeviceId} - PRESS ESC TO EXIT EDIT MODE` 
              : 'DEVICE REGISTRATION - NOTE : FIELDS MARKED WITH (*) ARE REQUIRED'}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="report-search-body">
            {/* 1. Assigned Store */}
            <div className="search-field">
              <label>Assigned Store</label>
              <SearchableDropdown
                options={storeOptions}
                value={storeId}
                onChange={(val) => {
                  setStoreId(val);
                  if (val) setWhId('');
                }}
                disabled={isSubmitting || Boolean(whId)}
                placeholder={whId ? 'Disabled (Warehouse selected)' : 'Select Store'}
              />
            </div>

            {/* 2. Assigned Warehouse */}
            <div className="search-field">
              <label>Assigned Warehouse</label>
              <SearchableDropdown
                options={warehouseOptions}
                value={whId}
                onChange={(val) => {
                  setWhId(val);
                  if (val) {
                    setStoreId('');
                    setCashCounterNo('');
                  }
                }}
                disabled={isSubmitting}
                placeholder="Select Warehouse"
              />
            </div>

            {/* 3. Cash Counter (Only for Store; hidden when Warehouse is selected) */}
            {!whId && (
              <div className="search-field">
                <label>Cash Counter</label>
                <input
                  type="text"
                  className="vmm-auth-input"
                  placeholder="e.g. Counter 1, POS-01"
                  value={cashCounterNo}
                  onChange={(e) => setCashCounterNo(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
            )}

            {/* 4. Device Type */}
            <div className="search-field">
              <label>Device Type *</label>
              <SearchableDropdown
                options={deviceTypeOptions}
                value={deviceTypeId}
                onChange={setDeviceTypeId}
                disabled={isSubmitting}
                placeholder="Select Device Type"
              />
            </div>

            {/* 5. Device ESN */}
            <div className="search-field">
              <label>Device ESN / Serial *</label>
              <input
                ref={esnInputRef}
                type="text"
                className="vmm-auth-input"
                placeholder="Enter unique ESN or MAC"
                value={deviceEsn}
                onChange={(e) => setDeviceEsn(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            {/* Standard VMM Action Buttons */}
            <div className="search-buttons">
              <SearchButton
                onClick={handleSubmit}
                disabled={isSubmitting}
                label={isEditing ? 'Update Device' : 'Add Device'}
                icon={isEditing ? <Edit2 size={13} /> : <Plus size={13} />}
                className={isEditing ? 'btn-edit-mode' : ''}
              />
              <ClearButton
                onClick={resetForm}
                disabled={isSubmitting}
                label={isEditing ? 'Cancel Edit' : 'Reset'}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Standard VMM ReportDataTableCard */}
      <div>
        <ReportDataTableCard
          columns={columns}
          data={paginatedData}
          exportData={exportFormattedDevices}
          isLoading={isLoading}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageIndex(1);
          }}
          totalRecords={sortedAndFilteredDevices.length}
          exportFileName="Device_Registration_Directory.xlsx"
          searchPlaceholder="Search by ESN, type, store, counter..."
          searchValue={searchTerm}
          onSearch={handleSearchChange}
          onSortChange={handleSortChange}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          getRowClassName={(row) => {
            const rowId = row?.device_ID ?? row?.Device_ID;
            const isCurrentlyEditing = isEditing && Number(editingDeviceId) === Number(rowId);
            return isCurrentlyEditing ? 'vmm-row-currently-editing' : '';
          }}
        />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, device: null, isActivating: false, isLoading: false })}
        onConfirm={handleConfirmToggle}
        title={confirmModal.isActivating ? 'Activate Device Terminal' : 'Deactivate Device Terminal'}
        message={
          <div>
            Are you sure you want to {confirmModal.isActivating ? 'activate' : 'deactivate'} device{' '}
            <strong style={{ color: '#0f172a' }}>
              "{confirmModal.device?.device_Type_Name ?? confirmModal.device?.Device_Type_Name} ({confirmModal.device?.device_ESN ?? confirmModal.device?.Device_ESN})"
            </strong>?
            {!confirmModal.isActivating && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
                This device terminal will be deactivated and disassociated from active scanning.
              </div>
            )}
          </div>
        }
        confirmText={confirmModal.isActivating ? 'Activate Device' : 'Deactivate Device'}
        confirmVariant={confirmModal.isActivating ? 'success' : 'danger'}
        isLoading={confirmModal.isLoading}
      />
    </AppLayout>
  );
}
