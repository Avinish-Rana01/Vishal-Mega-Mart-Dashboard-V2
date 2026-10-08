import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Power, Plus } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import ConfirmModal from '../../components/common/ConfirmModal';
import ToastNotification from '../../components/common/ToastNotification';
import { SearchButton, ClearButton } from '../../components/common/ReportActionButton';
import {
  getStoreMasterList,
  createStoreMaster,
  updateStoreMaster,
  toggleStoreStatus
} from '../../services/masterAuthService';
import '../Report/common-reports.css';
import './Authentication.css';

export default function StoreRegistrationPage() {
  const navigate = useNavigate();

  // Form State
  const [storeCode, setStoreCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [storeManager, setStoreManager] = useState('');
  const [areaManager, setAreaManager] = useState('');
  const [zfm, setZfm] = useState('');
  const [lp, setLp] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editTriggerAnim, setEditTriggerAnim] = useState(false);

  // Table Data & Loading State
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Search, Sorting & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('Store_ID');
  const [sortDirection, setSortDirection] = useState('asc');

  // Feedback Notification Banner
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // Confirm Modal Dialog State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    store: null,
    isActivating: false,
    isLoading: false
  });

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  // Fetch full store directory
  const fetchStores = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStoreMasterList();
      if (Array.isArray(data)) {
        setStores(data);
      } else {
        setStores([]);
      }
    } catch (err) {
      console.error('Error fetching stores directory:', err);
      setAlert({
        type: 'error',
        message: 'Failed to load store directory. Please ensure the backend is running.'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

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

  // Reset / Clear form
  const resetForm = () => {
    setStoreCode('');
    setStoreName('');
    setState('');
    setCity('');
    setStoreManager('');
    setAreaManager('');
    setZfm('');
    setLp('');
    setIsEditing(false);
    setEditingStoreId(null);
    setEditTriggerAnim(false);
  };

  // Populate form for Edit Mode
  const handleEditClick = (store) => {
    setIsEditing(true);
    setEditingStoreId(store.Store_ID ?? store.store_ID ?? store.id);
    setStoreCode(store.Store_Code ?? store.store_Code ?? '');
    setStoreName(store.Store_Name ?? store.store_Name ?? '');
    setState(store.State ?? store.state ?? '');
    setCity(store.City ?? store.city ?? '');
    setStoreManager(store.Store_Manager ?? store.store_Manager ?? '');
    setAreaManager(store.Area_Manager ?? store.area_Manager ?? '');
    setZfm(store.ZFM ?? store.zfm ?? '');
    setLp(store.LP ?? store.lp ?? '');

    // Trigger field entrance shake
    setEditTriggerAnim(true);
    setTimeout(() => setEditTriggerAnim(false), 550);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!storeCode.trim()) {
      setAlert({ type: 'error', message: 'Store Code is required.' });
      return;
    }
    if (!storeName.trim()) {
      setAlert({ type: 'error', message: 'Store Name is required.' });
      return;
    }
    if (!state.trim()) {
      setAlert({ type: 'error', message: 'State is required.' });
      return;
    }
    if (!city.trim()) {
      setAlert({ type: 'error', message: 'City is required.' });
      return;
    }
    if (!storeManager.trim()) {
      setAlert({ type: 'error', message: 'Store Manager is required.' });
      return;
    }
    if (!areaManager.trim()) {
      setAlert({ type: 'error', message: 'Area Manager is required.' });
      return;
    }
    if (!zfm.trim()) {
      setAlert({ type: 'error', message: 'ZFM is required.' });
      return;
    }
    if (!lp.trim()) {
      setAlert({ type: 'error', message: 'LP is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      if (isEditing) {
        res = await updateStoreMaster({
          storeId: editingStoreId,
          storeCode: storeCode.trim(),
          storeName: storeName.trim(),
          state: state.trim(),
          city: city.trim(),
          storeManager: storeManager.trim(),
          areaManager: areaManager.trim(),
          zfm: zfm.trim(),
          lp: lp.trim()
        });
      } else {
        res = await createStoreMaster({
          storeCode: storeCode.trim(),
          storeName: storeName.trim(),
          state: state.trim(),
          city: city.trim(),
          storeManager: storeManager.trim(),
          areaManager: areaManager.trim(),
          zfm: zfm.trim(),
          lp: lp.trim()
        });
      }

      if (res && res.success !== false) {
        setAlert({
          type: 'success',
          message: res.message || (isEditing ? 'Store updated successfully!' : 'Store created successfully!')
        });
        resetForm();
        fetchStores();
      } else {
        setAlert({
          type: 'error',
          message: res?.message || 'Operation failed. Store code or name may already exist.'
        });
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'An error occurred while saving the store.';
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modern Confirm Modal (Activate / Deactivate)
  const handleToggleStatus = (store) => {
    const currentStatus = store.Status ?? store.status ?? '';
    const isActive = String(currentStatus).toLowerCase().includes('active') && !String(currentStatus).toLowerCase().includes('in');
    setConfirmModal({
      isOpen: true,
      store,
      isActivating: !isActive,
      isLoading: false
    });
  };

  // Execute status toggle after user confirms in modern modal
  const handleConfirmToggle = async () => {
    if (!confirmModal.store) return;
    const store = confirmModal.store;
    const storeId = store.Store_ID ?? store.store_ID ?? store.id;
    const storeDisplayName = store.Store_Name ?? store.store_Name ?? store.Store_Code ?? `Store ${storeId}`;

    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await toggleStoreStatus(storeId);
      if (res && res.success !== false) {
        setAlert({
          type: 'success',
          message: res.message || `Store "${storeDisplayName}" status toggled successfully.`
        });
        fetchStores();
      } else {
        setAlert({
          type: 'error',
          message: res?.message || `Failed to toggle status for store "${storeDisplayName}".`
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to toggle store status.'
      });
    } finally {
      setConfirmModal({ isOpen: false, store: null, isActivating: false, isLoading: false });
    }
  };

  // Client-side search and sorting
  const sortedAndFilteredStores = useMemo(() => {
    let list = [...stores];

    // Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(s => {
        const code = String(s.Store_Code ?? s.store_Code ?? '').toLowerCase();
        const name = String(s.Store_Name ?? s.store_Name ?? '').toLowerCase();
        const id = String(s.Store_ID ?? s.store_ID ?? '');
        const stateVal = String(s.State ?? s.state ?? '').toLowerCase();
        const cityVal = String(s.City ?? s.city ?? '').toLowerCase();
        const smVal = String(s.Store_Manager ?? s.store_Manager ?? '').toLowerCase();
        const amVal = String(s.Area_Manager ?? s.area_Manager ?? '').toLowerCase();
        const zfmVal = String(s.ZFM ?? s.zfm ?? '').toLowerCase();
        const lpVal = String(s.LP ?? s.lp ?? '').toLowerCase();
        const status = String(s.Status ?? s.status ?? '').toLowerCase();
        return (
          code.includes(term) ||
          name.includes(term) ||
          id.includes(term) ||
          stateVal.includes(term) ||
          cityVal.includes(term) ||
          smVal.includes(term) ||
          amVal.includes(term) ||
          zfmVal.includes(term) ||
          lpVal.includes(term) ||
          status.includes(term)
        );
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
  }, [stores, searchTerm, sortColumn, sortDirection]);

  // Paginated slice for current page
  const paginatedData = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return sortedAndFilteredStores.slice(start, start + pageSize);
  }, [sortedAndFilteredStores, pageIndex, pageSize]);

  // Clean formatted data for Excel Export (N/A for missing cells)
  const exportFormattedStores = useMemo(() => {
    return sortedAndFilteredStores.map(s => ({
      Store_ID: s.Store_ID ?? s.store_ID ?? 'N/A',
      Store_Code: s.Store_Code ?? s.store_Code ?? 'N/A',
      Store_Name: s.Store_Name ?? s.store_Name ?? 'N/A',
      State: s.State ?? s.state ?? 'N/A',
      City: s.City ?? s.city ?? 'N/A',
      Store_Manager: s.Store_Manager ?? s.store_Manager ?? 'N/A',
      Area_Manager: s.Area_Manager ?? s.area_Manager ?? 'N/A',
      ZFM: s.ZFM ?? s.zfm ?? 'N/A',
      LP: s.LP ?? s.lp ?? 'N/A',
      Status: s.Status ?? s.status ?? 'Active'
    }));
  }, [sortedAndFilteredStores]);

  // Table Columns Definition
  const columns = useMemo(() => [
    {
      key: 'Store_ID',
      label: 'STORE ID',
      align: 'center',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: '#334155' }}>
          {val ?? row?.Store_ID ?? row?.store_ID}
        </span>
      )
    },
    {
      key: 'Store_Code',
      label: 'STORE CODE',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: '#0f172a', letterSpacing: '0.5px' }}>
          {val ?? row?.Store_Code ?? row?.store_Code ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'Store_Name',
      label: 'STORE NAME',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#334155' }}>
          {val ?? row?.Store_Name ?? row?.store_Name ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'State',
      label: 'STATE',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#475569' }}>
          {val ?? row?.State ?? row?.state ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'City',
      label: 'CITY',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#475569' }}>
          {val ?? row?.City ?? row?.city ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'Store_Manager',
      label: 'STORE MANAGER',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#0284c7' }}>
          {val ?? row?.Store_Manager ?? row?.store_Manager ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'Area_Manager',
      label: 'AREA MANAGER',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#334155' }}>
          {val ?? row?.Area_Manager ?? row?.area_Manager ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'ZFM',
      label: 'ZFM',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#334155' }}>
          {val ?? row?.ZFM ?? row?.zfm ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'LP',
      label: 'LP',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 500, color: '#334155' }}>
          {val ?? row?.LP ?? row?.lp ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'Status',
      label: 'STATUS',
      align: 'center',
      sortable: true,
      render: (val, row) => {
        const statusStr = String(val ?? row?.Status ?? row?.status ?? 'Active');
        const isActive = statusStr.toLowerCase().includes('active') && !statusStr.toLowerCase().includes('in');
        return (
          <span className={`vmm-status-pill ${isActive ? 'active' : 'inactive'}`}>
            <span className="vmm-status-dot" />
            {isActive ? 'Active' : 'In-Active'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'center',
      sortable: false,
      render: (_, row) => {
        const statusStr = String(row?.Status ?? row?.status ?? 'Active');
        const isActive = statusStr.toLowerCase().includes('active') && !statusStr.toLowerCase().includes('in');
        return (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            <button
              type="button"
              className="vmm-table-action-btn edit"
              onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}
              title="Edit Store"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              type="button"
              className={`vmm-table-action-btn ${isActive ? 'deactivate' : 'activate'}`}
              onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
              title={isActive ? 'Deactivate Store' : 'Activate Store'}
            >
              <Power size={12} /> {isActive ? 'Deactivate' : 'Activate'}
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
            HOME - PAGES - AUTHENTICATION - <span className="active">STORE REGISTRATION</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      {/* Floating Alert Notification Toast */}
      <ToastNotification alert={alert} onClose={() => setAlert(null)} />

      {/* Top Search / Form Card (VMM Standard Design) */}
      <div className={`report-search-card ${editTriggerAnim ? 'vmm-edit-shake-anim' : ''}`}>
        <div className={`report-search-header ${isEditing ? 'vmm-edit-mode-header' : ''}`}>
          <span>
            {isEditing ? `EDITING STORE ${editingStoreId}` : 'STORE REGISTRATION'} - NOTE : FIELDS MARKED WITH (*) ARE REQUIRED
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="report-search-body report-search-body--stacked">
            {/* Row 1: Store Location Details */}
            <div className="report-search-row">
              <div className="search-field">
                <label>Store Code *</label>
                <input
                  type="text"
                  className="vmm-auth-input"
                  placeholder="Enter store code (e.g. HD55)"
                  value={storeCode}
                  onChange={(e) => setStoreCode(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="search-field">
                <label>Store Name *</label>
                <input
                  type="text"
                  className="vmm-auth-input"
                  placeholder="Enter store name (e.g. HD55 - Dwarka)"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="search-field">
                <label>State *</label>
                <input
                  type="text"
                  className="vmm-auth-input"
                  placeholder="Enter state (e.g. Delhi, Haryana)"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="search-field">
                <label>City *</label>
                <input
                  type="text"
                  className="vmm-auth-input"
                  placeholder="Enter city (e.g. Delhi, Gurgaon)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Row 2: Management Personnel */}
            <div className="report-search-row">
              <div className="search-field">
                <label>Store Manager *</label>
                <input
                  type="text"
                  className="vmm-auth-input"
                  placeholder="Enter SM name or email"
                  value={storeManager}
                  onChange={(e) => setStoreManager(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="search-field">
                <label>Area Manager *</label>
                <input
                  type="text"
                  className="vmm-auth-input"
                  placeholder="Enter Area Manager"
                  value={areaManager}
                  onChange={(e) => setAreaManager(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="search-field">
                <label>ZFM *</label>
                <input
                  type="text"
                  className="vmm-auth-input"
                  placeholder="Enter ZFM"
                  value={zfm}
                  onChange={(e) => setZfm(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="search-field">
                <label>LP *</label>
                <input
                  type="text"
                  className="vmm-auth-input"
                  placeholder="Enter LP"
                  value={lp}
                  onChange={(e) => setLp(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Row 3: Action Buttons (Centered) */}
            <div className="report-search-row report-search-row--actions-center">
              <div className="search-buttons">
                <SearchButton
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  label={isEditing ? 'Update Store' : 'Create Store'}
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
          </div>
        </form>
      </div>

      {/* Standard VMM ReportDataTableCard */}
      <div>
        <ReportDataTableCard
          columns={columns}
          data={paginatedData}
          exportData={exportFormattedStores}
          isLoading={isLoading}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageIndex(1);
          }}
          totalRecords={sortedAndFilteredStores.length}
          exportFileName="Store_Registration_Directory.xlsx"
          searchPlaceholder="Search by store code, name, ID..."
          searchValue={searchTerm}
          onSearch={handleSearchChange}
          onSortChange={handleSortChange}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          getRowClassName={(row) => {
            const rowId = row?.Store_ID ?? row?.store_ID ?? row?.id;
            return isEditing && Number(editingStoreId) === Number(rowId) ? 'vmm-row-currently-editing' : '';
          }}
        />
      </div>

      {/* Modern Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, store: null, isActivating: false, isLoading: false })}
        onConfirm={handleConfirmToggle}
        title={confirmModal.isActivating ? 'Activate Store Location' : 'Deactivate Store Location'}
        message={
          <div>
            Are you sure you want to {confirmModal.isActivating ? 'activate' : 'deactivate'} store{' '}
            <strong style={{ color: '#0f172a' }}>"{confirmModal.store?.Store_Name ?? confirmModal.store?.store_Name ?? confirmModal.store?.Store_Code}"</strong>?
            {!confirmModal.isActivating && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
                This store location will be marked inactive across retail operations.
              </div>
            )}
          </div>
        }
        confirmText={confirmModal.isActivating ? 'Activate Store' : 'Deactivate Store'}
        confirmVariant={confirmModal.isActivating ? 'success' : 'danger'}
        isLoading={confirmModal.isLoading}
      />
    </AppLayout>
  );
}
