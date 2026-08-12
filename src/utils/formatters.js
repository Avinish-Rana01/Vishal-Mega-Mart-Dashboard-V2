/**
 * Formatting Utility Functions
 */

/**
 * Formats a number to Indian numbering system string (e.g. 1,03,803)
 */
export function formatNumber(val) {
  const num = parseInt(val || '0', 10);
  return isNaN(num) ? '0' : num.toLocaleString('en-IN');
}

/**
 * Formats date string into YYYY-MM-DD
 */
export function formatDate(rawDate) {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  return String(rawDate).trim().split(' ')[0];
}

/**
 * Calculates stock coverage percentage string
 */
export function formatCoverage(sapQty, rfidQty, rawPercentage) {
  if (rawPercentage) {
    const pStr = String(rawPercentage).trim();
    if (pStr.endsWith('%')) return pStr;
    const pNum = parseFloat(pStr);
    if (!isNaN(pNum)) return pNum.toFixed(2) + '%';
  }

  const sap = parseInt(sapQty || '0', 10);
  const rfid = parseInt(rfidQty || '0', 10);

  if (sap <= 0) return '0%';
  return ((rfid / sap) * 100).toFixed(2) + '%';
}
