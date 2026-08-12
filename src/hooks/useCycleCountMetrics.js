import { useMemo } from 'react';

const OVERTIME_THRESHOLD_MINS = 240;

function parseDurationMins(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    return (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10) + (parseInt(parts[2], 10) / 60);
  }
  return 0;
}

function formatDuration(totalMins) {
  if (!totalMins || isNaN(totalMins)) return '0m';
  const hours = Math.floor(totalMins / 60);
  const mins = Math.round(totalMins % 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function useCycleCountMetrics(rawData) {
  return useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) {
      return {
        totalAudits: 0,
        avgDurationFormatted: '0m',
        overtimeCount: 0,
        fastestAuditFormatted: '0m',
        fastestStore: '-',
        slowestAuditFormatted: '0m',
        slowestStore: '-',
        parsedData: [],
        exceptions: [],
        storeDurations: []
      };
    }

    let totalDuration = 0;
    let minDuration = Infinity;
    let maxDuration = -Infinity;
    let fastestStore = '-';
    let slowestStore = '-';
    let overtimeCount = 0;
    
    const parsedData = [];
    const exceptions = [];

    rawData.forEach(row => {
      const durationMins = parseDurationMins(row.Time_Taken);
      const isOvertime = durationMins > OVERTIME_THRESHOLD_MINS;
      
      const parsedRow = {
        ...row,
        durationMins,
        formattedDuration: formatDuration(durationMins),
        isOvertime,
        status: isOvertime ? 'Overtime' : 'Normal'
      };

      parsedData.push(parsedRow);
      totalDuration += durationMins;

      if (durationMins < minDuration) {
        minDuration = durationMins;
        fastestStore = row.STORE_CODE;
      }
      if (durationMins > maxDuration) {
        maxDuration = durationMins;
        slowestStore = row.STORE_CODE;
      }
      if (isOvertime) {
        overtimeCount++;
        exceptions.push({
          storeName: row.STORE_NAME || row.STORE_CODE,
          durationFormatted: parsedRow.formattedDuration,
          exceedsByFormatted: formatDuration(durationMins - OVERTIME_THRESHOLD_MINS)
        });
      }
    });

    const totalAudits = parsedData.length;
    const avgDuration = totalAudits > 0 ? totalDuration / totalAudits : 0;

    // Sort for the bar chart (fastest to slowest)
    const storeDurations = [...parsedData].sort((a, b) => a.durationMins - b.durationMins);

    return {
      totalAudits,
      avgDurationFormatted: formatDuration(avgDuration),
      overtimeCount,
      overtimeRate: totalAudits > 0 ? Math.round((overtimeCount / totalAudits) * 100) : 0,
      fastestAuditFormatted: minDuration !== Infinity ? formatDuration(minDuration) : '0m',
      fastestStore,
      slowestAuditFormatted: maxDuration !== -Infinity ? formatDuration(maxDuration) : '0m',
      slowestStore,
      parsedData,
      exceptions,
      storeDurations,
      OVERTIME_THRESHOLD_MINS
    };
  }, [rawData]);
}
