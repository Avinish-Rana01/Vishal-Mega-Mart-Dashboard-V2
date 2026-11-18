import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import KpiCard2 from '../../../components/charts/KpiCard2';
import LiveTickerValue from '../../../components/common/LiveTickerValue';
import DashboardShimmer from '../../../components/common/DashboardShimmer';
import { DateBadge } from '../../../components/common/SectionHeader';
import {
  buildOverviewData,
  exportScorecardToExcel,
  formatIn,
} from './overviewHelpers';
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

export default function OverviewSection({ onJumpToSection }) {
  const { hasSection } = useAuth();
  const { rawData, isLoading, error, highlightedStore, connectionStatus } = useDashboardOverview();
  const [sortConfig, setSortConfig] = useState({ key: null, dir: null });
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const scoreInfoRef = useRef(null);

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
        case 'cycleCount':
          return row.hasCycleCount ? row.cycleCountSortKey : '';
        case 'why':
          return row.reasons.every((r) => r.severity === 'green') ? 0 : row.reasons.length;
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

  const kpiCards = [
    permissions.live_stock && {
      key: 'stores',
      sectionKey: 'live_stock',
      title: 'Stores Status',
      value: (
        <span className="vmm-ov-rag-inline">
          <span className="vmm-ov-rag-item vmm-ov-rag-r">
            <AlertTriangle size={14} strokeWidth={2.5} aria-hidden="true" />
            <LiveTickerValue value={kpis.stores.red} />
          </span>
          <span className="vmm-ov-rag-sep">/</span>
          <span className="vmm-ov-rag-item vmm-ov-rag-a">
            <AlertTriangle size={14} strokeWidth={2.5} aria-hidden="true" />
            <LiveTickerValue value={kpis.stores.amber} />
          </span>
          <span className="vmm-ov-rag-sep">/</span>
          <span className="vmm-ov-rag-item vmm-ov-rag-g">
            <Check size={15} strokeWidth={3.3} className="vmm-ov-rag-tick" aria-hidden="true" />
            <LiveTickerValue value={kpis.stores.green} />
          </span>
        </span>
      ),
      icon: <Store />,
      tooltip: `${kpis.stores.red} Critical (<50%), ${kpis.stores.amber} Warning (50-90%), ${kpis.stores.green} Healthy (>90%) of ${kpis.stores.total} RFID stores`,
    },
    permissions.live_stock && {
      key: 'coverage',
      sectionKey: 'live_stock',
      title: 'Stock Coverage',
      value: <LiveTickerValue value={kpis.stockCoverage.pct.toFixed(1)} suffix="%" />,
      icon: <Target />,
      tooltip: `RFID ${formatIn(kpis.stockCoverage.rfid)} of SAP ${formatIn(kpis.stockCoverage.sap)}`,
    },
    permissions.sale && {
      key: 'checkout',
      sectionKey: 'sale',
      title: 'RFID Checkout',
      value: <LiveTickerValue value={kpis.rfidCheckout.pct.toFixed(1)} suffix="%" />,
      icon: <ShoppingCart />,
      tooltip: `${formatIn(kpis.rfidCheckout.rfidSale)} of ${formatIn(kpis.rfidCheckout.dposSale)} items sold • ${kpis.rfidCheckout.taggedCapturePct.toFixed(1)}% of tagged items`,
    },
    permissions.store_validation && {
      key: 'validation',
      sectionKey: 'store_validation',
      title: 'Validation Pending',
      value: <LiveTickerValue value={kpis.validationPending.pending} />,
      icon: <ClipboardList />,
      tooltip: `Of ${formatIn(kpis.validationPending.whValidated)} WH validated • ${formatIn(kpis.validationPending.wrong)} wrong HUs`,
    },
    (permissions.void || permissions.return) && {
      key: 'voidReturn',
      sectionKey: permissions.void ? 'void' : 'return',
      title: 'Void / Return Pending',
      value: (
        <>
          <LiveTickerValue value={kpis.voidReturnPending.voidPending} />
          <span className="vmm-ov-slash"> / </span>
          <LiveTickerValue value={kpis.voidReturnPending.returnPending} />
        </>
      ),
      icon: <RotateCcw />,
      tooltip: `Not encoded back (of ${formatIn(kpis.voidReturnPending.voidTotal)} void, ${formatIn(kpis.voidReturnPending.returnTotal)} return)`,
    },
    (permissions.dc_encoding || permissions.dc_validation) && {
      key: 'dcEncoding',
      sectionKey: permissions.dc_encoding ? 'dc_encoding' : 'dc_validation',
      title: 'DC Encoding Today',
      value: <LiveTickerValue value={kpis.dcEncoding.encodedToday} />,
      icon: <Layers />,
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
      <div className="vmm-ov-legend-bar" role="note" aria-label="Stores status color legend">
        {permissions.live_stock && (
          <div className="vmm-ov-legend-items">
            <span className="vmm-ov-legend-lead">
              <Info size={13} strokeWidth={2.2} className="vmm-ov-legend-icon" aria-hidden="true" />
              <span>Stores Status:</span>
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

      {/* Top 6 KpiCard2 Cards in Single Row */}
      <section
        className="vmm-ov-kpi-row"
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
            <KpiCard2
              title={card.title}
              value={card.value}
              icon={card.icon}
            />
          </div>
        ))}
      </section>

      {/* Compact Store Scorecard Table Card */}
      <section className="cc-data-grid-card vmm-ov-scorecard" aria-label="Store scorecard">
        <div className="cc-data-grid-header vmm-ov-scorecard-header">
          <div className="vmm-ov-header-text">
            <h2 className="cc-data-grid-title vmm-ov-scorecard-title">
              STORE SCORECARD ({sortedRows.length} STORES)
            </h2>

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
                    <div className="vmm-ov-sp-row">
                      <div className="vmm-ov-sp-row-top">
                        <strong>1. Live Stock Coverage</strong>
                        <span className="vmm-ov-sp-pts">45 pts</span>
                      </div>
                      <div className="vmm-ov-sp-desc">(RFID Stock ÷ SAP Stock) × 45</div>
                    </div>

                    <div className="vmm-ov-sp-row">
                      <div className="vmm-ov-sp-row-top">
                        <strong>2. Sales &amp; RFID Checkout</strong>
                        <span className="vmm-ov-sp-pts">25 pts</span>
                      </div>
                      <div className="vmm-ov-sp-desc">(Total RFID Checkout ÷ Total POS Sale) × 25</div>
                    </div>

                    <div className="vmm-ov-sp-row">
                      <div className="vmm-ov-sp-row-top">
                        <strong>3. Backlog Health</strong>
                        <span className="vmm-ov-sp-pts">30 pts</span>
                      </div>
                      <div className="vmm-ov-sp-desc">
                        30 minus capped deductions:
                        <ul className="vmm-ov-sp-list">
                          <li>Store Val.: 0.4 pt/pending HU (max 10) + 2 pts/wrong HU (max 5)</li>
                          <li>Void &amp; Return: 0.25 pt/pending item (max 10)</li>
                          <li>DC Val.: 2 pts/unprocessed HU (max 5)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="vmm-ov-sp-note">
                    Normalized by active weight — if POS Sale is 0 (—), score scales out of 75 to 100.
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="cc-action-btn cc-export-btn vmm-ov-excel-btn"
            onClick={() => exportScorecardToExcel(sortedRows)}
            disabled={sortedRows.length === 0}
            title="Export Store Scorecard to Excel"
          >
            <Download size={13} />
            <span>Excel</span>
          </button>
        </div>

        <div className="vmm-ov-table-scroll">
          <table className="vmm-ov-table">
            <thead>
              <tr>
                {renderSortableTh('status', 'STATUS')}
                {renderSortableTh('store', 'STORE')}
                {renderSortableTh('score', 'SCORE', 'vmm-ov-th-score')}
                {permissions.live_stock && renderSortableTh('coverage', 'COVERAGE')}
                {permissions.sale && renderSortableTh('checkout', 'RFID CHECKOUT')}
                {permissions.store_validation && renderSortableTh('validation', 'VAL. PENDING')}
                {(permissions.void || permissions.return) && renderSortableTh('voidReturn', 'VOID / RET. PENDING')}
                {permissions.cycle_count && renderSortableTh('cycleCount', 'LAST CYCLE COUNT')}
                {renderSortableTh('why', 'WHY')}
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

                  return (
                    <tr
                      key={row.storeCode}
                      className={`vmm-ov-tr${isUpdatedRow ? ' vmm-ov-tr--updated' : ''}`}
                      onClick={(e) => jump(e, defaultJump, row.storeCode)}
                    >
                      <td>
                        <span className={`vmm-ov-status-pill vmm-ov-status-pill--${row.statusTier}`}>
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
                          onClick={(e) => jump(e, defaultJump, row.storeCode)}
                          title={`Jump to ${row.storeName || row.storeCode} section`}
                        >
                          <span className="vmm-ov-store-name">
                            {row.storeName || row.storeCode}
                          </span>
                        </button>
                      </td>

                      <td className="vmm-ov-score-cell">
                        {row.score !== null ? row.score : <span className="vmm-ov-muted">—</span>}
                      </td>

                      {permissions.live_stock && (
                        <td>
                          {row.hasLiveStock && row.coveragePct !== null ? (
                            <button
                              type="button"
                              className="vmm-ov-cell-link vmm-ov-coverage-wrap"
                              onClick={(e) => jump(e, 'live_stock', row.storeCode)}
                              title={`View ${row.storeCode} in Live Stock`}
                            >
                              <span className="vmm-ov-progress-track">
                                <span
                                  className={`vmm-ov-progress-fill vmm-ov-progress-fill--${row.coverageTier}`}
                                  style={{ width: barWidth }}
                                />
                              </span>
                              <span className="vmm-ov-num-bold">
                                {row.coveragePct.toFixed(1)}%
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
                              className="vmm-ov-cell-link vmm-ov-num-bold"
                              onClick={(e) => jump(e, 'sale', row.storeCode)}
                              title={`View ${row.storeCode} in Sales & Checkout`}
                            >
                              {row.checkoutPct.toFixed(1)}%
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
                              className="vmm-ov-cell-link vmm-ov-num-bold"
                              onClick={(e) => jump(e, 'store_validation', row.storeCode)}
                              title={`Jump to ${row.storeCode} in Store Validation`}
                            >
                              {formatIn(row.validationPending)}
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
                                  className="vmm-ov-cell-link vmm-ov-num-bold"
                                  onClick={(e) => jump(e, 'void', row.storeCode)}
                                  title={`View ${row.storeCode} in Void Dashboard`}
                                >
                                  {formatIn(row.voidPending)}
                                </button>
                              )}
                              {permissions.void && permissions.return && (
                                <span className="vmm-ov-slash">/</span>
                              )}
                              {permissions.return && (
                                <button
                                  type="button"
                                  className="vmm-ov-cell-link vmm-ov-num-bold"
                                  onClick={(e) => jump(e, 'return', row.storeCode)}
                                  title={`View ${row.storeCode} in Return Dashboard`}
                                >
                                  {formatIn(row.returnPending)}
                                </button>
                              )}
                            </span>
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
                              onClick={(e) => jump(e, 'cycle_count', row.storeCode)}
                              title={`View ${row.storeCode} in Cycle Count`}
                            >
                              {row.lastCycleCount}
                            </button>
                          ) : (
                            <span className="vmm-ov-muted">—</span>
                          )}
                        </td>
                      )}

                      <td>
                        <div className="vmm-ov-why-list">
                          {row.reasons.map((reason, idx) => (
                            <button
                              key={`${row.storeCode}-why-${idx}`}
                              type="button"
                              className={`vmm-ov-why-pill vmm-ov-why-pill--${reason.severity}`}
                              onClick={(e) => jump(e, reason.sectionKey, row.storeCode)}
                              title={`Jump to ${row.storeCode} section`}
                            >
                              {reason.text}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
                    {storeRows.length === 1 ? storeRows[0].storeName : 'All stores'} · last {dailyTrends.length || 12} days
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
