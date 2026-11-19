import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../common/PageHeader';
import SelectedStore from '../common/SelectedStore';
import DateFilter from '../common/DateFilter';
import StatCard from '../common/StatCard';
import TagStatusDistributionChart from './TagStatusDistributionChart';
import TopStolenData from './TopStolenData';
import TheftByTimeOfDay from './TheftByTimeOfDay';
import TheftByDayOfWeek from './TheftByDayOfWeek';
import { Tag, TagX, AlertTriangle, TrendingDown } from 'lucide-react';
import { fetchAnalyticsDashboard, getSavedStore } from '../../../../services/lossPreventionService';

const formatApiDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AnalyticsView = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const todayStr = formatApiDate(new Date());
  const [datePayload, setDatePayload] = useState({
    StartDate: todayStr,
    EndDate: todayStr,
    FromDate: todayStr,
    ToDate: todayStr,
  });
  const [currentStore, setCurrentStore] = useState(() => getSavedStore() || null);
  const [metrics, setMetrics] = useState({
    totalTags: '0',
    untagged: '0',
    checkout: '0',
    theftAlerts: '0',
    loss: '0',
    potentialLoss: '₹0'
  });

  const loadMetrics = useCallback(async (payload) => {
    setLoading(true);
    try {
      const data = await fetchAnalyticsDashboard(payload);
      if (data) {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics dashboard metrics:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const store = currentStore || getSavedStore();
        const payload = { ...datePayload };
        if (store && !store.noStore) {
          const sId = Number(store.storeId ?? store.id);
          if (!isNaN(sId) && sId > 0) payload.StoreId = sId;
          if (store.storeCode) payload.StoreCode = store.storeCode;
        }
        const data = await fetchAnalyticsDashboard(payload);
        if (!ignore && data) {
          setMetrics(data);
        }
      } catch (error) {
        console.error('Failed to load analytics dashboard metrics:', error);
      } finally {
        if (!ignore) setInitialLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // Listen to store changes from top bar or other views
  useEffect(() => {
    const handleGlobalStoreChange = (e) => {
      const newStore = e.detail;
      if (newStore) {
        setCurrentStore(newStore);
        const payload = { ...datePayload };
        if (!newStore.noStore) {
          const sId = Number(newStore.storeId ?? newStore.id);
          if (!isNaN(sId) && sId > 0) payload.StoreId = sId;
          if (newStore.storeCode) payload.StoreCode = newStore.storeCode;
        }
        setDatePayload(payload);
        loadMetrics(payload);
      }
    };
    window.addEventListener('lp-store-changed', handleGlobalStoreChange);
    return () => window.removeEventListener('lp-store-changed', handleGlobalStoreChange);
  }, [datePayload, loadMetrics]);

  const handleDateChange = (label, rangeInfo) => {
    let start = '';
    let end = '';

    if (rangeInfo?.startDate && rangeInfo?.endDate) {
      start = formatApiDate(rangeInfo.startDate);
      end = formatApiDate(rangeInfo.endDate);
    } else {
      const today = new Date();
      if (label === 'Today') {
        start = formatApiDate(today);
        end = formatApiDate(today);
      } else if (label === 'Yesterday') {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        start = formatApiDate(y);
        end = formatApiDate(y);
      } else if (label === 'Last 7 Days') {
        const d7 = new Date(today);
        d7.setDate(today.getDate() - 6);
        start = formatApiDate(d7);
        end = formatApiDate(today);
      } else if (label === 'This Month') {
        const mStart = new Date(today.getFullYear(), today.getMonth(), 1);
        start = formatApiDate(mStart);
        end = formatApiDate(today);
      } else if (label === 'Last 30 Days') {
        const d30 = new Date(today);
        d30.setDate(today.getDate() - 29);
        start = formatApiDate(d30);
        end = formatApiDate(today);
      } else {
        start = formatApiDate(today);
        end = formatApiDate(today);
      }
    }

    const payload = {
      StartDate: start,
      EndDate: end,
      FromDate: start,
      ToDate: end,
    };

    const store = currentStore || getSavedStore();
    if (store) {
      const sId = Number(store.storeId ?? store.id);
      if (!isNaN(sId) && sId > 0) payload.StoreId = sId;
      if (store.storeCode) payload.StoreCode = store.storeCode;
    }

    setDatePayload(payload);
    loadMetrics(payload);
  };

  const handleStoreChange = (storeObj) => {
    const store = typeof storeObj === 'object' ? storeObj : { storeId: storeObj, storeCode: storeObj };
    setCurrentStore(store);
    setLoading(true);
    setTimeout(async () => {
      const payload = { ...datePayload };
      if (store) {
        const sId = Number(store.storeId ?? store.id);
        if (!isNaN(sId) && sId > 0) payload.StoreId = sId;
        if (store.storeCode) payload.StoreCode = store.storeCode;
      }
      setDatePayload(payload);
      await loadMetrics(payload);
      setLoading(false);
    }, 150);
  };

  return (
    <div className="space-y-4 sm:space-y-5 xl:space-y-6">
      {/* 1. Header with Store & Date Range Filters */}
      <PageHeader title="Analytics">
        <SelectedStore onStoreChange={handleStoreChange} />
        <DateFilter onDateChange={handleDateChange} />
      </PageHeader>

      {/* 2. Key Metrics Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5 xl:gap-5">
        <StatCard
          title="Total Tags"
          count={metrics.totalTags}
          icon={Tag}
          variant="green"
          loading={initialLoading}
          shimmer={loading}
        />
        <StatCard
          title="Checkout"
          count={metrics.checkout ?? metrics.untagged}
          icon={TagX}
          variant="blue"
          loading={initialLoading}
          shimmer={loading}
        />
        <StatCard
          title="Theft Alerts"
          count={metrics.loss ?? metrics.theftAlerts}
          icon={AlertTriangle}
          variant="gray"
          loading={initialLoading}
          shimmer={loading}
        />
        <StatCard
          title="Revenue Loss"
          count={metrics.potentialLoss}
          icon={TrendingDown}
          variant="rose"
          loading={initialLoading}
          shimmer={loading}
        />
      </div>

      {/* 3. Analytics Visualizations Grid (2x2 Balanced Cards, Responsive & Generous on Large Screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 xl:gap-6 items-stretch">
        {/* Row 1, Left: Tag Status Distribution (3D Isometric Pie Chart) */}
        <TagStatusDistributionChart className="h-full" metrics={metrics} />

        {/* Row 1, Right: Top Stolen Items (Target Articles & Theft Counts) */}
        <TopStolenData className="h-full" highIncidentTargets={metrics?.highIncidentTargets} />

        {/* Row 2, Left: Theft by Time of Day (Hourly Incident Bar Chart) */}
        <TheftByTimeOfDay className="h-full" hourlyThefts={metrics?.hourlyThefts} />

        {/* Row 2, Right: Theft by Day of Week (Weekly Incident Bar Chart) */}
        <TheftByDayOfWeek className="h-full" weeklyThefts={metrics?.weeklyThefts} />
      </div>
    </div>
  );
};

export default AnalyticsView;
