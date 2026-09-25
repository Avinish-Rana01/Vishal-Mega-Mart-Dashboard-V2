import React, { useMemo } from 'react';
import * as Icons from 'lucide-react';
import './EpcRangeBreakdown.css';

/**
 * Standard 12-hour hourly EPC ranges with DB mappings
 */
export const DEFAULT_EPC_RANGES = [
  { key: '8TO9',   dataKey: 'N8_TO_9',   errKey: 'N8_TO_9_ERR',   label: '8 TO 9',   summaryKey: 'c8TO9',   summaryErrKey: 'c8TO9_ERR' },
  { key: '9TO10',  dataKey: 'N9_TO_10',  errKey: 'N9_TO_10_ERR',  label: '9 TO 10',  summaryKey: 'c9TO10',  summaryErrKey: 'c9TO10_ERR' },
  { key: '10TO11', dataKey: 'N10_TO_11', errKey: 'N10_TO_11_ERR', label: '10 TO 11', summaryKey: 'c10TO11', summaryErrKey: 'c10TO11_ERR' },
  { key: '11TO12', dataKey: 'N11_TO_12', errKey: 'N11_TO_12_ERR', label: '11 TO 12', summaryKey: 'c11TO12', summaryErrKey: 'c11TO12_ERR' },
  { key: '12TO1',  dataKey: 'N12_TO_1',  errKey: 'N12_TO_1_ERR',  label: '12 TO 1',  summaryKey: 'c12TO13', summaryErrKey: 'c12TO13_ERR' },
  { key: '1TO2',   dataKey: 'N1_TO_2',   errKey: 'N1_TO_2_ERR',   label: '1 TO 2',   summaryKey: 'c13TO14', summaryErrKey: 'c13TO14_ERR' },
  { key: '2TO3',   dataKey: 'N2_TO_3',   errKey: 'N2_TO_3_ERR',   label: '2 TO 3',   summaryKey: 'c14TO15', summaryErrKey: 'c14TO15_ERR' },
  { key: '3TO4',   dataKey: 'N3_TO_4',   errKey: 'N3_TO_4_ERR',   label: '3 TO 4',   summaryKey: 'c15TO16', summaryErrKey: 'c15TO16_ERR' },
  { key: '4TO5',   dataKey: 'N4_TO_5',   errKey: 'N4_TO_5_ERR',   label: '4 TO 5',   summaryKey: 'c16TO17', summaryErrKey: 'c16TO17_ERR' },
  { key: '5TO6',   dataKey: 'N5_TO_6',   errKey: 'N5_TO_6_ERR',   label: '5 TO 6',   summaryKey: 'c17TO18', summaryErrKey: 'c17TO18_ERR' },
  { key: '6TO7',   dataKey: 'N6_TO_7',   errKey: 'N6_TO_7_ERR',   label: '6 TO 7',   summaryKey: 'c18TO19', summaryErrKey: 'c18TO19_ERR' },
  { key: '7TO8',   dataKey: 'N7_TO_8',   errKey: 'N7_TO_8_ERR',   label: '7 TO 8',   summaryKey: 'c19TO20', summaryErrKey: 'c19TO20_ERR' },
];

/**
 * Helper to compute error percentage safely
 */
export const getRangeErrorPct = (count, error) => {
  if (!count || count === 0) return '0';
  return ((error / count) * 100).toFixed(1);
};

/**
 * EpcRangeBreakdown — Horizontal cards strip showing hourly EPC count, error, and percentage.
 *
 * @param {string} title - Section title (default: 'Total EPC Count By Range')
 * @param {Array} ranges - Array of range definitions (defaults to DEFAULT_EPC_RANGES)
 * @param {Object} rangeSummary - Object mapping range key to { count, error }
 * @param {boolean} showTotal - Whether to show the TOTAL TAGS card at the end (default: true)
 * @param {string} className - Additional CSS class name
 * @param {Object} style - Inline styles override
 */
export default function EpcRangeBreakdown({
  title = 'Total EPC Count By Range',
  ranges = DEFAULT_EPC_RANGES,
  rangeSummary = {},
  showTotal = true,
  className = '',
  style = {}
}) {
  const { totalCount, totalError } = useMemo(() => {
    let tCount = 0;
    let tErr = 0;
    ranges.forEach(({ key }) => {
      tCount += rangeSummary[key]?.count || 0;
      tErr += rangeSummary[key]?.error || 0;
    });
    return { totalCount: tCount, totalError: tErr };
  }, [ranges, rangeSummary]);

  const totalPct = getRangeErrorPct(totalCount, totalError);

  return (
    <div className={`epc-range-container ${className}`.trim()} style={style}>
      {title && (
        <div className="epc-range-header-bar">
          <div className="epc-range-label">
            <Icons.Clock size={12} className="epc-header-clock-icon" />
            <span>{title}</span>
          </div>
          <div className="epc-range-badge-summary">
            12 Hourly Windows
          </div>
        </div>
      )}

      <div className="epc-range-scroll">
        {ranges.map(({ key, label }) => {
          const count = rangeSummary[key]?.count || 0;
          const error = rangeSummary[key]?.error || 0;
          const pct = getRangeErrorPct(count, error);
          const hasData = count > 0;
          const hasError = error > 0;

          return (
            <div 
              key={key} 
              className={`epc-range-card ${!hasData ? 'epc-range-card--idle' : ''}`}
            >
              {/* Row 1: Time Window Title + Status Dot */}
              <div className="epc-card-header">
                <span className="epc-card-title">{label}</span>
                {hasData && (
                  <span 
                    className={`epc-card-dot ${hasError ? 'epc-card-dot--warn' : 'epc-card-dot--ok'}`} 
                    title={hasError ? `${error} errors` : 'Clean count'}
                  />
                )}
              </div>

              {/* Row 2: Metrics (Green Check Count + Red Triangle Error) */}
              <div className="epc-stats-row">
                <div 
                  className={`epc-stat-col epc-stat-success ${!hasData ? 'epc-stat--muted' : ''}`}
                  title={`${count.toLocaleString('en-IN')} encoded tags`}
                >
                  <Icons.Check size={13} strokeWidth={2.8} />
                  <span className="epc-stat-num">{count.toLocaleString('en-IN')}</span>
                </div>

                <div 
                  className={`epc-stat-col epc-stat-error ${!hasError ? 'epc-stat--muted' : ''}`}
                  title={`${error.toLocaleString('en-IN')} error tags`}
                >
                  <Icons.AlertTriangle size={12} strokeWidth={2.4} />
                  <span className="epc-stat-num">{error.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Row 3: Modern Pill Badge for Error Percentage */}
              <div className="epc-pct-row">
                <span 
                  className={`epc-pct-pill ${
                    hasError 
                      ? 'epc-pct-pill--err' 
                      : hasData 
                        ? 'epc-pct-pill--ok' 
                        : 'epc-pct-pill--idle'
                  }`}
                >
                  {pct}% error
                </span>
              </div>
            </div>
          );
        })}

        {/* Row 4: TOTAL TAGS Card at the end */}
        {showTotal && (
          <div className="epc-range-card epc-range-card--total">
            <div className="epc-card-header">
              <span className="epc-card-title epc-card-title--total">
                <Icons.Layers size={11} />
                <span>TOTAL TAGS</span>
              </span>
              <span className="epc-card-dot epc-card-dot--total" />
            </div>

            <div className="epc-stats-row">
              <div 
                className="epc-stat-col epc-stat-total"
                title={`${totalCount.toLocaleString('en-IN')} total encoded`}
              >
                <Icons.Check size={13} strokeWidth={2.8} />
                <span className="epc-stat-num epc-stat-num--total">
                  {totalCount.toLocaleString('en-IN')}
                </span>
              </div>

              <div 
                className="epc-stat-col epc-stat-error"
                title={`${totalError.toLocaleString('en-IN')} total errors`}
              >
                <Icons.AlertTriangle size={12} strokeWidth={2.4} />
                <span className="epc-stat-num">
                  {totalError.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="epc-pct-row">
              <span 
                className={`epc-pct-pill ${
                  totalError > 0 
                    ? 'epc-pct-pill--err' 
                    : totalCount > 0 
                      ? 'epc-pct-pill--ok' 
                      : 'epc-pct-pill--idle'
                }`}
              >
                {totalPct}% error
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
