import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Power } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import ConfirmModal from '../../components/common/ConfirmModal';
import ToastNotification from '../../components/common/ToastNotification';
import { SearchButton, ClearButton } from '../../components/common/ReportActionButton';
import {
  getWarehouseMasterList,
  createWarehouseMaster,
  updateWarehouseMaster,
  toggleWarehouseStatus
} from '../../services/masterAuthService';
import '../Report/common-reports.css';
import './Authentication.css';

export default function WarehouseRegistrationPage() {
  const navigate = useNavigate();

  // Form State
  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingWhId, setEditingWhId] = useState(null);

  // Table Data & Loading State
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Search, Sorting & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('WH_ID');
  const [sortDirection, setSortDirection] = useState('asc');

  // Feedback Notification Banner
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // Confirm Modal Dialog State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    warehouse: null,
    isActivating: false,
    isLoading: false
  });

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  // Fetch full warehouse directory
  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getWarehouseMasterList();
      if (Array.isArray(data)) {
        setWarehouses(data);
      } else {
        setWarehouses([]);
      }
    } catch (err) {
      console.error('Error fetching warehouses directory:', err);
      setAlert({
        type: 'error',
        message: 'Failed to load warehouse directory. Please ensure the backend is running.'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Reset / Clear form
  const resetForm = () => {
    setWhCode('');
    setWhName('');
    setWhAddress('');
    setIsEditing(false);
    setEditingWhId(null);
  };

  // Populate form for Edit Mode
  const handleEditClick = (wh) => {
    setIsEditing(true);
    setEditingWhId(wh.WH_ID ?? wh.wh_ID ?? wh.id);
    setWhCode(wh.Wh_Code ?? wh.wh_Code ?? '');
    setWhName(wh.Wh_Name ?? wh.wh_Name ?? '');
    setWhAddress(wh.Wh_Address ?? wh.wh_Address ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!whCode.trim()) {
      setAlert({ type: 'error', message: 'Warehouse Code is required.' });
      return;
    }
    if (!whName.trim()) {
      setAlert({ type: 'error', message: 'Warehouse Name is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      if (isEditing) {
        res = await updateWarehouseMaster({
          whId: editingWhId,
          whCode: whCode.trim(),
          whName: whName.trim(),
          whAddress: whAddress.trim()
        });
      } else {
        res = await createWarehouseMaster({
          whCode: whCode.trim(),
          whName: whName.trim(),
          whAddress: whAddress.trim()
        });
      }

      if (res && res.success !== false) {
        setAlert({
          type: 'success',
          message: res.message || (isEditing ? 'Warehouse updated successfully!' : 'Warehouse created successfully!')
        });
        resetForm();
        fetchWarehouses();
      } else {
        setAlert({
          type: 'error',
          message: res?.message || 'Operation failed. Warehouse code or name may already exist.'
        });
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'An error occurred while saving the warehouse.';
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open modern Confirm Modal (Activate / Deactivate)
  const handleToggleStatus = (warehouse) => {
    const currentStatus = warehouse.Status ?? warehouse.status ?? '';
    const isActive = String(currentStatus).toLowerCase().includes('active') && !String(currentStatus).toLowerCase().includes('in');
    setConfirmModal({
      isOpen: true,
      warehouse,
      isActivating: !isActive,
      isLoading: false
    });
  };

  // Execute status toggle after user confirms in modern modal
  const handleConfirmToggle = async () => {
    if (!confirmModal.warehouse) return;
    const wh = confirmModal.warehouse;
    const whId = wh.WH_ID ?? wh.wh_ID ?? wh.id;
    const whDisplayName = wh.Wh_Name ?? wh.wh_Name ?? wh.Wh_Code ?? `Warehouse #${whId}`;

    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await toggleWarehouseStatus(whId);
      if (res && res.success !== false) {
        setAlert({
          type: 'success',
          message: res.message || `Warehouse "${whDisplayName}" status toggled successfully.`
        });
        fetchWarehouses();
      } else {
        setAlert({
          type: 'error',
          message: res?.message || `Failed to toggle status for warehouse "${whDisplayName}".`
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to toggle warehouse status.'
      });
    } finally {
      setConfirmModal({ isOpen: false, warehouse: null, isActivating: false, isLoading: false });
    }
  };

  // Client-side search and sorting
  const sortedAndFilteredWarehouses = useMemo(() => {
    let list = [...warehouses];

    // Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(w => {
        const code = String(w.Wh_Code ?? w.wh_Code ?? '').toLowerCase();
        const name = String(w.Wh_Name ?? w.wh_Name ?? '').toLowerCase();
        const address = String(w.Wh_Address ?? w.wh_Address ?? '').toLowerCase();
        const id = String(w.WH_ID ?? w.wh_ID ?? '');
        const status = String(w.Status ?? w.status ?? '').toLowerCase();
        return code.includes(term) || name.includes(term) || address.includes(term) || id.includes(term) || status.includes(term);
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
  }, [warehouses, searchTerm, sortColumn, sortDirection]);

  // Paginated slice for current page
  const paginatedData = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return sortedAndFilteredWarehouses.slice(start, start + pageSize);
  }, [sortedAndFilteredWarehouses, pageIndex, pageSize]);

  // Clean formatted data for Excel Export (N/A for missing cells)
  const exportFormattedWarehouses = useMemo(() => {
    return sortedAndFilteredWarehouses.map(w => ({
      WH_ID: w.WH_ID ?? 'N/A',
      Wh_Code: w.Wh_Code || 'N/A',
      Wh_Name: w.Wh_Name || 'N/A',
      Wh_Address: (!w.Wh_Address || w.Wh_Address === '—' || w.Wh_Address === 'NA') ? 'N/A' : w.Wh_Address,
      Status: w.Status || 'Active'
    }));
  }, [sortedAndFilteredWarehouses]);

  // Table Columns Definition
  const columns = useMemo(() => [
    {
      key: 'WH_ID',
      label: 'WAREHOUSE ID',
      align: 'center',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: '#334155' }}>
          #{val ?? row?.WH_ID ?? row?.wh_ID}
        </span>
      )
    },
    {
      key: 'Wh_Code',
      label: 'WAREHOUSE CODE',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: '#0f172a', letterSpacing: '0.5px' }}>
          {val ?? row?.Wh_Code ?? row?.wh_Code ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'Wh_Name',
      label: 'WAREHOUSE NAME',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#334155' }}>
          {val ?? row?.Wh_Name ?? row?.wh_Name ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'Wh_Address',
      label: 'FACILITY ADDRESS',
      sortable: true,
      render: (val, row) => {
        const addr = val ?? row?.Wh_Address ?? row?.wh_Address;
        return (!addr || addr === '—' || addr === 'NA') ? (
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>N/A</span>
        ) : (
          <span style={{ fontWeight: 500, color: '#475569' }}>{addr}</span>
        );
      }
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
              title="Edit Warehouse"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              type="button"
              className={`vmm-table-action-btn ${isActive ? 'deactivate' : 'activate'}`}
              onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
              title={isActive ? 'Deactivate Warehouse' : 'Activate Warehouse'}
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
            HOME - PAGES - AUTHENTICATION - <span className="active">WAREHOUSE REGISTRATION</span>
          </>
        ),
        showBackButton: true,
        onBackClick: () => navigate(-1)
      }}
    >
      {/* Floating Alert Notification Toast */}
      <ToastNotification alert={alert} onClose={() => setAlert(null)} />

      {/* Top Search / Form Card (VMM Standard Design) */}
      <div className="report-search-card">
        <div className="report-search-header">
          <span>
            {isEditing ? `EDITING WAREHOUSE #${editingWhId}` : 'WAREHOUSE REGISTRATION'} - NOTE : FIELDS MARKED WITH (*) ARE REQUIRED
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="report-search-body">
            {/* 1. Warehouse Code */}
            <div className="search-field">
              <label>Warehouse Code *</label>
              <input
                type="text"
                className="vmm-auth-input"
                placeholder="Enter warehouse code (e.g. VMM001)"
                value={whCode}
                onChange={(e) => setWhCode(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            {/* 2. Warehouse Name */}
            <div className="search-field">
              <label>Warehouse Name *</label>
              <input
                type="text"
                className="vmm-auth-input"
                placeholder="Enter warehouse name (e.g. VMM LUHARI)"
                value={whName}
                onChange={(e) => setWhName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            {/* 3. Facility Address */}
            <div className="search-field">
              <label>Facility Address</label>
              <input
                type="text"
                className="vmm-auth-input"
                placeholder="Enter address (e.g. Pataudi, Haryana 122503)"
                value={whAddress}
                onChange={(e) => setWhAddress(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            {/* Action Buttons */}
            <div className="search-buttons">
              <SearchButton
                onClick={handleSubmit}
                disabled={isSubmitting}
                label={isEditing ? 'Update Warehouse' : 'Create Warehouse'}
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
      <div style={{ margin: '6px 10px 10px 10px' }}>
        <ReportDataTableCard
          columns={columns}
          data={paginatedData}
          exportData={exportFormattedWarehouses}
          isLoading={isLoading}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageIndex(1);
          }}
          totalRecords={sortedAndFilteredWarehouses.length}
          exportFileName="Warehouse_Registration_Directory.xlsx"
          searchPlaceholder="Search by warehouse code, name, address, ID..."
          searchValue={searchTerm}
          onSearch={handleSearchChange}
          onSortChange={handleSortChange}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
      </div>

      {/* Modern Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, warehouse: null, isActivating: false, isLoading: false })}
        onConfirm={handleConfirmToggle}
        title={confirmModal.isActivating ? 'Activate Warehouse Facility' : 'Deactivate Warehouse Facility'}
        message={
          <div>
            Are you sure you want to {confirmModal.isActivating ? 'activate' : 'deactivate'} warehouse{' '}
            <strong style={{ color: '#0f172a' }}>"{confirmModal.warehouse?.Wh_Name ?? confirmModal.warehouse?.wh_Name ?? confirmModal.warehouse?.Wh_Code}"</strong>?
            {!confirmModal.isActivating && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
                This warehouse facility will be marked inactive across retail and distribution operations.
              </div>
            )}
          </div>
        }
        confirmText={confirmModal.isActivating ? 'Activate Warehouse' : 'Deactivate Warehouse'}
        confirmVariant={confirmModal.isActivating ? 'success' : 'danger'}
        isLoading={confirmModal.isLoading}
      />
    </AppLayout>
  );
}
