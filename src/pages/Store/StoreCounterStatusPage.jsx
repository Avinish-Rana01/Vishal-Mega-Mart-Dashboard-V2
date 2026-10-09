import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import { getCounterStatusStores, getCounterStatusDetails } from '../../services/storeService';
import { Monitor, Layers, Wifi, WifiOff, Calendar, Clock } from 'lucide-react';
import { liveStockSocket } from '../../services/liveStockSocket';
import { useAuth } from '../../context/AuthContext';
import './StoreCounterStatusPage.css';

// Fallback stores matching legacy VMM store identifiers
const FALLBACK_STORES = [
  { value: 1, text: 'HD55 - Dwarka' },
  { value: 5, text: 'HH15 - Dundahera' },
  { value: 6, text: 'HD44 - Uttam Nagar 2' }
];

// Helper to parse date and time cleanly
const formatSyncDateTime = (raw) => {
  if (!raw || raw === 'N/A') return { date: '--', time: '--' };
  const str = String(raw).trim();
  const parts = str.split(/\s+/);
  if (parts.length >= 2) {
    const datePart = parts[0].replace(/\//g, '-');
    const timePart = parts.slice(1).join(' ');
    return { date: datePart, time: timePart };
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const time = d.toTimeString().split(' ')[0];
    return { date: `${day}-${month}-${year}`, time };
  }
  return { date: str, time: '' };
};

// Extracts display number for the top circular badge (e.g., '1', '2', '14')
const extractCounterNumber = (rawName, fallbackIdx) => {
  if (!rawName) return String(fallbackIdx + 1);
  const cleaned = String(rawName).trim();
  const match = cleaned.match(/(?:counter\s*[-_]?\s*)?([0-9a-zA-Z]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  return cleaned || String(fallbackIdx + 1);
};

export default function StoreCounterStatusPage() {
  const { userId, userRole, storeName, storeCode } = useAuth();
  const [storeOptions, setStoreOptions] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [counters, setCounters] = useState([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingCounters, setIsLoadingCounters] = useState(false);
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState(new Set());
  const [isSocketConnected, setIsSocketConnected] = useState(liveStockSocket.isConnected);

  // 1. Fetch authorized stores list scoped to user's permissions
  const fetchStores = useCallback(async () => {
    setIsLoadingStores(true);
    try {
      const data = await getCounterStatusStores(userId);
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item) => ({
          value: item.store_ID ?? item.Store_ID ?? item.id ?? item.Store_Id,
          text: item.store_Name ?? item.Store_Name ?? item.name ?? item.Store_name ?? String(item.store_ID || item.Store_ID)
        }));
        setStoreOptions(formatted);

        // Auto-select store: if user has assigned storeCode/storeName, pick that; else fallback to HD55 or first available
        let autoSelected = null;
        if (storeName || storeCode) {
          const matched = formatted.find(s => 
            (storeCode && String(s.text).includes(storeCode)) || 
            (storeName && String(s.text).toLowerCase().includes(storeName.toLowerCase()))
          );
          if (matched) autoSelected = matched.value;
        }

        if (!autoSelected) {
          const has55 = formatted.find((s) => String(s.text).includes('HD55') || s.value === 1 || s.value === 55);
          autoSelected = has55 ? has55.value : formatted[0]?.value;
        }

        setSelectedStore(autoSelected);
      } else {
        setStoreOptions(userRole === 'Super Admin' ? FALLBACK_STORES : []);
        setSelectedStore(userRole === 'Super Admin' ? 1 : null);
      }
    } catch (err) {
      console.warn('Unable to load stores from API, using fallback store list.', err);
      setStoreOptions(userRole === 'Super Admin' ? FALLBACK_STORES : []);
      setSelectedStore(userRole === 'Super Admin' ? 1 : null);
    } finally {
      setIsLoadingStores(false);
    }
  }, [userId, userRole, storeName, storeCode]);

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
        setCounters([]);
      }
    } catch (err) {
      console.warn(`Unable to fetch counters for storeId ${storeId}.`, err);
      setCounters([]);
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
        }, 1200);

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

        <div className="report-search-body counter-status-body">
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

        {isLoadingCounters ? (
          <div className="counter-grid">
            {Array.from({ length: counters.length > 0 ? counters.length : 8 }).map((_, idx) => (
              <div key={idx} className="counter-status-tile skeleton-tile">
                <div className="tile-top-banner skeleton-banner">
                  <svg className="tile-banner-svg skeleton-banner-svg" viewBox="0 0 200 50" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M 0,0 L 200,0 L 200,30 Q 100,48 0,30 Z" fill="#e2e8f0" />
                  </svg>
                  <div className="tile-number-badge skeleton-badge skeleton-shimmer" />
                </div>
                <div className="tile-body">
                  <div className="tile-hero-row">
                    <div className="tile-icon-circle skeleton-circle skeleton-shimmer" />
                  </div>
                  <div className="tile-label-wrap">
                    <div className="skeleton-line-title skeleton-shimmer" />
                    <div className="skeleton-line-accent skeleton-shimmer" />
                  </div>
                  <div className="tile-sync-pill skeleton-pill skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : counters.length === 0 ? (
          <div className="counter-empty-state">
            <Monitor size={36} className="counter-empty-icon" />
            <p>No active counters registered for {selectedStoreName}.</p>
          </div>
        ) : (
          <div className="counter-grid">
            {counters.map((counter, idx) => {
              const isOnline = Number(counter.status ?? counter.STATUS) === 0;
              const rawName = String(counter.cash_Counter || counter.Cash_Counter || `${idx + 1}`).trim();
              const counterNumber = extractCounterNumber(rawName, idx);
              const counterLabel = rawName.toLowerCase().startsWith('counter') ? rawName : `Counter ${rawName}`;
              const lastUpdated = counter.lasT_UPDATED_DATE || counter.LAST_UPDATED_DATE || counter.last_Updated_Date || counter.lastUpdatedDate || 'N/A';
              const { date, time } = formatSyncDateTime(lastUpdated);
              const isJustUpdated = recentlyUpdatedIds.has(rawName);

              return (
                <div
                  key={counter.cash_Counter || counter.Cash_Counter || idx}
                  className={`counter-status-tile ${isOnline ? 'online' : 'offline'} ${isJustUpdated ? 'just-updated' : ''}`}
                  title={`${counterLabel} • ${isOnline ? 'Active / Online' : 'Inactive / Offline'} • Last Sync: ${lastUpdated}`}
                >
                  {/* Top Convex Curved Header Banner */}
                  <div className={`tile-top-banner ${isOnline ? 'online' : 'offline'}`}>
                    <svg className="tile-banner-svg" viewBox="0 0 200 50" preserveAspectRatio="none" aria-hidden="true">
                      <path
                        d="M 0,0 L 200,0 L 200,30 Q 100,48 0,30 Z"
                        fill={isOnline ? '#16a34a' : '#e11d2e'}
                      />
                    </svg>

                    {/* Circular Number Badge Overlapping Convex Curve */}
                    <div className={`tile-number-badge ${isOnline ? 'online' : 'offline'}`}>
                      <span>{counterNumber}</span>
                    </div>
                  </div>

                  {/* Tile Body */}
                  <div className="tile-body">
                    {/* Center Hero Row: 4 Decorative Dots (Left) + Circular POS Screen POD + 4 Decorative Dots (Right) */}
                    <div className="tile-hero-row">
                      <div className="tile-dot-matrix" aria-hidden="true">
                        <span /><span /><span /><span />
                      </div>

                      <div className={`tile-icon-circle ${isOnline ? 'online' : 'offline'}`}>
                        <svg
                          className="pos-screen-svg"
                          viewBox="0 0 36 36"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          {/* Monitor Screen Frame */}
                          <rect x="4" y="5.5" width="28" height="17" rx="3.5" strokeWidth="2.2" />
                          {/* Stand Neck and Base */}
                          <line x1="18" y1="22.5" x2="18" y2="27" strokeWidth="2.4" />
                          <line x1="12" y1="27" x2="24" y2="27" strokeWidth="2.4" />
                          {/* Shopping Cart inside Screen */}
                          <path d="M10 11h2.5l1.8 5.2h8l1.4-4.2H13" strokeWidth="2" />
                          <circle cx="15.2" cy="19" r="1.3" fill="currentColor" stroke="none" />
                          <circle cx="20.8" cy="19" r="1.3" fill="currentColor" stroke="none" />
                        </svg>
                      </div>

                      <div className="tile-dot-matrix" aria-hidden="true">
                        <span /><span /><span /><span />
                      </div>
                    </div>

                    {/* Primary Title Label & Rounded Accent Divider Line */}
                    <div className="tile-label-wrap">
                      <h4 className="tile-sync-heading">Last Sync Date/Time</h4>
                      <div className={`tile-accent-pill ${isOnline ? 'online' : 'offline'}`} />
                    </div>

                    {/* Bottom Date/Time Capsule Pill Box */}
                    <div className={`tile-sync-pill ${isOnline ? 'online' : 'offline'}`}>
                      <div className="sync-item date-item">
                        <Calendar size={11} strokeWidth={2.2} className="sync-icon" />
                        <span className="sync-text">{date}</span>
                      </div>

                      <span className="sync-divider" />

                      <div className="sync-item time-item">
                        <Clock size={11} strokeWidth={2.2} className="sync-icon" />
                        <span className="sync-text">{time}</span>
                      </div>
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
