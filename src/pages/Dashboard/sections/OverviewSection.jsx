import React, { useMemo, useState } from 'react';
import {
  Download,
  ArrowUp,
  ArrowDown,
  Store,
  Target,
  ShoppingCart,
  ClipboardList,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useDashboardSharedData } from '../../../context/dashboardDataContextValue';
import {
  useLiveStock,
  useSaleDashboard,
  useStoreDashboard,
  useVoidDashboard,
  useReturnDashboard,
  useCycleCount,
  useDcValidation,
  useWarehouseEncoding,
} from '../../../hooks/useDashboardData';
import KpiCard2 from '../../../components/charts/KpiCard2';
import LiveTickerValue from '../../../components/common/LiveTickerValue';
import DashboardShimmer from '../../../components/common/DashboardShimmer';
import {
  buildOverviewData,
  exportScorecardToExcel,
  formatIn,
} from './overviewHelpers';
import './CycleCountShared.css';
import './OverviewSection.css';

export default function OverviewSection({ onJumpToSection }) {
  const { hasSection } = useAuth();
  const shared = useDashboardSharedData();

  const liveStock = useLiveStock();
  const sale = useSaleDashboard();
  const storeValidation = useStoreDashboard();
  const voidData = useVoidDashboard();
  const returnData = useReturnDashboard();
  const cycleCount = useCycleCount();
  const dcValidation = useDcValidation();
  const dcEncoding = useWarehouseEncoding();

  const [sortConfig, setSortConfig] = useState({ key: 'score', dir: 'asc' });

  const permissions = useMemo(() => ({
    live_stock: hasSection('live_stock'),
    cycle_count: hasSection('cycle_count'),
    store_validation: hasSection('store_validation'),
    sale: hasSection('sale'),
    void: hasSection('void'),
    return: hasSection('return'),
    dc_validation: hasSection('dc_validation'),
    dc_encoding: hasSection('dc_encoding'),
  }), [hasSection]);

  const { kpis, storeRows } = useMemo(() => buildOverviewData({
    hooks: {
      live_stock: liveStock,
      sale,
      store_validation: storeValidation,
      void: voidData,
      return: returnData,
      cycle_count: cycleCount,
      dc_validation: dcValidation,
      dc_encoding: dcEncoding,
    },
    dcEncodingErrors: shared?.dcEncodingErrors,
    permissions,
  }), [
    liveStock,
    sale,
    storeValidation,
    voidData,
    returnData,
    cycleCount,
    dcValidation,
    dcEncoding,
    shared?.dcEncodingErrors,
    permissions,
  ]);

  const enabledStates = [
    permissions.live_stock && liveStock.isLoading,
    permissions.sale && sale.isLoading,
    permissions.store_validation && storeValidation.isLoading,
    permissions.void && voidData.isLoading,
    permissions.return && returnData.isLoading,
    permissions.cycle_count && cycleCount.isLoading,
    permissions.dc_validation && dcValidation.isLoading,
    permissions.dc_encoding && dcEncoding.isLoading,
  ];
  const activeFlags = enabledStates.filter((_, idx) => [
    permissions.live_stock,
    permissions.sale,
    permissions.store_validation,
    permissions.void,
    permissions.return,
    permissions.cycle_count,
    permissions.dc_validation,
    permissions.dc_encoding,
  ][idx]);

  const isInitialLoading = activeFlags.length > 0 && activeFlags.every(Boolean) && storeRows.length === 0;

  const sortedRows = useMemo(() => {
    const { key, dir } = sortConfig;
    const mult = dir === 'asc' ? 1 : -1;

    return [...storeRows].sort((a, b) => {
      if (key === 'store') {
        return a.storeCode.localeCompare(b.storeCode) * mult;
      }
      const getVal = (row) => {
        if (key === 'score') return row.score;
        if (key === 'coverage') return row.coveragePct;
        if (key === 'checkout') return row.checkoutPct;
        if (key === 'validation') return row.hasStoreValidation ? row.validationPending : null;
        return row.score;
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va === null && vb === null) return a.storeCode.localeCompare(b.storeCode);
      if (va === null) return 1;
      if (vb === null) return -1;
      if (va !== vb) return (va - vb) * mult;
      return a.storeCode.localeCompare(b.storeCode);
    });
  }, [storeRows, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: key === 'validation' ? 'desc' : 'asc' };
    });
  };

  const jump = (e, sectionKey, storeCode) => {
    if (e) e.stopPropagation();
    if (!sectionKey || !permissions[sectionKey] || !onJumpToSection) return;
    onJumpToSection(sectionKey, storeCode);
  };

  const kpiCards = [
    permissions.live_stock && {
      key: 'stores',
      sectionKey: 'live_stock',
      title: 'Stores Status',
      value: liveStock.isLoading ? '—' : (
        <span className="vmm-ov-rag-inline">
          <span className="vmm-ov-rag-r">{kpis.stores.red}R</span>
          <span className="vmm-ov-rag-sep">/</span>
          <span className="vmm-ov-rag-a">{kpis.stores.amber}A</span>
          <span className="vmm-ov-rag-sep">/</span>
          <span className="vmm-ov-rag-g">{kpis.stores.green}G</span>
        </span>
      ),
      icon: <Store />,
      tooltip: `${kpis.stores.red} Red (<50%), ${kpis.stores.amber} Amber (50-90%), ${kpis.stores.green} Green (>90%) of ${kpis.stores.total} RFID stores`,
    },
    permissions.live_stock && {
      key: 'coverage',
      sectionKey: 'live_stock',
      title: 'Stock Coverage',
      value: liveStock.isLoading ? '—' : (
        <LiveTickerValue value={kpis.stockCoverage.pct.toFixed(1)} suffix="%" />
      ),
      icon: <Target />,
      tooltip: `RFID ${formatIn(kpis.stockCoverage.rfid)} of SAP ${formatIn(kpis.stockCoverage.sap)}`,
    },
    permissions.sale && {
      key: 'checkout',
      sectionKey: 'sale',
      title: 'RFID Checkout',
      value: sale.isLoading ? '—' : (
        <LiveTickerValue value={kpis.rfidCheckout.pct.toFixed(1)} suffix="%" />
      ),
      icon: <ShoppingCart />,
      tooltip: `${formatIn(kpis.rfidCheckout.rfidSale)} of ${formatIn(kpis.rfidCheckout.dposSale)} items sold • ${kpis.rfidCheckout.taggedCapturePct.toFixed(1)}% of tagged items`,
    },
    permissions.store_validation && {
      key: 'validation',
      sectionKey: 'store_validation',
      title: 'Validation Pending',
      value: storeValidation.isLoading ? '—' : (
        <LiveTickerValue value={kpis.validationPending.pending} />
      ),
      icon: <ClipboardList />,
      tooltip: `Of ${formatIn(kpis.validationPending.whValidated)} WH validated • ${formatIn(kpis.validationPending.wrong)} wrong HUs`,
    },
    (permissions.void || permissions.return) && {
      key: 'voidReturn',
      sectionKey: permissions.void ? 'void' : 'return',
      title: 'Void / Return Pending',
      value: (voidData.isLoading && returnData.isLoading)
        ? '—'
        : `${formatIn(kpis.voidReturnPending.voidPending)} / ${formatIn(kpis.voidReturnPending.returnPending)}`,
      icon: <RotateCcw />,
      tooltip: `Not encoded back (of ${formatIn(kpis.voidReturnPending.voidTotal)} void, ${formatIn(kpis.voidReturnPending.returnTotal)} return)`,
    },
    (permissions.dc_encoding || permissions.dc_validation) && {
      key: 'dcEncoding',
      sectionKey: permissions.dc_encoding ? 'dc_encoding' : 'dc_validation',
      title: 'DC Encoding Today',
      value: dcEncoding.isLoading ? '—' : (
        <LiveTickerValue value={kpis.dcEncoding.encodedToday} />
      ),
      icon: <Layers />,
      tooltip: `${Number(kpis.dcEncoding.errorPct).toFixed(1)}% errors • ${formatIn(kpis.dcEncoding.unprocessedHu)} HUs unprocessed at DC`,
    },
  ].filter(Boolean);

  if (isInitialLoading) {
    return <DashboardShimmer variant="live-stock" />;
  }

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.dir === 'asc'
      ? <ArrowUp size={11} className="vmm-ov-sort-icon" />
      : <ArrowDown size={11} className="vmm-ov-sort-icon" />;
  };

  // Concise single-line context summary inside scorecard subtitle
  const summaryParts = [];
  if (permissions.live_stock) {
    summaryParts.push(`RFID ${formatIn(kpis.stockCoverage.rfid)} / SAP ${formatIn(kpis.stockCoverage.sap)}`);
  }
  if (permissions.sale) {
    summaryParts.push(`${kpis.rfidCheckout.taggedCapturePct.toFixed(1)}% tagged checkout`);
  }
  if (permissions.dc_encoding && !kpis.dcEncoding.errorLoading) {
    summaryParts.push(`DC ${Number(kpis.dcEncoding.errorPct).toFixed(1)}% err`);
  }
  if (permissions.dc_validation) {
    summaryParts.push(`${formatIn(kpis.dcEncoding.unprocessedHu)} DC unprocessed HUs`);
  }

  return (
    <div className="vmm-ov-wrapper">
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
            {summaryParts.length > 0 && (
              <span className="vmm-ov-header-meta">
                {summaryParts.join('  •  ')}
              </span>
            )}
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
                <th>STATUS</th>
                <th>
                  <button type="button" className="vmm-ov-th-btn" onClick={() => handleSort('store')}>
                    <span>STORE</span>
                    {renderSortIcon('store')}
                  </button>
                </th>
                <th>
                  <button type="button" className="vmm-ov-th-btn" onClick={() => handleSort('score')}>
                    <span>SCORE</span>
                    {renderSortIcon('score')}
                  </button>
                </th>
                {permissions.live_stock && (
                  <th>
                    <button type="button" className="vmm-ov-th-btn" onClick={() => handleSort('coverage')}>
                      <span>COVERAGE</span>
                      {renderSortIcon('coverage')}
                    </button>
                  </th>
                )}
                {permissions.sale && (
                  <th className="vmm-ov-th-right">
                    <button type="button" className="vmm-ov-th-btn vmm-ov-th-btn--right" onClick={() => handleSort('checkout')}>
                      <span>RFID CHECKOUT</span>
                      {renderSortIcon('checkout')}
                    </button>
                  </th>
                )}
                {permissions.store_validation && (
                  <th className="vmm-ov-th-right">
                    <button type="button" className="vmm-ov-th-btn vmm-ov-th-btn--right" onClick={() => handleSort('validation')}>
                      <span>VAL. PENDING</span>
                      {renderSortIcon('validation')}
                    </button>
                  </th>
                )}
                {(permissions.void || permissions.return) && (
                  <th className="vmm-ov-th-right">VOID / RET. PENDING</th>
                )}
                {permissions.cycle_count && (
                  <th>LAST CYCLE COUNT</th>
                )}
                <th>WHY</th>
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
                    'live_stock';

                  const barWidth = row.coveragePct !== null
                    ? `${Math.max(4, Math.min(100, row.coveragePct))}%`
                    : '0%';

                  return (
                    <tr
                      key={row.storeCode}
                      className="vmm-ov-tr"
                      onClick={(e) => jump(e, defaultJump, row.storeCode)}
                    >
                      <td>
                        <span className={`vmm-ov-status-pill vmm-ov-status-pill--${row.statusTier}`}>
                          {row.statusLabel}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="vmm-ov-cell-link vmm-ov-store-cell"
                          onClick={(e) => jump(e, defaultJump, row.storeCode)}
                          title={`Jump to ${row.storeCode} section`}
                        >
                          <span className="vmm-ov-store-code">{row.storeCode}</span>
                          {row.storeName && (
                            <span className="vmm-ov-store-name">{row.storeName}</span>
                          )}
                        </button>
                      </td>

                      <td className="vmm-ov-score-cell">
                        {row.score !== null ? row.score : '—'}
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
                        <td className="vmm-ov-td-right">
                          {row.hasSale && row.checkoutPct !== null ? (
                            <button
                              type="button"
                              className="vmm-ov-cell-link vmm-ov-cell-link--right vmm-ov-num-bold"
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
                        <td className="vmm-ov-td-right">
                          {row.hasStoreValidation ? (
                            <button
                              type="button"
                              className="vmm-ov-cell-link vmm-ov-cell-link--right vmm-ov-num-bold"
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
                        <td className="vmm-ov-td-right">
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
    </div>
  );
}
