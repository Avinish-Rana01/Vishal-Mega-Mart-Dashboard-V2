import React, { useState, useEffect, useRef, useId } from 'react';
import { Store, Search, ChevronDown, Check } from 'lucide-react';
import { STORES_LIST } from '../../utils/filterConstants';
import { LP_EVENTS, notifyPopoverOpened } from '../../../../services/lossPreventionService';

/**
 * StoreFilter Component
 * Standalone, reusable dropdown component for selecting a store with search.
 */
export default function StoreFilter({
  selectedStore: controlledStore,
  defaultStore = 'all',
  onStoreChange,
  stores = STORES_LIST,
  className = '',
}) {
  const [internalStore, setInternalStore] = useState(defaultStore);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const popoverId = useId();

  const currentStoreId = controlledStore !== undefined ? controlledStore : internalStore;
  const currentStore = stores.find((s) => s.id === currentStoreId) || stores[0] || {
    id: 'all',
    storeCode:'',
    name: 'All Stores',
    location: '',
  };

  // Close dropdown on outside click, Escape key, or when another LP dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleOtherPopover = (e) => {
      if (e.detail?.source !== popoverId) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener(LP_EVENTS.POPOVER_OPEN, handleOtherPopover);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(LP_EVENTS.POPOVER_OPEN, handleOtherPopover);
    };
  }, [isOpen, popoverId]);

  const handleToggle = () => {
    const nextOpen = !isOpen;
    if (nextOpen) {
      notifyPopoverOpened(popoverId);
    }
    setIsOpen(nextOpen);
  };

  const handleSelect = (storeId) => {
    if (controlledStore === undefined) {
      setInternalStore(storeId);
    }
    setIsOpen(false);
    setSearchQuery('');
    if (onStoreChange) {
      onStoreChange(storeId);
    }
  };

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.storeCode && s.storeCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="h-8.5 px-3 bg-white border border-slate-200/90 hover:border-slate-300 rounded-lg flex items-center justify-between gap-2 text-xs font-medium text-slate-700 shadow-2xs transition-all cursor-pointer min-w-[175px] sm:min-w-[210px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          <Store className="w-3.5 h-3.5 text-[#00a8e7] shrink-0" />
          <span className="truncate">{currentStore.name}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {/* Store Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search store name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-xs bg-white rounded-md border border-slate-200 outline-none focus:border-[#00a8e7] focus:ring-1 focus:ring-[#00a8e7]/20 transition-all text-slate-900 placeholder-slate-400"
                autoFocus
              />
            </div>
          </div>

          {/* Store List */}
          <div className="max-h-52 overflow-y-auto py-1" role="listbox">
            {filteredStores.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-slate-400 font-medium text-center">
                No matching stores found
              </p>
            ) : (
              filteredStores.map((store) => {
                const isSelected = currentStoreId === store.id;
                return (
                  <button
                    key={store.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(store.id)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#00a8e7]/10 text-[#00a8e7] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-900 truncate text-xs">
                        {store.storeCode?.trim() ? `${store.storeCode} - ${store.name}` : store.name}
                      </p>
                      <p className="text-[10.5px] text-slate-500">{store.location}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#00a8e7] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
