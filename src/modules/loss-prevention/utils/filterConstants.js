/**
 * Filter Constants and Utilities for Store and Date filtering
 */

export const STORES_LIST = [
  { id: 'all', storeCode: '', name: 'All Stores (Overall)', location: 'Global Network' },
  { id: 'HD44', storeCode: 'HD44', name: 'HD44 - Uttam Nagar 2', location: 'Delhi' },
  { id: 'HD55', storeCode: 'HD55', name: 'HD55 - Dwarka', location: 'Delhi' },
  { id: 'HH15', storeCode: 'HH15', name: 'HH15 - Dundahera', location: 'Delhi' },
  { id: 'HH40', storeCode: 'HH40', name: 'HH40 - GURGAON SEC-89', location: 'Gurgaon' },
  { id: 'HH43', storeCode: 'HH43', name: 'HH43 - GURGAON SEC-102', location: 'Gurgaon' },
  { id: 'HH45', storeCode: 'HH45', name: 'HH45 - GURGAON SEC-92', location: 'Gurgaon' },
];

export const DATE_PRESETS = [
  'Today',
  'Yesterday',
  'Last 7 Days',
  'This Month',
  'Last 30 Days',
];


export const formatDate = (date) => {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    const [y, m, d] = date.trim().split('-');
    return `${d}-${m}-${y}`;
  }
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatApiDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

