import { useMemo } from 'react';

/**
 * Configurable SLA threshold (minutes).
 * Change this single value to update the threshold everywhere.
 */
const SLA_THRESHOLD_MINS = 240;

/**
 * Parses "HH:MM:SS" string into total minutes (float).
 * Returns null for invalid/missing input (not 0 — null means "no data").
 */
function parseDurationMins(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(':');
  if (parts.length !== 3) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parseInt(parts[2], 10);
  if (isNaN(h) || isNaN(m) || isNaN(s)) return null;
  return (h * 60) + m + (s / 60);
}

/**
 * Formats total minutes into a human-readable string.
 * Returns '—' for null/invalid input.
 */
function formatDuration(totalMins) {
  if (totalMins === null || totalMins === undefined || isNaN(totalMins)) return '—';
  const hours = Math.floor(totalMins / 60);
  const mins = Math.round(totalMins % 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Formats a date string (YYYY-MM-DD) into a readable display format.
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function useCycleCountMetrics(rawData) {
  return useMemo(() => {
    const empty = {
      storesReported: 0,
      latestDate: null,
      latestDateFormatted: '—',
      avgDurationMins: null,
      avgDurationFormatted: '—',
      fastestDurationMins: null,
      fastestDurationFormatted: '—',
      fastestStore: '—',
      slowestDurationMins: null,
      slowestDurationFormatted: '—',
      slowestStore: '—',
      todayCount: 0,
      parsedData: [],
      storeDurations: [],
      SLA_THRESHOLD_MINS
    };

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return empty;
    }

    let totalDuration = 0;
    let validDurationCount = 0;
    let minDuration = Infinity;
    let maxDuration = -Infinity;
    let fastestStore = '—';
    let slowestStore = '—';
    let latestDate = null;
    let todayCount = 0;
    
    // Get today's date in YYYY-MM-DD format for local timezone comparison
    const todayStr = new Date().toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD locally

    const parsedData = rawData.map(row => {
      const durationMins = parseDurationMins(row.Time_Taken);
      const hasDuration = durationMins !== null;
      const exceedsThreshold = hasDuration && durationMins > SLA_THRESHOLD_MINS;

      // Track aggregates only for valid durations
      if (hasDuration) {
        totalDuration += durationMins;
        validDurationCount++;

        if (durationMins < minDuration) {
          minDuration = durationMins;
          fastestStore = row.STORE_CODE || '—';
        }
        if (durationMins > maxDuration) {
          maxDuration = durationMins;
          slowestStore = row.STORE_CODE || '—';
        }
      }

      // Track latest date
      if (row.DATE) {
        const rowDate = new Date(row.DATE + 'T00:00:00');
        if (!isNaN(rowDate.getTime()) && (!latestDate || rowDate > latestDate)) {
          latestDate = rowDate;
        }
        
        // Count if the date matches today
        if (row.DATE === todayStr) {
          todayCount++;
        }
      }

      return {
        ...row,
        durationMins,
        formattedDuration: hasDuration ? formatDuration(durationMins) : '—',
        rawDuration: row.Time_Taken || '—',
        formattedDate: formatDate(row.DATE),
        exceedsThreshold,
        NO_OF_ARTICLES: Number(row.NO_OF_ARTICLES) || 0,
        SYSTEM_STOCK: Number(row.SYSTEM_STOCK) || 0,
        SCANNED_QTY: Number(row.SCANNED_QTY) || 0,
        NET_DIFFERENCE: Number(row.NET_DIFFERENCE) || 0,
        SHORT_QTY: Number(row.SHORT_QTY) || 0,
        EXCESS_QTY: Number(row.EXCESS_QTY) || 0
      };
    });

    const avgDuration = validDurationCount > 0 ? totalDuration / validDurationCount : null;

    // Sort longest → shortest for the bar chart
    const storeDurations = [...parsedData]
      .filter(r => r.durationMins !== null)
      .sort((a, b) => b.durationMins - a.durationMins);

    return {
      storesReported: parsedData.length,
      latestDate: latestDate ? latestDate.toISOString().split('T')[0] : null,
      latestDateFormatted: latestDate
        ? latestDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
      avgDurationMins: avgDuration,
      avgDurationFormatted: formatDuration(avgDuration),
      fastestDurationMins: minDuration !== Infinity ? minDuration : null,
      fastestDurationFormatted: minDuration !== Infinity ? formatDuration(minDuration) : '—',
      fastestStore,
      slowestDurationMins: maxDuration !== -Infinity ? maxDuration : null,
      slowestDurationFormatted: maxDuration !== -Infinity ? formatDuration(maxDuration) : '—',
      slowestStore,
      todayCount,
      parsedData,
      storeDurations,
      SLA_THRESHOLD_MINS
    };
  }, [rawData]);
}
