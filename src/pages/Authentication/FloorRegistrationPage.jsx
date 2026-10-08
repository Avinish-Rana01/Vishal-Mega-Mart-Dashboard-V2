import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Power } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import ReportDataTableCard from '../../components/common/ReportDataTableCard';
import ConfirmModal from '../../components/common/ConfirmModal';
import ToastNotification from '../../components/common/ToastNotification';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import { SearchButton, ClearButton } from '../../components/common/ReportActionButton';
import {
  getFloorMasterList,
  createFloorMaster,
  updateFloorMaster,
  toggleFloorStatus,
  getStoreDropdown
} from '../../services/masterAuthService';
import '../Report/common-reports.css';
import './Authentication.css';

export default function FloorRegistrationPage() {
  const navigate = useNavigate();

  // Form State
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [floorName, setFloorName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingFloorId, setEditingFloorId] = useState(null);

  // Store Dropdown Options
  const [storeOptions, setStoreOptions] = useState([]);

  // Table Data & Loading State
  const [floors, setFloors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Search, Sorting & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState('Store_Floor_ID');
  const [sortDirection, setSortDirection] = useState('asc');

  // Feedback Notification Banner
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: string }

  // Confirm Modal Dialog State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    floor: null,
    isActivating: false,
    isLoading: false
  });

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 5000);
    return () => clearTimeout(timer);
  }, [alert]);

  // Fetch authorized stores dropdown
  const fetchStores = useCallback(async () => {
    try {
      const data = await getStoreDropdown();
      if (Array.isArray(data)) {
        setStoreOptions(
          data.map((s) => ({
            value: String(s.Store_ID ?? s.store_ID ?? s.id),
            text: s.Store_Name ?? s.store_Name ?? `Store ${s.Store_ID ?? s.store_ID}`
          }))
        );
      }
    } catch (err) {
      console.warn('Failed to load stores for floor registration:', err);
    }
  }, []);

  // Fetch full floor master directory
  const fetchFloors = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFloorMasterList();
      if (Array.isArray(data)) {
        setFloors(data);
      } else {
        setFloors([]);
      }
    } catch (err) {
      console.error('Error fetching floor directory:', err);
      setAlert({
        type: 'error',
        message: 'Failed to load floor directory. Please ensure the backend is running.'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
    fetchFloors();
  }, [fetchStores, fetchFloors]);

  // Reset / Clear form
  const resetForm = () => {
    setSelectedStoreId('');
    setFloorName('');
    setIsEditing(false);
    setEditingFloorId(null);
  };

  // Populate form for Edit Mode
  const handleEditClick = (floor) => {
    setIsEditing(true);
    setEditingFloorId(floor.Store_Floor_ID ?? floor.store_Floor_ID ?? floor.id);
    setSelectedStoreId(String(floor.Store_ID ?? floor.store_ID ?? ''));
    setFloorName(floor.Store_Floor ?? floor.store_Floor ?? '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedStoreId) {
      setAlert({ type: 'error', message: 'Please select a Store Name.' });
      return;
    }
    if (!floorName.trim()) {
      setAlert({ type: 'error', message: 'Floor is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      if (isEditing) {
        res = await updateFloorMaster({
          floorId: editingFloorId,
          storeId: Number(selectedStoreId),
          floorName: floorName.trim()
        });
      } else {
        res = await createFloorMaster({
          storeId: Number(selectedStoreId),
          floorName: floorName.trim()
        });
      }

      if (res && res.success !== false) {
        setAlert({
          type: 'success',
          message: res.message || (isEditing ? 'Floor updated successfully!' : 'Floor created successfully!')
        });
        resetForm();
        fetchFloors();
      } else {
        setAlert({
          type: 'error',
          message: res?.message || 'Operation failed. Floor may already exist for this store.'
        });
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'An error occurred while saving the floor.';
      setAlert({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Confirm Modal (Activate / Deactivate)
  const handleToggleStatus = (floor) => {
    const currentStatus = floor.Status ?? floor.status ?? '';
    const isActive = String(currentStatus).toLowerCase().includes('active') && !String(currentStatus).toLowerCase().includes('in');
    setConfirmModal({
      isOpen: true,
      floor,
      isActivating: !isActive,
      isLoading: false
    });
  };

  // Execute status toggle after user confirms in modern modal
  const handleConfirmToggle = async () => {
    if (!confirmModal.floor) return;
    const floor = confirmModal.floor;
    const floorId = floor.Store_Floor_ID ?? floor.store_Floor_ID ?? floor.id;
    const floorDisplayName = floor.Store_Floor ?? floor.store_Floor ?? `Floor ${floorId}`;
    const storeDisplayName = floor.Store_Name ?? floor.store_Name ?? '';

    setConfirmModal(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await toggleFloorStatus(floorId);
      if (res && res.success !== false) {
        setAlert({
          type: 'success',
          message: res.message || `Floor "${floorDisplayName}" (${storeDisplayName}) status toggled successfully.`
        });
        fetchFloors();
      } else {
        setAlert({
          type: 'error',
          message: res?.message || `Failed to toggle status for floor "${floorDisplayName}" (${storeDisplayName}).`
        });
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to toggle floor status.'
      });
    } finally {
      setConfirmModal({ isOpen: false, floor: null, isActivating: false, isLoading: false });
    }
  };

  // Client-side search and sorting
  const sortedAndFilteredFloors = useMemo(() => {
    let list = [...floors];

    // Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(f => {
        const storeName = String(f.Store_Name ?? f.store_Name ?? '').toLowerCase();
        const storeCode = String(f.Store_Code ?? f.store_Code ?? '').toLowerCase();
        const floor = String(f.Store_Floor ?? f.store_Floor ?? '').toLowerCase();
        const status = String(f.Status ?? f.status ?? '').toLowerCase();
        const id = String(f.Store_Floor_ID ?? f.store_Floor_ID ?? '');
        return storeName.includes(term) || storeCode.includes(term) || floor.includes(term) || status.includes(term) || id.includes(term);
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
  }, [floors, searchTerm, sortColumn, sortDirection]);

  // Paginated slice for current page
  const paginatedData = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return sortedAndFilteredFloors.slice(start, start + pageSize);
  }, [sortedAndFilteredFloors, pageIndex, pageSize]);

  // Clean formatted data for Excel Export
  const exportFormattedFloors = useMemo(() => {
    return sortedAndFilteredFloors.map(f => ({
      Floor_ID: f.Store_Floor_ID ?? 'N/A',
      Store_Name: f.Store_Name || 'N/A',
      Store_Code: f.Store_Code || 'N/A',
      Floor: f.Store_Floor || 'N/A',
      Status: f.Status || 'Active'
    }));
  }, [sortedAndFilteredFloors]);

  // Table Columns Definition matching Floor Master Legacy Screen
  const columns = useMemo(() => [
    {
      key: 'Store_Floor_ID',
      label: 'FLOOR ID',
      align: 'center',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 700, color: '#334155' }}>
          {val ?? row?.Store_Floor_ID ?? row?.store_Floor_ID ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'Store_Name',
      label: 'STORE NAME',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#1e293b' }}>
          {val ?? row?.Store_Name ?? row?.store_Name ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'Store_Floor',
      label: 'FLOOR',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: '#334155' }}>
          {val ?? row?.Store_Floor ?? row?.store_Floor ?? 'N/A'}
        </span>
      )
    },
    {
      key: 'Status',
      label: 'FLOOR STATUS',
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
      label: 'ACTION',
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
              title="Edit Floor"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              type="button"
              className={`vmm-table-action-btn ${isActive ? 'deactivate' : 'activate'}`}
              onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
              title={isActive ? 'Mark Inactive' : 'Mark Active'}
            >
              <Power size={12} /> {isActive ? 'Inactive' : 'Active'}
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
            HOME - PAGES - MASTERS - <span className="active">FLOOR MASTER</span>
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
            {isEditing ? `EDITING FLOOR ${editingFloorId}` : 'FLOOR MASTER'} - NOTE : FIELDS MARKED WITH (*) ARE REQUIRED
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="report-search-body">
            {/* 1. Store Name Dropdown */}
            <div className="search-field">
              <label>Store Name *</label>
              <SearchableDropdown
                options={storeOptions}
                value={selectedStoreId}
                onChange={(val) => setSelectedStoreId(val ? String(val) : '')}
                placeholder="Select Store"
                disabled={isSubmitting}
              />
            </div>

            {/* 2. Floor Text Input */}
            <div className="search-field">
              <label>Floor *</label>
              <input
                type="text"
                className="vmm-auth-input"
                placeholder="Enter Floor"
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>

            {/* Action Buttons */}
            <div className="search-buttons">
              <SearchButton
                onClick={handleSubmit}
                disabled={isSubmitting}
                label={isEditing ? 'Update Floor' : 'Submit'}
              />
              <ClearButton
                onClick={resetForm}
                disabled={isSubmitting}
                label={isEditing ? 'Cancel Edit' : 'Clear'}
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
          exportData={exportFormattedFloors}
          isLoading={isLoading}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={pageSize}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPageIndex(1);
          }}
          totalRecords={sortedAndFilteredFloors.length}
          exportFileName="Floor_Master_Directory.xlsx"
          searchPlaceholder="Search records..."
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
        onClose={() => setConfirmModal({ isOpen: false, floor: null, isActivating: false, isLoading: false })}
        onConfirm={handleConfirmToggle}
        title={confirmModal.isActivating ? 'Activate Floor Location' : 'Deactivate Floor Location'}
        message={
          <div>
            Are you sure you want to {confirmModal.isActivating ? 'activate' : 'deactivate'} floor{' '}
            <strong style={{ color: '#0f172a' }}>"{confirmModal.floor?.Store_Floor}"</strong> for store{' '}
            <strong style={{ color: '#0f172a' }}>"{confirmModal.floor?.Store_Name}"</strong>?
            {!confirmModal.isActivating && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626', fontWeight: 500 }}>
                This floor will be marked inactive across store encoding and audit operations.
              </div>
            )}
          </div>
        }
        confirmText={confirmModal.isActivating ? 'Activate Floor' : 'Deactivate Floor'}
        confirmVariant={confirmModal.isActivating ? 'success' : 'danger'}
        isLoading={confirmModal.isLoading}
      />
    </AppLayout>
  );
}
