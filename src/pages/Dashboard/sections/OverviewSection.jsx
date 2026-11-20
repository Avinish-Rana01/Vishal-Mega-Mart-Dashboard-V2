import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Store,
  Target,
  ShoppingCart,
  ClipboardList,
  RotateCcw,
  Layers,
  AlertTriangle,
  Check,
  Info,
  ChevronRight,
  ExternalLink,
  Calendar,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useAuth } from '../../../context/AuthContext';
import { useDashboardOverview } from '../../../hooks/useDashboardData';
import StatCard from '../../../modules/loss-prevention/components/common/StatCard';
import TickerNumber from '../../../modules/loss-prevention/components/common/TickerNumber';
import DashboardShimmer from '../../../components/common/DashboardShimmer';
import { DateBadge } from '../../../components/common/SectionHeader';
import {
  buildOverviewData,
  exportScorecardToExcel,
  formatIn,
} from './overviewHelpers';
import '../../../modules/loss-prevention/lossPrevention.css';
import './CycleCountShared.css';
import './OverviewSection.css';

function OverviewTrendTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="vmm-ov-trend-tooltip">
      <div className="vmm-ov-tt-date">{row.dateLabel || row.date}</div>
      {row.rfidCheckoutPct !== null && (
        <div className="vmm-ov-tt-row">
          <span className="vmm-ov-tt-dot vmm-ov-tt-dot--orange" />
          <span className="vmm-ov-tt-label">RFID checkout:</span>
          <strong className="vmm-ov-tt-val">{row.rfidCheckoutPct.toFixed(1)}%</strong>
          <span className="vmm-ov-tt-sub">({formatIn(row.rfidCheckout)} / {formatIn(row.dposSale)})</span>
        </div>
      )}
      {row.returnReencodePct !== null && (
        <div className="vmm-ov-tt-row">
          <span className="vmm-ov-tt-dot vmm-ov-tt-dot--line-blue" />
          <span className="vmm-ov-tt-label">Return re-encode:</span>
          <strong className="vmm-ov-tt-val">{row.returnReencodePct.toFixed(1)}%</strong>
          <span className="vmm-ov-tt-sub">({formatIn(row.returnEncodeQty)} / {formatIn(row.returnQty)})</span>
        </div>
      )}
      {row.dposSale > 0 && (
        <div className="vmm-ov-tt-total">
          <span>POS Volume (RFID / Gap):</span>
          <strong>{formatIn(row.rfidCheckout)} / {formatIn(row.nonRfidSale)}</strong>
        </div>
      )}
    </div>
  );
}

function ScorecardReasonTooltip({ tip }) {
  if (!tip || typeof document === 'undefined') return null;

  const viewportW = window.innerWidth || 1280;
  const maxWidth = 310;
  const half = maxWidth / 2;
  const clampedLeft = Math.max(half + 12, Math.min(viewportW - half - 12, tip.x));
  const placeBelow = tip.y < 170;

  return createPortal(
    <div
      className={`vmm-ov-hover-tip${placeBelow ? ' vmm-ov-hover-tip--below' : ''}`}
      style={{
        left: `${clampedLeft}px`,
        top: `${placeBelow ? tip.bottom + 8 : tip.y - 8}px`,
      }}
      role="tooltip"
    >
      <div className="vmm-ov-hover-tip-head">
        <span className="vmm-ov-hover-tip-title">{tip.title}</span>
        {tip.badge && <span className="vmm-ov-hover-tip-badge">{tip.badge}</span>}
      </div>
      <div className="vmm-ov-hover-tip-list">
        {tip.items.map((item, idx) => (
          <div
            key={idx}
            className={`vmm-ov-why-pill vmm-ov-why-pill--${item.severity || 'amber'} vmm-ov-hover-tip-pill`}
          >
            {item.text}
          </div>
        ))}
      </div>
      {tip.hint && <div className="vmm-ov-hover-tip-hint">{tip.hint}</div>}
    </div>,
    document.body,
  );
}

export default function OverviewSection({ onJumpToSection }) {
  const { hasSection, userRole } = useAuth();
  const { rawData, isLoading, error, highlightedStore, connectionStatus } = useDashboardOverview();
  const [sortConfig, setSortConfig] = useState({ key: null, dir: null });
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [showStatusLegend, setShowStatusLegend] = useState(true);
  const [hoverTip, setHoverTip] = useState(null);
  const scoreInfoRef = useRef(null);

  const showCellReason = useCallback((e, title, items, { badge = null, hint = null } = {}) => {
    if (!items || items.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverTip({
      x: rect.left + rect.width / 2,
      y: rect.top,
      bottom: rect.bottom,
      title,
      badge,
      items,
      hint,
    });
  }, []);

  const hideCellReason = useCallback(() => {
    setHoverTip(null);
  }, []);

  useEffect(() => {
    if (!showScoreInfo) return undefined;
    const handleOutside = (e) => {
      if (scoreInfoRef.current && !scoreInfoRef.current.contains(e.target)) {
        setShowScoreInfo(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowScoreInfo(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showScoreInfo]);

  const permissions = useMemo(() => ({
    live_stock: hasSection('live_stock'),
    cycle_count: hasSection('cycle_count'),
    store_validation: hasSection('store_validation'),
    sale: hasSection('sale'),
    void: hasSection('void'),
    return: hasSection('return'),
    dc_validation: hasSection('dc_validation'),
    dc_encoding: hasSection('dc_encoding'),
    vendor_discrepancy: hasSection('vendor_discrepancy'),
  }), [hasSection]);

  const { kpis, storeRows, dailyTrends, avgCheckoutPct, avgReturnReencodePct, attentionItems } = useMemo(
    () => buildOverviewData(rawData, permissions),
    [rawData, permissions]
  );

  const sortedRows = useMemo(() => {
    const { key, dir } = sortConfig;
    if (!key || !dir) return storeRows;

    const mult = dir === 'asc' ? 1 : -1;
    const statusOrder = { red: 0, amber: 1, green: 2 };

    const getVal = (row) => {
      switch (key) {
        case 'status':
          return statusOrder[row.statusTier] ?? null;
        case 'store':
          return row.storeName || row.storeCode || '';
        case 'score':
          return row.score;
        case 'coverage':
          return row.coveragePct;
        case 'checkout':
          return row.checkoutPct;
        case 'validation':
          return row.hasStoreValidation ? row.validationPending : null;
        case 'voidReturn':
          return (row.hasVoid || row.hasReturn)
            ? (permissions.void ? row.voidPending : 0) + (permissions.return ? row.returnPending : 0)
            : null;
        case 'dcProcessed':
          return row.hasDcValidation ? row.dcProcessed : null;
        case 'dcUnprocessed':
          return row.hasDcValidation ? row.dcUnprocessed : null;
        case 'dcArticles':
          return row.hasDcValidation ? row.dcProcessedArticleQty : null;
        case 'cycleCount':
          return row.hasCycleCount ? row.cycleCountSortKey : '';
        default:
          return null;
      }
    };

    return [...storeRows].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if ((va === null || va === '') && (vb === null || vb === '')) {
        return a.storeCode.localeCompare(b.storeCode);
      }
      if (va === null || va === '') return 1;
      if (vb === null || vb === '') return -1;
      if (typeof va === 'string' && typeof vb === 'string') {
        const cmp = va.localeCompare(vb, undefined, { numeric: true });
        return cmp !== 0 ? cmp * mult : a.storeCode.localeCompare(b.storeCode);
      }
      if (va !== vb) return (va - vb) * mult;
      return a.storeCode.localeCompare(b.storeCode);
    });
  }, [storeRows, sortConfig, permissions.void, permissions.return]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: null, dir: null };
    });
  };

  const jump = (e, sectionKey, storeCode) => {
    if (e) e.stopPropagation();
    if (!sectionKey || !permissions[sectionKey] || !onJumpToSection) return;
    onJumpToSection(sectionKey, storeCode);
  };

  if (isLoading && !rawData) {
    return <DashboardShimmer variant="live-stock" />;
  }

  if (error && !rawData) {
    return (
      <div className="cc-data-grid-card vmm-ov-scorecard" style={{ padding: '16px', color: '#EF5350', fontSize: '13px' }}>
        Unable to load executive overview: {error}
      </div>
    );
  }

  const roleScope = rawData?.roleScope || '';
  const isWarehouseOnly = !permissions.live_stock && !permissions.sale && (permissions.dc_validation || permissions.dc_encoding);
  const isWarehouseUserOnly = roleScope === 'warehouse_user' || (isWarehouseOnly && !permissions.vendor_discrepancy && !permissions.tag_management);
  const isSingleStoreView =
    !isWarehouseOnly &&
    (roleScope === 'single_store' || (storeRows.length === 1 && userRole !== 'Super Admin'));
  const singleStoreRow = isSingleStoreView ? storeRows[0] || null : null;

  const kpiCards = isWarehouseOnly
    ? [
        permissions.dc_encoding && {
          key: 'dcEncoding',
          sectionKey: 'dc_encoding',
          title: isWarehouseUserOnly ? 'My Encoding Today' : 'DC Encoding Today',
          variant: 'purple',
          value: formatIn(kpis.dcEncoding.encodedToday),
          icon: Layers,
          tooltip: isWarehouseUserOnly
            ? `Your encoded tags today • ${formatIn(kpis.dcEncoding.errors)} errors (${Number(kpis.dcEncoding.errorPct).toFixed(1)}%)`
            : `All warehouse operators today • ${formatIn(kpis.dcEncoding.errors)} errors (${Number(kpis.dcEncoding.errorPct).toFixed(1)}%)`,
        },
        permissions.dc_encoding && {
          key: 'dcErrorRate',
          sectionKey: 'dc_encoding',
          title: 'Encoding Error Rate',
          variant: kpis.dcEncoding.errorPct > 2 ? 'rose' : kpis.dcEncoding.errorPct > 0 ? 'amber' : 'green',
          value: `${Number(kpis.dcEncoding.errorPct).toFixed(1)}%`,
          icon: AlertTriangle,
          tooltip: `${formatIn(kpis.dcEncoding.errors)} encoding errors out of ${formatIn(kpis.dcEncoding.encodedToday)} tags encoded`,
        },
        permissions.dc_validation && {
          key: 'dcProcessed',
          sectionKey: 'dc_validation',
          title: 'DC Processed HUs',
          variant: 'green',
          value: formatIn(kpis.dcEncoding.processedHu),
          icon: Check,
          tooltip: `${formatIn(kpis.dcEncoding.processedHu)} HUs processed (${formatIn(kpis.dcEncoding.processedArticles)} articles) across ${storeRows.length} stores`,
        },
        permissions.dc_validation && {
          key: 'dcUnprocessed',
          sectionKey: 'dc_validation',
          title: 'DC Unprocessed HUs',
          variant: kpis.dcEncoding.unprocessedHu > 0 ? 'amber' : 'green',
          value: formatIn(kpis.dcEncoding.unprocessedHu),
          icon: ClipboardList,
          tooltip: kpis.dcEncoding.unprocessedHu > 0
            ? `${formatIn(kpis.dcEncoding.unprocessedHu)} HUs pending dispatch processing at DC`
            : 'All DC dispatch HUs processed',
        },
      ].filter(Boolean)
    : [
        permissions.live_stock && {
          key: 'stores',
          sectionKey: 'live_stock',
          title: isSingleStoreView ? 'Store Health' : 'Stores Status',
          variant: isSingleStoreView
            ? (singleStoreRow?.statusTier === 'red' ? 'rose' : singleStoreRow?.statusTier === 'amber' ? 'amber' : singleStoreRow?.statusTier === 'green' ? 'green' : 'gray')
            : 'gray',
          value: isSingleStoreView && singleStoreRow ? (
            <span className="vmm-ov-rag-inline">
              <span className={`vmm-ov-rag-item vmm-ov-rag-${singleStoreRow.statusTier === 'red' ? 'r' : singleStoreRow.statusTier === 'amber' ? 'a' : 'g'}`}>
                {singleStoreRow.statusTier === 'green' ? (
                  <Check size={15} strokeWidth={3.2} className="vmm-ov-rag-tick" aria-hidden="true" />
                ) : (
                  <AlertTriangle size={14} strokeWidth={2.5} aria-hidden="true" />
                )}
                <span>{singleStoreRow.statusLabel}</span>
              </span>
              {singleStoreRow.score !== null && (
                <span className="vmm-ov-single-score-tag">{singleStoreRow.score}/100</span>
              )}
            </span>
          ) : (
            <span className="vmm-ov-rag-inline">
              <span className="vmm-ov-rag-item vmm-ov-rag-r">
                <AlertTriangle size={14} strokeWidth={2.5} aria-hidden="true" />
                <TickerNumber value={kpis.stores.red} />
              </span>
              <span className="vmm-ov-rag-sep">/</span>
              <span className="vmm-ov-rag-item vmm-ov-rag-a">
                <AlertTriangle size={14} strokeWidth={2.5} aria-hidden="true" />
                <TickerNumber value={kpis.stores.amber} />
              </span>
              <span className="vmm-ov-rag-sep">/</span>
              <span className="vmm-ov-rag-item vmm-ov-rag-g">
                <Check size={15} strokeWidth={3.3} className="vmm-ov-rag-tick" aria-hidden="true" />
                <TickerNumber value={kpis.stores.green} />
              </span>
            </span>
          ),
          icon: Store,
          tooltip: isSingleStoreView && singleStoreRow
            ? `${singleStoreRow.storeCode} · ${singleStoreRow.statusLabel}${singleStoreRow.score !== null ? ` (Score ${singleStoreRow.score}/100)` : ''}`
            : `${kpis.stores.red} Critical (<50%), ${kpis.stores.amber} Warning (50-90%), ${kpis.stores.green} Healthy (>90%) of ${kpis.stores.total} RFID stores`,
        },
        permissions.live_stock && {
          key: 'coverage',
          sectionKey: 'live_stock',
          title: 'Stock Coverage',
          variant: 'green',
          value: `${kpis.stockCoverage.pct.toFixed(1)}%`,
          icon: Target,
          tooltip: `RFID ${formatIn(kpis.stockCoverage.rfid)} of SAP ${formatIn(kpis.stockCoverage.sap)}`,
        },
        permissions.sale && {
          key: 'checkout',
          sectionKey: 'sale',
          title: 'RFID Checkout',
          variant: 'blue',
          value: `${kpis.rfidCheckout.pct.toFixed(1)}%`,
          icon: ShoppingCart,
          tooltip: `${formatIn(kpis.rfidCheckout.rfidSale)} of ${formatIn(kpis.rfidCheckout.dposSale)} items sold • ${kpis.rfidCheckout.taggedCapturePct.toFixed(1)}% of tagged items`,
        },
        permissions.store_validation && {
          key: 'validation',
          sectionKey: 'store_validation',
          title: 'Validation Pending',
          variant: 'amber',
          value: formatIn(kpis.validationPending.pending),
          icon: ClipboardList,
          tooltip: `Of ${formatIn(kpis.validationPending.whValidated)} WH validated • ${formatIn(kpis.validationPending.wrong)} wrong HUs`,
        },
        (permissions.void || permissions.return) && {
          key: 'voidReturn',
          sectionKey: permissions.void ? 'void' : 'return',
          title: 'Void / Return Pending',
          variant: 'rose',
          value: (
            <span className="inline-flex items-baseline">
              <TickerNumber value={formatIn(kpis.voidReturnPending.voidPending)} />
              <span className="vmm-ov-slash" style={{ margin: '0 4px' }}>/</span>
              <TickerNumber value={formatIn(kpis.voidReturnPending.returnPending)} />
            </span>
          ),
          icon: RotateCcw,
          tooltip: `Not encoded back (of ${formatIn(kpis.voidReturnPending.voidTotal)} void, ${formatIn(kpis.voidReturnPending.returnTotal)} return)`,
        },
        (permissions.dc_encoding || permissions.dc_validation) && {
          key: 'dcEncoding',
          sectionKey: permissions.dc_encoding ? 'dc_encoding' : 'dc_validation',
          title: 'DC Encoding Today',
          variant: 'purple',
          value: formatIn(kpis.dcEncoding.encodedToday),
          icon: Layers,
          tooltip: `${Number(kpis.dcEncoding.errorPct).toFixed(1)}% errors • ${formatIn(kpis.dcEncoding.unprocessedHu)} HUs unprocessed at DC`,
        },
      ].filter(Boolean);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key || !sortConfig.dir) {
      return <ArrowUpDown size={10} className="vmm-ov-sort-idle" aria-hidden="true" />;
    }
    return sortConfig.dir === 'asc'
      ? <ArrowUp size={10} className="vmm-ov-sort-icon" aria-hidden="true" />
      : <ArrowDown size={10} className="vmm-ov-sort-icon" aria-hidden="true" />;
  };

  const renderSortableTh = (key, label, className = '') => (
    <th className={className || undefined}>
      <button type="button" className="vmm-ov-th-btn" onClick={() => handleSort(key)}>
        <span>{label}</span>
        {renderSortIcon(key)}
      </button>
    </th>
  );

  return (
    <div className="vmm-ov-wrapper">
      <div className="vmm-ov-legend-bar" role="note" aria-label="Overview and stores status color legend">
        <div className="vmm-ov-legend-left">
          <div className="vmm-ov-page-title-wrap">
            <h1 className="vmm-ov-page-title">Overview</h1>
            {(permissions.live_stock || isWarehouseOnly) && (
              <button
                type="button"
                className={`vmm-ov-legend-toggle${showStatusLegend ? ' is-active' : ''}`}
                onClick={() => setShowStatusLegend((prev) => !prev)}
                aria-expanded={showStatusLegend}
                aria-label={showStatusLegend ? 'Hide status legend' : 'Show status legend'}
                title={showStatusLegend ? 'Hide status legend' : 'Show status legend'}
              >
                <Info size={14} strokeWidth={2.25} className="vmm-ov-legend-icon" aria-hidden="true" />
              </button>
            )}
          </div>

          {permissions.live_stock && showStatusLegend && (
            <div className="vmm-ov-legend-items">
              <span className="vmm-ov-legend-lead">
                <span>{isSingleStoreView ? 'Store Status:' : 'Stores Status:'}</span>
              </span>
              <span className="vmm-ov-legend-item">
                <AlertTriangle size={12} strokeWidth={2.4} className="vmm-ov-rag-r" aria-hidden="true" />
                <strong className="vmm-ov-legend-code vmm-ov-legend-code--red">Critical</strong>
                <span>(&lt;50% coverage)</span>
              </span>
              <span className="vmm-ov-legend-item">
                <AlertTriangle size={12} strokeWidth={2.4} className="vmm-ov-rag-a" aria-hidden="true" />
                <strong className="vmm-ov-legend-code vmm-ov-legend-code--amber">Warning</strong>
                <span>(50%–90%)</span>
              </span>
              <span className="vmm-ov-legend-item">
                <Check size={13} strokeWidth={3.2} className="vmm-ov-rag-g vmm-ov-legend-tick" aria-hidden="true" />
                <strong className="vmm-ov-legend-code vmm-ov-legend-code--green">Healthy</strong>
                <span>(&gt;90%)</span>
              </span>
            </div>
          )}

          {isWarehouseOnly && showStatusLegend && (
            <div className="vmm-ov-legend-items">
              <span className="vmm-ov-legend-lead">
                <span>DC Dispatch Status:</span>
              </span>
              <span className="vmm-ov-legend-item">
                <AlertTriangle size={12} strokeWidth={2.4} className="vmm-ov-rag-r" aria-hidden="true" />
                <strong className="vmm-ov-legend-code vmm-ov-legend-code--red">Critical</strong>
                <span>(5+ unprocessed HUs)</span>
              </span>
              <span className="vmm-ov-legend-item">
                <AlertTriangle size={12} strokeWidth={2.4} className="vmm-ov-rag-a" aria-hidden="true" />
                <strong className="vmm-ov-legend-code vmm-ov-legend-code--amber">Warning</strong>
                <span>(1–4 unprocessed HUs)</span>
              </span>
              <span className="vmm-ov-legend-item">
                <Check size={13} strokeWidth={3.2} className="vmm-ov-rag-g vmm-ov-legend-tick" aria-hidden="true" />
                <strong className="vmm-ov-legend-code vmm-ov-legend-code--green">Healthy</strong>
                <span>(0 unprocessed)</span>
              </span>
            </div>
          )}
        </div>

        <div className="vmm-ov-legend-right">
          <div
            className={`live-sync-pill vmm-ov-live-pill ${connectionStatus || 'connecting'}`}
            title={`Real-time sync: ${connectionStatus}`}
          >
            <span className="live-sync-dot" />
            {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
          </div>
          <DateBadge />
        </div>
      </div>

      {/* Top 6 Loss Prevention StatCards in Single Row */}
      <section
        className="vmm-ov-kpi-row lp-module-root"
        style={{ '--ov-kpi-cols': Math.max(kpiCards.length, 1) }}
        aria-label="Executive KPI summary"
      >
        {kpiCards.map((card) => (
          <div
            key={card.key}
            role="button"
            tabIndex={0}
            className="vmm-ov-kpi-slot"
            onClick={(e) => jump(e, card.sectionKey)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && jump(e, card.sectionKey)}
            title={card.tooltip}
          >
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              iconSize={card.iconSize ?? 36}
              variant={card.variant}
              compact
            />
          </div>
        ))}
      </section>

      {/* Compact Store Scorecard Table Card */}
      <section className="cc-data-grid-card vmm-ov-scorecard" aria-label="Store scorecard">
        <div className="cc-data-grid-header vmm-ov-scorecard-header">
          <div className="vmm-ov-header-text">
            <h2 className="cc-data-grid-title vmm-ov-scorecard-title">
              {isWarehouseOnly ? 'DC OUTWARD DISPATCH SCORECARD' : 'STORE SCORECARD'} ({sortedRows.length}{' '}
              {sortedRows.length === 1 ? 'STORE' : 'STORES'})
            </h2>

            {!isWarehouseOnly && (
              <div className="vmm-ov-score-info-wrap" ref={scoreInfoRef}>
                <button
                  type="button"
                  className={`vmm-ov-score-info-btn${showScoreInfo ? ' is-open' : ''}`}
                  onClick={() => setShowScoreInfo((prev) => !prev)}
                  aria-expanded={showScoreInfo}
                  aria-label="How store score is calculated"
                >
                  <Info size={14} strokeWidth={2.3} aria-hidden="true" />
                </button>

                {showScoreInfo && (
                  <div className="vmm-ov-score-popover" role="dialog" aria-label="Store score calculation formula">
                    <div className="vmm-ov-sp-head">
                      <span className="vmm-ov-sp-title">Store Score Formula (0–100)</span>
                      <button
                        type="button"
                        className="vmm-ov-sp-close"
                        onClick={() => setShowScoreInfo(false)}
                        aria-label="Close formula info"
                      >
                        <X size={13} strokeWidth={2.4} />
                      </button>
                    </div>

                    <div className="vmm-ov-sp-eq">
                      Score = (Earned Points ÷ Active Weight) × 100
                    </div>

                    <div className="vmm-ov-sp-rows">
                      {permissions.live_stock && (
                        <div className="vmm-ov-sp-row">
                          <div className="vmm-ov-sp-row-top">
                            <strong>1. Live Stock Coverage</strong>
                            <span className="vmm-ov-sp-pts">45 pts</span>
                          </div>
                          <div className="vmm-ov-sp-desc">(RFID Stock ÷ SAP Stock) × 45</div>
                        </div>
                      )}

                      {permissions.sale && (
                        <div className="vmm-ov-sp-row">
                          <div className="vmm-ov-sp-row-top">
                            <strong>2. Sales &amp; RFID Checkout</strong>
                            <span className="vmm-ov-sp-pts">25 pts</span>
                          </div>
                          <div className="vmm-ov-sp-desc">(Total RFID Checkout ÷ Total POS Sale) × 25</div>
                        </div>
                      )}

                      {(permissions.store_validation || permissions.void || permissions.return || permissions.dc_validation) && (
                        <div className="vmm-ov-sp-row">
                          <div className="vmm-ov-sp-row-top">
                            <strong>3. Backlog Health</strong>
                            <span className="vmm-ov-sp-pts">30 pts</span>
                          </div>
                          <div className="vmm-ov-sp-desc">
                            30 minus capped deductions:
                            <ul className="vmm-ov-sp-list">
                              {permissions.store_validation && (
                                <li>Store Val.: 0.4 pt/pending HU (max 10) + 2 pts/wrong HU (max 5)</li>
                              )}
                              {(permissions.void || permissions.return) && (
                                <li>Void &amp; Return: 0.25 pt/pending item (max 10)</li>
                              )}
                              {permissions.dc_validation && (
                                <li>DC Val.: 2 pts/unprocessed HU (max 5)</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="vmm-ov-sp-note">
                      Normalized by active weight — if POS Sale is 0 (—), score scales out of 75 to 100.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="cc-action-btn cc-export-btn vmm-ov-excel-btn"
            onClick={() => exportScorecardToExcel(sortedRows, permissions)}
            disabled={sortedRows.length === 0}
            title={isWarehouseOnly ? 'Export DC Dispatch Scorecard to Excel' : 'Export Store Scorecard to Excel'}
          >
            <Download size={13} />
            <span>Excel</span>
          </button>
        </div>

        <div
          className={`vmm-ov-table-scroll${sortedRows.length <= 6 ? ' vmm-ov-table-scroll--fit' : ''}`}
          onScroll={hideCellReason}
        >
          <table className="vmm-ov-table">
            <thead>
              <tr>
                {renderSortableTh('status', 'STATUS')}
                {renderSortableTh('store', 'STORE')}
                {!isWarehouseOnly && renderSortableTh('score', 'SCORE', 'vmm-ov-th-score')}
                {permissions.live_stock && renderSortableTh('coverage', 'COVERAGE')}
                {permissions.sale && renderSortableTh('checkout', 'RFID CHECKOUT')}
                {permissions.store_validation && renderSortableTh('validation', 'VAL. PENDING')}
                {(permissions.void || permissions.return) && renderSortableTh('voidReturn', 'VOID / RET. PENDING')}
                {isWarehouseOnly && permissions.dc_validation && renderSortableTh('dcProcessed', 'DC PROCESSED HUs')}
                {permissions.dc_validation && renderSortableTh('dcUnprocessed', 'DC UNPROCESSED')}
                {isWarehouseOnly && permissions.dc_validation && renderSortableTh('dcArticles', 'PROCESSED ARTICLES')}
                {permissions.cycle_count && renderSortableTh('cycleCount', 'LAST CYCLE COUNT')}
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="cc-data-grid-empty-cell">
                    No store records available yet.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => {
                  const defaultJump =
                    (row.hasLiveStock && permissions.live_stock && 'live_stock') ||
                    (row.hasStoreValidation && permissions.store_validation && 'store_validation') ||
                    (row.hasSale && permissions.sale && 'sale') ||
                    (row.hasDcValidation && permissions.dc_validation && 'dc_validation') ||
                    'live_stock';

                  const barWidth = row.coveragePct !== null
                    ? `${Math.max(4, Math.min(100, row.coveragePct))}%`
                    : '0%';

                  const isUpdatedRow =
                    highlightedStore && highlightedStore === String(row.storeCode || '').toUpperCase();

                  const issueCount = row.reasons.filter((r) => r.severity !== 'green').length;
                  const reasonsBySection = (sectionKey) =>
                    row.reasons.filter((r) => r.sectionKey === sectionKey);

                  const coverageReasons = reasonsBySection('live_stock');
                  const coverageTipItems = coverageReasons.length > 0
                    ? coverageReasons
                    : [{
                        text: `Stock coverage ${row.coveragePct !== null ? row.coveragePct.toFixed(1) : 0}% (RFID ${formatIn(row.rfidStock)} of SAP ${formatIn(row.sapStock)})`,
                        severity: 'green',
                      }];

                  const saleReasons = reasonsBySection('sale');
                  const saleTipItems = saleReasons.length > 0
                    ? saleReasons
                    : [{
                        text: `RFID checkout ${row.checkoutPct !== null ? row.checkoutPct.toFixed(1) : 0}% (${formatIn(row.rfidCheckout)} of ${formatIn(row.dposSale)} sold)`,
                        severity: 'green',
                      }];

                  const valReasons = reasonsBySection('store_validation');
                  const valTipItems = valReasons.length > 0
                    ? valReasons
                    : [{
                        text: `0 HUs pending store validation (of ${formatIn(row.whValidated)} WH validated)`,
                        severity: 'green',
                      }];

                  const voidReasons = reasonsBySection('void');
                  const voidTipItems = voidReasons.length > 0
                    ? voidReasons
                    : [{
                        text: `0 void items pending re-encoding (of ${formatIn(row.voidTotal)} void)`,
                        severity: 'green',
                      }];

                  const returnReasons = reasonsBySection('return');
                  const returnTipItems = returnReasons.length > 0
                    ? returnReasons
                    : [{
                        text: `0 return items pending re-encoding (of ${formatIn(row.returnTotal)} return)`,
                        severity: 'green',
                      }];

                  const dcReasons = reasonsBySection('dc_validation');
                  const dcTipItems = dcReasons.length > 0
                    ? dcReasons
                    : [{
                        text: `0 HUs unprocessed at DC (${formatIn(row.dcProcessed)} HUs processed)`,
                        severity: 'green',
                      }];

                  const cycleTipItems = [{
                    text: `Last cycle count completed: ${row.lastCycleCount}`,
                    severity: 'green',
                  }];

                  return (
                    <tr
                      key={row.storeCode}
                      className={`vmm-ov-tr${isUpdatedRow ? ' vmm-ov-tr--updated' : ''}`}
                      onClick={(e) => {
                        hideCellReason();
                        jump(e, defaultJump, row.storeCode);
                      }}
                    >
                      <td>
                        <span
                          className={`vmm-ov-status-pill vmm-ov-status-pill--${row.statusTier} vmm-ov-hover-target`}
                          onMouseEnter={(e) =>
                            showCellReason(e, `${row.storeCode} · All Causes`, row.reasons, {
                              badge: issueCount > 0 ? `${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}` : 'Healthy',
                              hint: 'Hover any value for its specific cause',
                            })
                          }
                          onMouseLeave={hideCellReason}
                        >
                          {(row.statusTier === 'red' || row.statusTier === 'amber') && (
                            <AlertTriangle
                              size={12}
                              strokeWidth={2.4}
                              className="vmm-ov-status-icon"
                              aria-hidden="true"
                            />
                          )}
                          {row.statusTier === 'green' && (
                            <Check
                              size={12}
                              strokeWidth={2.8}
                              className="vmm-ov-status-icon"
                              aria-hidden="true"
                            />
                          )}
                          <span>{row.statusLabel}</span>
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="vmm-ov-cell-link vmm-ov-store-cell"
                          onClick={(e) => {
                            hideCellReason();
                            jump(e, defaultJump, row.storeCode);
                          }}
                          title={`Jump to ${row.storeName || row.storeCode} section`}
                        >
                          <span className="vmm-ov-store-code-badge">{row.storeCode}</span>
                          {(() => {
                            const cleanName = (row.storeName || '')
                              .replace(new RegExp(`^${row.storeCode}\\s*[-–:]\\s*`, 'i'), '')
                              .trim();
                            return cleanName && cleanName.toUpperCase() !== row.storeCode.toUpperCase() ? (
                              <span className="vmm-ov-store-name">{cleanName}</span>
                            ) : null;
                          })()}
                        </button>
                      </td>

                      {!isWarehouseOnly && (
                        <td className="vmm-ov-score-cell">
                          {row.score !== null ? (
                            <span
                              className="vmm-ov-score-hover vmm-ov-hover-target"
                              onMouseEnter={(e) =>
                                showCellReason(e, `${row.storeCode} · Score ${row.score}/100`, row.reasons, {
                                  badge: issueCount > 0 ? `${issueCount} ${issueCount === 1 ? 'cause' : 'causes'}` : 'Healthy',
                                })
                              }
                              onMouseLeave={hideCellReason}
                            >
                              <span>{row.score}</span>
                              <span className="vmm-ov-score-denom">/100</span>
                            </span>
                          ) : (
                            <span className="vmm-ov-muted">—</span>
                          )}
                        </td>
                      )}

                      {permissions.live_stock && (
                        <td>
                          {row.hasLiveStock && row.coveragePct !== null ? (
                            <button
                              type="button"
                              className="vmm-ov-cell-link vmm-ov-coverage-wrap"
                              onClick={(e) => {
                                hideCellReason();
                                jump(e, 'live_stock', row.storeCode);
                              }}
                              onMouseEnter={(e) =>
                                showCellReason(e, `${row.storeCode} · Stock Coverage`, coverageTipItems, {
                                  hint: 'Click to open Live Stock',
                                })
                              }
                              onMouseLeave={hideCellReason}
                            >
                              <span className="vmm-ov-progress-track">
                                <span
                                  className={`vmm-ov-progress-fill vmm-ov-progress-fill--${row.coverageTier}`}
                                  style={{ width: barWidth }}
                                />
                              </span>
                              <span
                                className={`vmm-ov-num-bold vmm-ov-has-reason vmm-ov-has-reason--${
                                  coverageReasons.length > 0
                                    ? row.coverageTier === 'red'
                                      ? 'red'
                                      : 'amber'
                                    : 'green'
                                }`}
                              >
                                <span>{row.coveragePct.toFixed(1)}%</span>
                                <ExternalLink size={11} className="vmm-ov-ext-icon" aria-hidden="true" />
                              </span>
                            </button>
                          ) : (
                            <span className="vmm-ov-muted">—</span>
                          )}
                        </td>
                      )}

                      {permissions.sale && (
                        <td>
                          {row.hasSale && row.checkoutPct !== null ? (
                            <button
                              type="button"
                              className={`vmm-ov-cell-link vmm-ov-num-bold vmm-ov-has-reason vmm-ov-has-reason--${
                                saleReasons.length > 0
                                  ? row.checkoutPct < 50
                                    ? 'red'
                                    : 'amber'
                                  : 'green'
                              }`}
                              onClick={(e) => {
                                hideCellReason();
                                jump(e, 'sale', row.storeCode);
                              }}
                              onMouseEnter={(e) =>
                                showCellReason(e, `${row.storeCode} · RFID Checkout`, saleTipItems, {
                                  hint: 'Click to open Sales & Checkout',
                                })
                              }
                              onMouseLeave={hideCellReason}
                            >
                              <span>{row.checkoutPct.toFixed(1)}%</span>
                              <ExternalLink size={11} className="vmm-ov-ext-icon" aria-hidden="true" />
                            </button>
                          ) : (
                            <span className="vmm-ov-muted">—</span>
                          )}
                        </td>
                      )}

                      {permissions.store_validation && (
                        <td>
                          {row.hasStoreValidation ? (
                            <button
                              type="button"
                              className={`vmm-ov-cell-link ${
                                row.huWrong > 0
                                  ? 'vmm-ov-num-bold vmm-ov-has-reason vmm-ov-has-reason--red'
                                  : valReasons.length > 0
                                    ? 'vmm-ov-num-bold vmm-ov-has-reason vmm-ov-has-reason--amber'
                                    : 'vmm-ov-num-zero'
                              }`}
                              onClick={(e) => {
                                hideCellReason();
                                jump(e, 'store_validation', row.storeCode);
                              }}
                              onMouseEnter={(e) =>
                                showCellReason(e, `${row.storeCode} · Store Validation`, valTipItems, {
                                  hint: 'Click to open Store Validation',
                                })
                              }
                              onMouseLeave={hideCellReason}
                            >
                              <span>{formatIn(row.validationPending)}</span>
                              {row.huWrong > 0 || valReasons.length > 0 ? (
                                <ExternalLink size={11} className="vmm-ov-ext-icon" aria-hidden="true" />
                              ) : (
                                <Check size={11} strokeWidth={2.75} className="vmm-ov-zero-icon" aria-hidden="true" />
                              )}
                            </button>
                          ) : (
                            <span className="vmm-ov-muted">—</span>
                          )}
                        </td>
                      )}

                      {(permissions.void || permissions.return) && (
                        <td>
                          {(row.hasVoid || row.hasReturn) ? (
                            <span className="vmm-ov-void-ret-wrap">
                              {permissions.void && (
                                <button
                                  type="button"
                                  className={`vmm-ov-cell-link ${
                                    voidReasons.length > 0
                                      ? 'vmm-ov-num-bold vmm-ov-has-reason vmm-ov-has-reason--amber'
                                      : 'vmm-ov-num-zero'
                                  }`}
                                  onClick={(e) => {
                                    hideCellReason();
                                    jump(e, 'void', row.storeCode);
                                  }}
                                  onMouseEnter={(e) =>
                                    showCellReason(e, `${row.storeCode} · Void Pending`, voidTipItems, {
                                      hint: 'Click to open Void Dashboard',
                                    })
                                  }
                                  onMouseLeave={hideCellReason}
                                >
                                  <span>{formatIn(row.voidPending)}</span>
                                  {voidReasons.length > 0 ? (
                                    <ExternalLink size={11} className="vmm-ov-ext-icon" aria-hidden="true" />
                                  ) : (
                                    <Check size={11} strokeWidth={2.75} className="vmm-ov-zero-icon" aria-hidden="true" />
                                  )}
                                </button>
                              )}
                              {permissions.void && permissions.return && (
                                <span className="vmm-ov-slash">/</span>
                              )}
                              {permissions.return && (
                                <button
                                  type="button"
                                  className={`vmm-ov-cell-link ${
                                    returnReasons.length > 0
                                      ? 'vmm-ov-num-bold vmm-ov-has-reason vmm-ov-has-reason--amber'
                                      : 'vmm-ov-num-zero'
                                  }`}
                                  onClick={(e) => {
                                    hideCellReason();
                                    jump(e, 'return', row.storeCode);
                                  }}
                                  onMouseEnter={(e) =>
                                    showCellReason(e, `${row.storeCode} · Return Pending`, returnTipItems, {
                                      hint: 'Click to open Return Dashboard',
                                    })
                                  }
                                  onMouseLeave={hideCellReason}
                                >
                                  <span>{formatIn(row.returnPending)}</span>
                                  {returnReasons.length > 0 ? (
                                    <ExternalLink size={11} className="vmm-ov-ext-icon" aria-hidden="true" />
                                  ) : (
                                    <Check size={11} strokeWidth={2.75} className="vmm-ov-zero-icon" aria-hidden="true" />
                                  )}
                                </button>
                              )}
                            </span>
                          ) : (
                            <span className="vmm-ov-muted">—</span>
                          )}
                        </td>
                      )}

                      {isWarehouseOnly && permissions.dc_validation && (
                        <td>
                          {row.hasDcValidation ? (
                            <button
                              type="button"
                              className="vmm-ov-cell-link vmm-ov-num-bold vmm-ov-has-reason vmm-ov-has-reason--green"
                              onClick={(e) => {
                                hideCellReason();
                                jump(e, 'dc_validation', row.storeCode);
                              }}
                              onMouseEnter={(e) =>
                                showCellReason(
                                  e,
                                  `${row.storeCode} · DC Processed HUs`,
                                  [{ text: `${formatIn(row.dcProcessed)} HUs processed (${formatIn(row.dcProcessedArticleQty)} articles)`, severity: 'green' }],
                                  { hint: 'Click to open DC Validation' }
                                )
                              }
                              onMouseLeave={hideCellReason}
                            >
                              <span>{formatIn(row.dcProcessed)}</span>
                              <ExternalLink size={11} className="vmm-ov-ext-icon" aria-hidden="true" />
                            </button>
                          ) : (
                            <span className="vmm-ov-muted">—</span>
                          )}
                        </td>
                      )}

                      {permissions.dc_validation && (
                        <td>
                          {row.hasDcValidation ? (
                            <button
                              type="button"
                              className={`vmm-ov-cell-link ${
                                dcReasons.length > 0
                                  ? `vmm-ov-num-bold vmm-ov-has-reason vmm-ov-has-reason--${row.dcUnprocessed >= 5 ? 'red' : 'amber'}`
                                  : 'vmm-ov-num-zero'
                              }`}
                              onClick={(e) => {
                                hideCellReason();
                                jump(e, 'dc_validation', row.storeCode);
                              }}
                              onMouseEnter={(e) =>
                                showCellReason(e, `${row.storeCode} · DC Unprocessed HUs`, dcTipItems, {
                                  hint: 'Click to open DC Validation',
                                })
                              }
                              onMouseLeave={hideCellReason}
                            >
                              <span>{formatIn(row.dcUnprocessed)}</span>
                              {dcReasons.length > 0 ? (
                                <ExternalLink size={11} className="vmm-ov-ext-icon" aria-hidden="true" />
                              ) : (
                                <Check size={11} strokeWidth={2.75} className="vmm-ov-zero-icon" aria-hidden="true" />
                              )}
                            </button>
                          ) : (
                            <span className="vmm-ov-muted">—</span>
                          )}
                        </td>
                      )}

                      {isWarehouseOnly && permissions.dc_validation && (
                        <td>
                          {row.hasDcValidation ? (
                            <span className="vmm-ov-num-bold">{formatIn(row.dcProcessedArticleQty)}</span>
                          ) : (
                            <span className="vmm-ov-muted">—</span>
                          )}
                        </td>
                      )}

                      {permissions.cycle_count && (
                        <td>
                          {row.hasCycleCount ? (
                            <button
                              type="button"
                              className="vmm-ov-cell-link vmm-ov-cycle-cell"
                              onClick={(e) => {
                                hideCellReason();
                                jump(e, 'cycle_count', row.storeCode);
                              }}
                              onMouseEnter={(e) =>
                                showCellReason(e, `${row.storeCode} · Cycle Count`, cycleTipItems, {
                                  hint: 'Click to open Cycle Count',
                                })
                              }
                              onMouseLeave={hideCellReason}
                            >
                              {row.lastCycleCount && row.lastCycleCount !== '—' && (
                                <Calendar size={13} className="vmm-ov-cycle-cal-icon" aria-hidden="true" />
                              )}
                              <span>{row.lastCycleCount}</span>
                            </button>
                          ) : (
                            <span className="vmm-ov-muted">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <ScorecardReasonTooltip tip={hoverTip} />
      </section>

      {/* Dual Trend Chart + What Needs Attention Insights Row */}
      {(permissions.sale || permissions.return || attentionItems.length > 0) && (
        <section
          className={`vmm-ov-insights-row${!(permissions.sale || permissions.return) ? ' vmm-ov-insights-row--single' : ''}`}
          aria-label="Trends and operational alerts"
        >
          {(permissions.sale || permissions.return) && (
            <div className="cc-data-grid-card vmm-ov-trend-card">
              <div className="vmm-ov-card-head">
                <div>
                  <h2 className="vmm-ov-card-title">RFID checkout &amp; return re-encode, day by day</h2>
                  <p className="vmm-ov-card-subtitle">
                    {storeRows.length === 1
                      ? storeRows[0].storeName
                      : roleScope === 'multi_store'
                        ? `${storeRows.length} assigned stores`
                        : 'All stores'}{' '}
                    · last {dailyTrends.length || 12} days
                  </p>
                </div>
                {(avgCheckoutPct !== null || avgReturnReencodePct !== null) && (
                  <span className="vmm-ov-avg-badge" title="12-day weighted averages">
                    {avgCheckoutPct !== null ? `Checkout ${avgCheckoutPct.toFixed(1)}%` : ''}
                    {avgCheckoutPct !== null && avgReturnReencodePct !== null ? ' · ' : ''}
                    {avgReturnReencodePct !== null ? `Return ${avgReturnReencodePct.toFixed(1)}%` : ''}
                  </span>
                )}
              </div>

              {dailyTrends.length === 0 ? (
                <div className="vmm-ov-card-empty">
                  Daily RFID trend history will appear once sales/return records are available.
                </div>
              ) : (
                <>
                  <div className="vmm-ov-trend-chart-wrap">
                    <ResponsiveContainer width="100%" height={195}>
                      <ComposedChart data={dailyTrends} margin={{ top: 10, right: 4, left: -14, bottom: 2 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="dateLabel"
                          tick={{ fontSize: 10.5, fill: '#64748b' }}
                          axisLine={{ stroke: '#cbd5e1' }}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="pct"
                          domain={[0, 100]}
                          ticks={[0, 20, 40, 60, 80, 100]}
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 10.5, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        {permissions.sale && (
                          <YAxis
                            yAxisId="vol"
                            orientation="right"
                            width={38}
                            domain={[0, (max) => Math.max(100, Math.ceil((max * 1.25) / 1000) * 1000)]}
                            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                          />
                        )}
                        <Tooltip content={<OverviewTrendTooltip />} />
                        {permissions.sale && (
                          <Bar
                            yAxisId="vol"
                            dataKey="rfidCheckout"
                            stackId="sales"
                            name="RFID checked out"
                            fill="#93c5fd"
                            fillOpacity={0.45}
                            barSize={18}
                            radius={[0, 0, 2, 2]}
                          />
                        )}
                        {permissions.sale && (
                          <Bar
                            yAxisId="vol"
                            dataKey="nonRfidSale"
                            stackId="sales"
                            name="Non-RFID / gap"
                            fill="#e2e8f0"
                            fillOpacity={0.6}
                            barSize={18}
                            radius={[3, 3, 0, 0]}
                          />
                        )}
                        {permissions.sale && avgCheckoutPct !== null && (
                          <ReferenceLine
                            yAxisId="pct"
                            y={avgCheckoutPct}
                            stroke="#ea580c"
                            strokeDasharray="4 4"
                            strokeOpacity={0.4}
                          />
                        )}
                        {permissions.return && (
                          <Line
                            yAxisId="pct"
                            type="monotone"
                            dataKey="returnReencodePct"
                            name="Return re-encode %"
                            stroke="#3B82F6"
                            strokeWidth={2.4}
                            dot={{ r: 3.5, fill: '#3B82F6', stroke: '#ffffff', strokeWidth: 1.5 }}
                            activeDot={{ r: 5 }}
                            connectNulls={false}
                          />
                        )}
                        {permissions.sale && (
                          <Line
                            yAxisId="pct"
                            type="monotone"
                            dataKey="rfidCheckoutPct"
                            name="RFID checkout %"
                            stroke="#ea580c"
                            strokeWidth={2.4}
                            dot={{ r: 3.5, fill: '#ea580c', stroke: '#ffffff', strokeWidth: 1.5 }}
                            activeDot={{ r: 5 }}
                            connectNulls={false}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="vmm-ov-trend-legend">
                    {permissions.sale && (
                      <span className="vmm-ov-legend-pill">
                        <span className="vmm-ov-swatch vmm-ov-swatch--orange" />
                        <span>RFID checkout %</span>
                      </span>
                    )}
                    {permissions.return && (
                      <span className="vmm-ov-legend-pill">
                        <span className="vmm-ov-swatch vmm-ov-swatch--line-blue" />
                        <span>Return re-encode %</span>
                      </span>
                    )}
                    {permissions.sale && (
                      <>
                        <span className="vmm-ov-legend-pill">
                          <span className="vmm-ov-swatch vmm-ov-swatch--blue" />
                          <span>RFID volume</span>
                        </span>
                        <span className="vmm-ov-legend-pill">
                          <span className="vmm-ov-swatch vmm-ov-swatch--slate" />
                          <span>Non-RFID gap</span>
                        </span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="cc-data-grid-card vmm-ov-attention-card">
            <div className="vmm-ov-card-head">
              <div>
                <h2 className="vmm-ov-card-title">What needs attention</h2>
                <p className="vmm-ov-card-subtitle">
                  Priority store alerts &amp; highest vendor discrepancy
                </p>
              </div>
              {attentionItems.length > 0 && (
                <span
                  className={`vmm-ov-att-summary-pill${
                    kpis.stores.red > 0 ? ' vmm-ov-att-summary-pill--red' : ''
                  }`}
                >
                  {kpis.stores.red > 0 ? `${kpis.stores.red} Critical` : `${attentionItems.length} Alerts`}
                </span>
              )}
            </div>

            {attentionItems.length === 0 ? (
              <div className="vmm-ov-card-empty vmm-ov-card-empty--ok">
                <Check size={16} strokeWidth={2.8} />
                <span>All monitored stores are within target thresholds.</span>
              </div>
            ) : (
              <ul className="vmm-ov-att-list">
                {attentionItems.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={`vmm-ov-att-item vmm-ov-att-item--${item.severity}`}
                      onClick={(e) => jump(e, item.sectionKey, item.storeCode)}
                      title={`Jump to ${item.title}`}
                    >
                      <span className={`vmm-ov-att-icon-wrap vmm-ov-att-icon-wrap--${item.severity}`}>
                        {item.severity === 'info' ? (
                          <Info size={13} strokeWidth={2.4} aria-hidden="true" />
                        ) : (
                          <AlertTriangle size={13} strokeWidth={2.4} aria-hidden="true" />
                        )}
                      </span>

                      <span className="vmm-ov-att-body">
                        <span className="vmm-ov-att-top">
                          <strong className="vmm-ov-att-strong">{item.title}</strong>
                          <span className={`vmm-ov-att-tag vmm-ov-att-tag--${item.severity}`}>
                            {item.tagLabel}
                          </span>
                        </span>
                        <span className="vmm-ov-att-sub">{item.detail}</span>
                      </span>

                      <span className="vmm-ov-att-end">
                        <span className={`vmm-ov-att-metric vmm-ov-att-metric--${item.severity}`}>
                          {item.metric}
                        </span>
                        <ChevronRight size={13} className="vmm-ov-att-chevron" aria-hidden="true" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
