import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Clock,
  Store,
  TagX,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchDashboardRecord,
  subscribeToLiveStream,
  normalizeSingleIncident,
  onDashboardSync,
  isTodayIncident,
  getSavedStore,
  LP_EVENTS,
  notifyPopoverOpened,
} from '../../../../services/lossPreventionService';

/**
 * Live Loss Alerts notification bell shifted into VMM's top Header
 * while the Loss Prevention tab is active.
 */
export default function LossPreventionHeaderControls() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [lossCount, setLossCount] = useState(0);
  const [isBlinkingBadge, setIsBlinkingBadge] = useState(false);
  const [blinkingAlertId, setBlinkingAlertId] = useState(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const notificationsRef = useRef(null);
  const popoverId = useId();
  const prevCountRef = useRef(0);
  const prevAlertIdsRef = useRef([]);
  const badgeTimerRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const selectedStoreRef = useRef(getSavedStore() || null);
  const handleIncomingRef = useRef(null);

  const triggerNotificationBlink = useCallback((latestId) => {
    setIsBlinkingBadge(true);
    if (latestId) setBlinkingAlertId(latestId);

    if (badgeTimerRef.current) {
      clearTimeout(badgeTimerRef.current);
    }
    badgeTimerRef.current = setTimeout(() => {
      setIsBlinkingBadge(false);
      setBlinkingAlertId(null);
    }, 10000);
  }, []);

  const loadLossAlerts = useCallback((storeParam = selectedStoreRef.current, forceBlink = false) => {
    const store = storeParam || getSavedStore();
    const payload = {};
    if (store && !store.noStore) {
      const sId = Number(store.storeId ?? store.id);
      if (!isNaN(sId) && sId > 0) {
        payload.StoreId = sId;
      }
      if (store.storeCode) {
        payload.StoreCode = store.storeCode;
      }
    }
    fetchDashboardRecord(payload)
      .then((data) => {
        if (data && handleIncomingRef.current) {
          handleIncomingRef.current(data, forceBlink);
        }
      })
      .catch((err) => {
        console.error('Failed to load Loss Prevention alerts in header:', err);
      });
  }, []);

  const handleIncomingDashboardData = useCallback(
    (data, forceBlink = false) => {
      if (!data) return;

      if (data.event === 'new_record' || data.hasNew) {
        loadLossAlerts(selectedStoreRef.current, true);
        return;
      }

      if (
        data.Summary ||
        data.totalTags != null ||
        data.theftAlerts != null ||
        Array.isArray(data.incidents)
      ) {
        const storeCodeFallback = selectedStoreRef.current?.storeCode || '';
        const storeNameFallback =
          selectedStoreRef.current?.cleanName || selectedStoreRef.current?.storeName || '';
        const rawList = Array.isArray(data.incidents) ? data.incidents : [];
        const incidentList = rawList.map((inc) => ({
          ...inc,
          storeCode: inc.storeCode || storeCodeFallback,
          storeName: inc.storeName || storeNameFallback,
        }));
        const currentDayAlerts = incidentList.filter((item) => isTodayIncident(item.date));
        let finalAlerts = currentDayAlerts.length > 0 ? currentDayAlerts : incidentList;

        const prevIds = new Set(prevAlertIdsRef.current);
        const newlyAdded = finalAlerts.filter((item) => !prevIds.has(item.id || item.epc));

        const count =
          data.theftAlerts != null || data.loss != null
            ? Number(String(data.loss ?? data.theftAlerts).replace(/[^\d]/g, ''))
            : finalAlerts.length;

        const shouldBlink =
          forceBlink ||
          (!isInitialMountRef.current &&
            (newlyAdded.length > 0 ||
              count > prevCountRef.current ||
              finalAlerts.length > prevAlertIdsRef.current.length));

        if (shouldBlink && finalAlerts.length > 0) {
          const latestItem = newlyAdded.length > 0 ? newlyAdded[0] : finalAlerts[0];
          finalAlerts = [
            latestItem,
            ...finalAlerts.filter((i) => (i.id || i.epc) !== (latestItem.id || latestItem.epc)),
          ];
          triggerNotificationBlink(latestItem.id);
        } else if (shouldBlink && count > 0) {
          triggerNotificationBlink();
        }

        isInitialMountRef.current = false;
        prevAlertIdsRef.current = finalAlerts.map((i) => i.id || i.epc);
        prevCountRef.current = count;
        setAlerts(finalAlerts);
        setLossCount(count);
      } else if (Array.isArray(data)) {
        const newAlerts = data.map(normalizeSingleIncident).filter(Boolean);
        if (newAlerts.length > 0) {
          const latestItem = newAlerts[0];
          setAlerts((prev) => {
            const existingEpcs = new Set(prev.map((a) => a.epc || a.id));
            const unique = newAlerts.filter((a) => !existingEpcs.has(a.epc || a.id));
            if (unique.length === 0) return prev;
            const updated = [...unique, ...prev];
            prevAlertIdsRef.current = updated.map((i) => i.id || i.epc);
            prevCountRef.current = updated.length;
            setLossCount(updated.length);
            triggerNotificationBlink(latestItem.id);
            return updated;
          });
        }
      } else if (data.EPC || data.EpcCode || data.ArticleDescription) {
        const newAlert = normalizeSingleIncident(data);
        if (newAlert) {
          setAlerts((prev) => {
            const exists = prev.some((a) => (a.epc && a.epc === newAlert.epc) || a.id === newAlert.id);
            if (exists) return prev;
            const updated = [newAlert, ...prev];
            prevAlertIdsRef.current = updated.map((i) => i.id || i.epc);
            prevCountRef.current = updated.length;
            setLossCount(updated.length);
            triggerNotificationBlink(newAlert.id);
            return updated;
          });
        }
      }
    },
    [triggerNotificationBlink, loadLossAlerts],
  );

  handleIncomingRef.current = handleIncomingDashboardData;

  useEffect(() => {
    loadLossAlerts();

    const handleStoreChange = (e) => {
      const newStore = e.detail;
      if (newStore) {
        selectedStoreRef.current = newStore;
        loadLossAlerts(newStore, false);
      }
    };
    window.addEventListener(LP_EVENTS.STORE_CHANGED, handleStoreChange);

    const unsubscribeSync = onDashboardSync((syncedData) => {
      handleIncomingDashboardData(syncedData);
    });

    const unsubscribeStream = subscribeToLiveStream(
      (liveData) => {
        handleIncomingDashboardData(liveData);
      },
      (err) => {
        console.warn('Loss Prevention header live stream warning:', err);
      },
    );

    return () => {
      window.removeEventListener(LP_EVENTS.STORE_CHANGED, handleStoreChange);
      unsubscribeSync();
      unsubscribeStream();
      if (badgeTimerRef.current) {
        clearTimeout(badgeTimerRef.current);
      }
    };
  }, [loadLossAlerts, handleIncomingDashboardData]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setNotificationsOpen(false);
    };
    const handleOtherPopover = (e) => {
      if (e.detail?.source !== popoverId) {
        setNotificationsOpen(false);
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
  }, [notificationsOpen, popoverId]);

  return (
    <div className="lp-module-root lp-bell-root flex items-center">
      {/* Live Loss Alerts Bell */}
      <div ref={notificationsRef} className="relative">
        <button
          type="button"
          onClick={() => {
            const nextState = !notificationsOpen;
            if (nextState) {
              notifyPopoverOpened(popoverId);
              loadLossAlerts(selectedStoreRef.current);
            }
            setNotificationsOpen(nextState);
          }}
          className={`w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all relative cursor-pointer ${
            isBlinkingBadge ? 'border-rose-300 bg-rose-50/60' : ''
          }`}
          title="Loss & Security Alerts"
          aria-label="Loss and Security Alerts"
        >
          <Bell className={`w-4 h-4 transition-colors ${isBlinkingBadge ? 'text-rose-600' : 'text-slate-700'}`} />
          <span
            className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-[#EF5350] text-white font-extrabold text-[9.5px] rounded-full flex items-center justify-center ring-2 ring-white shadow-xs transition-all duration-300 ${
              isBlinkingBadge ? 'animate-badge-blink' : ''
            }`}
          >
            {lossCount}
          </span>
        </button>

        {notificationsOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-[2000]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Security Alerts</span>
                <span className="text-[10px] font-bold text-[#007ba8] bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full">
                  Today
                </span>
              </div>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                {lossCount} New
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                No security alerts for today
              </div>
            ) : (
              <div
                className={`space-y-2.5 mt-3 ${
                  showAllAlerts ? 'max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar pr-1' : ''
                }`}
              >
                {(showAllAlerts ? alerts : alerts.slice(0, 3)).map((item) => {
                  const isCheckout =
                    item.type === 'Untagged' ||
                    item.type === 'Checkout' ||
                    item.status === 'Untagged' ||
                    item.status === 'Checkout';

                  return (
                    <div
                      key={item.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                        item.id === blinkingAlertId
                          ? 'bg-rose-50/80 border-2 border-rose-500 shadow-md ring-2 ring-rose-400/40 animate-pulse'
                          : 'hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isCheckout ? 'bg-sky-100 text-[#00a8e7]' : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {isCheckout ? <TagX className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="font-bold text-slate-900 text-xs truncate leading-tight">
                            {item.articleDescription}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.id === blinkingAlertId && (
                              <span className="shrink-0 text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-rose-600 text-white rounded">
                                Latest
                              </span>
                            )}
                            <span
                              className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                                isCheckout
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {item.status || item.type || 'Loss'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-medium">Article No:</span>
                            <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200/80">
                              {item.articleNo}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-900 text-[10.5px]">
                            {item.amount && item.amount !== 'N/A' && item.amount !== 'NA'
                              ? (String(item.amount).startsWith('₹') ? item.amount : `₹${item.amount}`)
                              : '₹0'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10.5px]">
                          <div className="flex items-center gap-1 text-slate-600 truncate min-w-0">
                            <Store className="w-3 h-3 text-[#00a8e7] shrink-0" />
                            <span className="truncate font-semibold text-slate-900">
                              {item.storeCode && item.storeName
                                ? `${item.storeCode} - ${item.storeName}`
                                : (item.storeName || item.storeCode || item.date || 'Main Store')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 shrink-0 font-medium">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {alerts.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllAlerts(!showAllAlerts)}
                className="w-full mt-3 py-1.5 px-3 text-xs font-semibold text-[#00a8e7] hover:text-[#0084b6] hover:bg-sky-50 rounded-xl transition-all border border-sky-100 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{showAllAlerts ? 'View Less' : `View More (${alerts.length - 3} more)`}</span>
                {showAllAlerts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
