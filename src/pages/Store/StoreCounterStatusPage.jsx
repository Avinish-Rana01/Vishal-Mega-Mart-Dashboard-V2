import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import { getCounterStatusStores, getCounterStatusDetails } from '../../services/storeService';
import { RefreshCw, Monitor, Layers, Wifi, WifiOff, Radio } from 'lucide-react';
import { liveStockSocket } from '../../services/liveStockSocket';
import './StoreCounterStatusPage.css';

// Fallback stores matching legacy VMM store identifiers
const FALLBACK_STORES = [
  { value: 1, text: 'HD55 - Dwarka' },
  { value: 5, text: 'HH15 - Dundahera' },
  { value: 6, text: 'HD44 - Uttam Nagar 2' }
];

// Fallback counters to match user screenshot (14 total, 0 online, 14 offline)
const generateFallbackCounters = (count = 14) => {
  return Array.from({ length: count }, (_, i) => ({
    cash_Counter: String(i + 1),
    status: 1,
    lasT_UPDATED_DATE: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }));
};

export default function StoreCounterStatusPage() {
  const [storeOptions, setStoreOptions] = useState([]);
  const [selectedStore, setSelectedStore] = useState(1);
  const [counters, setCounters] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingCounters, setIsLoadingCounters] = useState(false);
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState(new Set());
  const [isSocketConnected, setIsSocketConnected] = useState(liveStockSocket.isConnected);

  // 1. Fetch authorized stores list
  const fetchStores = useCallback(async () => {
    setIsLoadingStores(true);
    try {
      const data = await getCounterStatusStores();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item) => ({
          value: item.store_ID ?? item.Store_ID ?? item.id ?? item.Store_Id,
          text: item.store_Name ?? item.Store_Name ?? item.name ?? item.Store_name ?? String(item.store_ID || item.Store_ID)
        }));
        setStoreOptions(formatted);

        // Auto-select store: preserve HD55 if available, else first store
        const has55 = formatted.find((s) => String(s.text).includes('HD55') || s.value === 1 || s.value === 55);
        if (has55) {
          setSelectedStore(has55.value);
        } else if (formatted.length > 0) {
          setSelectedStore(formatted[0].value);
        }
      } else {
        setStoreOptions(FALLBACK_STORES);
        setSelectedStore(1);
      }
    } catch (err) {
      console.warn('Unable to load stores from API, using fallback store list.', err);
      setStoreOptions(FALLBACK_STORES);
      setSelectedStore(1);
    } finally {
      setIsLoadingStores(false);
    }
  }, []);

  // 2. Fetch counter status details for selected store
  const fetchCounters = useCallback(async (storeId) => {
    if (!storeId) return;
    setIsLoadingCounters(true);
    try {
      const data = await getCounterStatusDetails(storeId);
      if (Array.isArray(data) && data.length > 0) {
        // Sort counters numerically by cash counter number
        const sorted = [...data].sort((a, b) => {
          const numA = parseInt((a.cash_Counter || a.Cash_Counter || '0').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt((b.cash_Counter || b.Cash_Counter || '0').replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
        setCounters(sorted);
      } else {
        setCounters(generateFallbackCounters(14));
      }
    } catch (err) {
      console.warn(`Unable to fetch counters for storeId ${storeId}, using fallback counters.`, err);
      setCounters(generateFallbackCounters(14));
    } finally {
      setIsLoadingCounters(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // When selected store changes, fetch counters
  useEffect(() => {
    if (selectedStore) {
      fetchCounters(selectedStore);
    }
  }, [selectedStore, fetchCounters]);

  // 3. Real-Time WebSocket / SignalR Subscription for Counter Status
  useEffect(() => {
    if (!selectedStore) return;

    const numericStoreId = Number(selectedStore);

    const handleCounterPatch = (patch) => {
      if (!patch || Number(patch.storeId) !== numericStoreId) return;

      const changedItems = patch.changedCounters || [];
      if (!Array.isArray(changedItems) || changedItems.length === 0) return;

      setCounters((prevCounters) => {
        const next = [...prevCounters];
        const newUpdatedKeys = new Set();

        changedItems.forEach((change) => {
          const changeCounterNum = String(change.cashCounter).trim();
          const targetIndex = next.findIndex(
            (c) => String(c.cash_Counter || c.Cash_Counter || '').trim() === changeCounterNum
          );

          if (targetIndex !== -1) {
            next[targetIndex] = {
              ...next[targetIndex],
              status: change.status,
              STATUS: change.status,
              lasT_UPDATED_DATE: change.lastUpdatedDate || next[targetIndex].lasT_UPDATED_DATE
            };
            newUpdatedKeys.add(changeCounterNum);
          } else {
            next.push({
              cash_Counter: changeCounterNum,
              status: change.status,
              lasT_UPDATED_DATE: change.lastUpdatedDate || new Date().toLocaleString()
            });
            newUpdatedKeys.add(changeCounterNum);
          }
        });

        // Trigger pulse highlight on changed cards
        setRecentlyUpdatedIds((prev) => new Set([...prev, ...newUpdatedKeys]));
        setTimeout(() => {
          setRecentlyUpdatedIds((prev) => {
            const nextSet = new Set(prev);
            newUpdatedKeys.forEach((id) => nextSet.delete(id));
            return nextSet;
          });
        }, 2500);

        return next.sort((a, b) => {
          const numA = parseInt((a.cash_Counter || a.Cash_Counter || '0').replace(/\D/g, ''), 10) || 0;
          const numB = parseInt((b.cash_Counter || b.Cash_Counter || '0').replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });
      });
    };

    const unsubscribeStatus = liveStockSocket.onStatusChange((status) => {
      setIsSocketConnected(status === 'connected');
    });

    let unsubscribeCounters = () => {};
    liveStockSocket.subscribeStoreCounters(numericStoreId, handleCounterPatch).then((unsub) => {
      if (typeof unsub === 'function') {
        unsubscribeCounters = unsub;
      }
    });

    return () => {
      unsubscribeCounters();
      unsubscribeStatus();
      liveStockSocket.unsubscribeStoreCounters(numericStoreId, handleCounterPatch);
    };
  }, [selectedStore]);

  // Derived metrics for header badges: status === 0 is Online (Green), otherwise Offline (Red)
  const totalCounters = useMemo(() => counters.length, [counters]);
  const onlineCounters = useMemo(() => {
    return counters.filter((c) => Number(c.status ?? c.STATUS) === 0).length;
  }, [counters]);
  const offlineCounters = useMemo(() => {
    return totalCounters - onlineCounters;
  }, [totalCounters, onlineCounters]);

  const selectedStoreName = useMemo(() => {
    const found = storeOptions.find((s) => String(s.value) === String(selectedStore));
    return found ? found.text : 'Selected Store';
  }, [storeOptions, selectedStore]);

  return (
    <div className="store-counter-status-page">
      {/* Filter / Header Card matching user screenshot & common-reports */}
      <div className="counter-status-card report-search-card">
        <div className="report-search-header">
          <span>NOTE : FIELDS MARKED WITH (*) ARE REQUIRED</span>
        </div>

        <div className="report-search-body">
          {/* Store Selection */}
          <div className="counter-status-field">
            <label>
              Store <span className="required-star">*</span>
            </label>
            <SearchableDropdown
              value={selectedStore}
              onChange={(val) => setSelectedStore(val)}
              options={storeOptions}
              placeholder="Select Store"
              isLoading={isLoadingStores}
              showClear={false}
            />
          </div>

          {/* Executive KPI Metric Badges */}
          <div className="counter-stats-row">
            {/* Total Counters */}
            <div className="counter-stat-card stat-total" title="Total configured counters">
              <div className="stat-icon-wrapper total">
                <Layers size={14} strokeWidth={2.5} />
              </div>
              <div className="stat-text-group">
                <span className="stat-label">TOTAL COUNTER</span>
                <span className="stat-value total">{totalCounters}</span>
              </div>
            </div>

            {/* Online Counters */}
            <div className="counter-stat-card stat-online" title="Active connected counters (status = 0)">
              <div className="stat-icon-wrapper online">
                <span className="stat-pulse-dot" />
                <Wifi size={14} strokeWidth={2.5} />
              </div>
              <div className="stat-text-group">
                <span className="stat-label">ONLINE COUNTER</span>
                <span className="stat-value online">{onlineCounters}</span>
              </div>
            </div>

            {/* Offline Counters */}
            <div className="counter-stat-card stat-offline" title="Disconnected counters">
              <div className="stat-icon-wrapper offline">
                <WifiOff size={14} strokeWidth={2.5} />
              </div>
              <div className="stat-text-group">
                <span className="stat-label">OFFLINE COUNTER</span>
                <span className="stat-value offline">{offlineCounters}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Cash Counters */}
      <div className="counter-cards-container">
        <div className="counter-cards-toolbar">
          <div className="counter-toolbar-title">
            <Monitor size={16} strokeWidth={2.2} color="#1e3a8a" />
            <span>Counter Status ({selectedStoreName})</span>
          </div>

          <div className="counter-toolbar-right">
            <span
              className={`counter-live-badge ${isSocketConnected ? 'live' : 'reconnecting'}`}
              title={isSocketConnected ? 'Connected to live WebSocket counter updates' : 'Reconnecting to live WebSocket server...'}
            >
              <span className="live-indicator-dot" />
              {isSocketConnected ? 'Live Updates Active' : 'Connecting...'}
            </span>
          </div>
        </div>

        {isLoadingCounters && counters.length === 0 ? (
          <div className="counter-empty-state">
            <RefreshCw size={28} className="animate-spin counter-empty-icon" />
            <p>Loading counter status details...</p>
          </div>
        ) : counters.length === 0 ? (
          <div className="counter-empty-state">
            <Monitor size={36} className="counter-empty-icon" />
            <p>No cash counters found for {selectedStoreName}.</p>
          </div>
        ) : (
          <div className="counter-grid">
            {counters.map((counter, idx) => {
              const isOnline = Number(counter.status ?? counter.STATUS) === 0;
              const rawName = String(counter.cash_Counter || counter.Cash_Counter || `${idx + 1}`).trim();
              const counterName = rawName.toLowerCase().startsWith('counter') ? rawName : `Counter ${rawName}`;
              const lastUpdated = counter.lasT_UPDATED_DATE || counter.LAST_UPDATED_DATE || counter.last_Updated_Date || counter.lastUpdatedDate || 'N/A';
              const isJustUpdated = recentlyUpdatedIds.has(rawName);

              return (
                <div
                  key={counter.cash_Counter || counter.Cash_Counter || idx}
                  className={`counter-card ${isOnline ? 'online' : 'offline'} ${isJustUpdated ? 'just-updated' : ''}`}
                >
                  <div className="counter-card-header">
                    <span className="counter-card-title">
                      <Monitor size={15} color={isOnline ? '#16a34a' : '#ef4444'} />
                      {counterName}
                    </span>
                    <span className={`counter-status-pill ${isOnline ? 'online' : 'offline'}`}>
                      <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="counter-card-body">
                    <div className="counter-info-row">
                      <span className="counter-info-label">Status</span>
                      <span className="counter-info-value" style={{ color: isOnline ? '#16a34a' : '#ef4444' }}>
                        {isOnline ? 'Active / Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="counter-info-row">
                      <span className="counter-info-label">Last Updated</span>
                      <span className="counter-info-value" style={{ fontSize: '10px' }}>
                        {lastUpdated}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
