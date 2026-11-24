import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import { Store, Search, ChevronDown, Check, X, MapPin, RefreshCw } from 'lucide-react';
import {
  fetchStores,
  getCachedStores,
  DEFAULT_STORES,
  normalizeStore,
  getSavedStore,
  saveSelectedStore,
  LP_EVENTS,
  notifyPopoverOpened,
} from '../../../../services/lossPreventionService';

export default function SelectedStore({
  storeCode: propStoreCode,
  storeName: propStoreName,
  location: propLocation,
  className = '',
  showInfoPopover = true,
  onStoreChange,
  allowAll = false,
}) {
  const [stores, setStores] = useState(() => {
    const cached = getCachedStores();
    if (cached) return cached;
    // Only in test environment if no cached stores exist
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return DEFAULT_STORES;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const popoverId = useId();

  // Active store resolution
  const [activeStore, setActiveStore] = useState(() => {
    // 1. Explicit props take precedence
    if (propStoreCode || propStoreName) {
      return {
        storeId: '',
        storeCode: propStoreCode || '',
        storeName: propStoreName || '',
        displayText: propStoreCode && propStoreName ? `${propStoreCode} - ${propStoreName}` : (propStoreName || propStoreCode || ''),
        cleanName: propStoreName || '',
        location: propLocation || '',
      };
    }
    // 2. Saved store in storage (user-selected store)
    const saved = getSavedStore();
    if (saved && (saved.storeCode || saved.noStore)) {
      return saved;
    }
    // 3. Fallback to cached stores list (first/top store in dropdown)
    if (stores.length > 0) return stores[0];

    // 4. In test mode fallback to DEFAULT_STORES[0]
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return DEFAULT_STORES[0];
    }
    return { noStore: true, storeName: 'No stores assigned', cleanName: 'No stores assigned' };
  });

  // Sync when props change
  useEffect(() => {
    if (propStoreCode || propStoreName) {
      setActiveStore((prev) => ({
        ...prev,
        storeCode: propStoreCode ?? prev.storeCode,
        storeName: propStoreName ?? prev.storeName,
        cleanName: propStoreName ?? prev.cleanName,
        location: propLocation ?? prev.location,
      }));
    }
  }, [propStoreCode, propStoreName, propLocation]);

  const onStoreChangeRef = useRef(onStoreChange);
  useEffect(() => {
    onStoreChangeRef.current = onStoreChange;
  }, [onStoreChange]);

  // Fetch stores from API on mount
  useEffect(() => {
    let ignore = false;
    async function loadStores() {
      setLoading(true);
      try {
        const list = await fetchStores();
        if (!ignore && Array.isArray(list)) {
          setStores(list);

          // CASE 1: No stores assigned for this user
          if (list.length === 0) {
            const noStoreObj = {
              noStore: true,
              storeCode: '',
              storeId: '',
              storeName: 'No stores assigned',
              cleanName: 'No stores assigned',
              displayText: 'No stores assigned',
            };
            setActiveStore((current) => {
              if (propStoreCode || propStoreName) return current;
              return noStoreObj;
            });
            saveSelectedStore(noStoreObj);
            if (onStoreChangeRef.current) {
              onStoreChangeRef.current(noStoreObj);
            }
            return;
          }

          // CASE 2: User has stores assigned
          const saved = getSavedStore();
          let storeToSelect = null;

          // If the user previously selected a store and it exists in the fetched list:
          if (saved && saved.storeCode && saved.userSelected) {
            storeToSelect = list.find(
              (s) => s.storeCode?.toLowerCase() === saved.storeCode?.toLowerCase()
            );
          }

          // Otherwise, by default choose the top store in the dropdown (list[0])
          if (!storeToSelect) {
            storeToSelect = list[0];
          }

          if (storeToSelect) {
            if (!propStoreCode && !propStoreName &&
                (saved?.storeCode !== storeToSelect.storeCode || saved?.storeId !== storeToSelect.storeId)) {
              saveSelectedStore(storeToSelect);
            }
            setActiveStore((current) => {
              // If explicit props were provided, keep props
              if (propStoreCode || propStoreName) {
                return current;
              }
              return {
                ...storeToSelect,
                storeName: propStoreName || storeToSelect.storeName,
                cleanName: propStoreName || storeToSelect.cleanName,
              };
            });
          }
        }
      } catch (err) {
        console.warn('SelectedStore: Failed to load stores from API:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadStores();
    return () => {
      ignore = true;
    };
  }, [propStoreName, propStoreCode]);

  // Listen for global store change and reset events across tabs/views
  useEffect(() => {
    const handleGlobalStoreChange = (e) => {
      if (e.detail && (e.detail.storeCode || e.detail.noStore)) {
        if (e.detail.storeCode !== activeStore?.storeCode || e.detail.reset) {
          setActiveStore(e.detail);
          setSearchQuery('');
          setIsOpen(false);
        }
      }
    };

    const handleReset = (e) => {
      const targetStore = e?.detail || (stores.length > 0 ? stores[0] : { noStore: true, storeName: 'No stores assigned', cleanName: 'No stores assigned' });
      setActiveStore(targetStore);
      setSearchQuery('');
      setIsOpen(false);
    };

    window.addEventListener('lp-store-changed', handleGlobalStoreChange);
    window.addEventListener('lp-store-reset', handleReset);
    return () => {
      window.removeEventListener('lp-store-changed', handleGlobalStoreChange);
      window.removeEventListener('lp-store-reset', handleReset);
    };
  }, [activeStore?.storeCode, stores]);

  // Close dropdown on outside click, Escape key, or when another LP dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    const handleOtherPopover = (e) => {
      if (e.detail?.source !== popoverId) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener(LP_EVENTS.POPOVER_OPEN, handleOtherPopover);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(LP_EVENTS.POPOVER_OPEN, handleOtherPopover);
    };
  }, [isOpen, popoverId]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (showInfoPopover) {
      const nextOpen = !isOpen;
      if (nextOpen) {
        notifyPopoverOpened(popoverId);
        setSearchQuery('');
      }
      setIsOpen(nextOpen);
    }
  };

  const handleSelectStore = (store) => {
    const normalized = normalizeStore(store);
    const storeWithFlag = {
      ...normalized,
      userSelected: true,
    };
    setActiveStore(storeWithFlag);
    saveSelectedStore(storeWithFlag);
    setIsOpen(false);
    setSearchQuery('');

    if (onStoreChange) {
      onStoreChange(storeWithFlag);
    }
  };

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const list = await fetchStores();
      if (Array.isArray(list)) {
        setStores(list);
        if (list.length === 0) {
          const noStoreObj = {
            noStore: true,
            storeCode: '',
            storeId: '',
            storeName: 'No stores assigned',
            cleanName: 'No stores assigned',
            displayText: 'No stores assigned',
          };
          setActiveStore(noStoreObj);
          saveSelectedStore(noStoreObj);
          if (onStoreChangeRef.current) {
            onStoreChangeRef.current(noStoreObj);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter stores based on search query
  const filteredStores = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return stores;
    return stores.filter((s) => {
      const codeMatch = s.storeCode?.toLowerCase().includes(query);
      const nameMatch = s.storeName?.toLowerCase().includes(query);
      const cleanMatch = s.cleanName?.toLowerCase().includes(query);
      const displayMatch = s.displayText?.toLowerCase().includes(query);
      const locMatch = s.location?.toLowerCase().includes(query);
      return codeMatch || nameMatch || cleanMatch || displayMatch || locMatch;
    });
  }, [stores, searchQuery]);

  const noStoresAssigned = Boolean(
    (!loading && stores.length === 0) ||
    activeStore?.noStore === true ||
    stores.length === 0
  );

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button / Badge */}
      <button
        type="button"
        onClick={handleToggle}
        className={`h-8.5 px-3 bg-white border rounded-lg flex items-center gap-2 text-xs font-medium shadow-2xs transition-all select-none group cursor-pointer ${
          noStoresAssigned
            ? 'border-amber-200/90 hover:border-amber-300 text-slate-700 bg-amber-50/30'
            : 'border-slate-200/90 hover:border-slate-300 hover:shadow-2xs text-slate-700'
        }`}
        title={noStoresAssigned ? 'No stores assigned to your user account' : `Click to search & select store. Current: ${activeStore?.storeCode} - ${activeStore?.displayText || activeStore?.storeName}`}
        aria-label={noStoresAssigned ? 'No stores assigned' : `Selected Store: ${activeStore?.storeCode} ${activeStore?.cleanName || activeStore?.storeName}`}
        aria-expanded={isOpen}
      >
        <Store className={`w-3.5 h-3.5 shrink-0 transition-transform ${noStoresAssigned ? 'text-amber-500' : 'text-[#00a8e7] group-hover:scale-105'}`} />
        {noStoresAssigned ? (
          <span className="font-semibold text-slate-700 tracking-tight whitespace-nowrap">
            No stores assigned
          </span>
        ) : (
          <>
            {activeStore?.storeCode && (
              <span className="inline-flex items-center text-[10.5px] font-bold text-[#007ba8] bg-sky-50 border border-sky-200/80 px-1.5 py-0.5 rounded tracking-wide">
                {activeStore.storeCode}
              </span>
            )}
            <span className="font-semibold text-slate-800 tracking-tight whitespace-nowrap">
              {activeStore?.cleanName || activeStore?.storeName}
            </span>
          </>
        )}
        {showInfoPopover && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#00a8e7]' : 'group-hover:text-slate-600'
            }`}
          />
        )}
      </button>

      {/* Searchable Store Dropdown Menu */}
      {showInfoPopover && isOpen && (
        <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden text-left">
          {/* Header: Title, Store count & Connected indicator */}
          <div className="p-3 pb-2.5 border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className={`w-4 h-4 ${noStoresAssigned ? 'text-amber-500' : 'text-[#00a8e7]'}`} />
                <span className="text-xs font-bold text-slate-900">Active Store</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                  noStoresAssigned
                    ? 'text-amber-700 bg-amber-50 border-amber-200/80'
                    : 'text-[#007ba8] bg-sky-50 border border-sky-200/80'
                }`}>
                  {stores.length} {stores.length === 1 ? 'Store' : 'Stores'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  title="Refresh stores from API"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#00a8e7]' : ''}`} />
                </button>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                  noStoresAssigned
                    ? 'text-amber-700 bg-amber-50 border-amber-200/80'
                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200/80'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${noStoresAssigned ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  {noStoresAssigned ? 'Unassigned' : 'Connected'}
                </span>
              </div>
            </div>

            {/* Current Active Store Overview */}
            <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Selected Store:</span>
              {noStoresAssigned ? (
                <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded flex items-center gap-1.5 text-[11px]">
                  No stores assigned
                </span>
              ) : (
                <span className="font-semibold text-slate-800 bg-slate-100/90 px-2 py-0.5 rounded flex items-center gap-1.5">
                  {activeStore?.storeCode && (
                    <span className="text-[10px] font-bold text-[#007ba8]">{activeStore.storeCode}</span>
                  )}
                  <span className="text-slate-700 truncate max-w-[150px]">{activeStore?.cleanName || activeStore?.storeName}</span>
                </span>
              )}
            </div>
          </div>

          {/* Search Box / Store List / Empty State */}
          {noStoresAssigned ? (
            <div className="py-7 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200/70 flex items-center justify-center mx-auto mb-2.5">
                <Store className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xs font-bold text-slate-800">No stores assigned</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[210px] mx-auto leading-relaxed">
                Your user account currently has no assigned store facilities.
              </p>
            </div>
          ) : (
            <>
              {/* Search Box */}
              <div className="p-2 border-b border-slate-100 bg-slate-50/60">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search store code or name..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-white rounded-lg border border-slate-200 outline-none focus:border-[#00a8e7] focus:ring-1 focus:ring-[#00a8e7]/20 transition-all text-slate-900 placeholder-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Searchable Store List */}
              <div className="max-h-56 overflow-y-auto py-1 custom-scrollbar" role="listbox">
                {loading && stores.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading stores from API...</div>
                ) : filteredStores.length === 0 ? (
                  <div className="py-6 px-3 text-center">
                    <p className="text-xs font-semibold text-slate-600">No stores found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">No match for "{searchQuery}"</p>
                  </div>
                ) : (
                  filteredStores.map((s) => {
                    const isSelected = activeStore?.storeCode?.toLowerCase() === s.storeCode?.toLowerCase();
                    return (
                      <button
                        key={s.storeCode || s.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectStore(s)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50 text-[#007ba8] font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide shrink-0 ${
                              isSelected
                                ? 'bg-[#00a8e7] text-white'
                                : 'bg-sky-50 text-[#007ba8] border border-sky-200/80'
                            }`}
                          >
                            {s.storeCode}
                          </span>
                          <div className="truncate">
                            <p className="font-semibold text-slate-900 truncate text-xs">
                              {s.displayText || s.storeName}
                            </p>
                            {s.location && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                {s.location}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#00a8e7] shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* Footer Info note */}
          <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-[10.5px] text-slate-500 leading-relaxed">
            {noStoresAssigned
              ? 'Contact your system administrator to assign store locations to your account.'
              : 'All telemetry metrics, gate sensors, and loss incident alerts are localized to this store facility.'}
          </div>
        </div>
      )}
    </div>
  );
}

export { SelectedStore as SelectedStoreBadge };
