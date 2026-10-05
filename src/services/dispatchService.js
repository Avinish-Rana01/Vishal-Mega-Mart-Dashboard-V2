import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Upload master file (RDC_MASTER or HU_INPUT) to backend API
 */
export const uploadDispatchFile = async (file, status, signal) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('status', status);

  const response = await axios.post(`${API_BASE}/api/Dispatch/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
    signal,
  });

  return response.data;
};

/**
 * Upload picklist Excel file to backend API
 */
export const uploadPicklistFile = async (file, signal) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE}/api/Dispatch/picklist-upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
    signal,
  });

  return response.data;
};

/**
 * Fetch dispatch report data (SP_NEW_REPORT status='DISPATCH_REPORT_DATA')
 */
export const getDispatchReport = async (params, signal) => {
  const response = await axios.get(`${API_BASE}/api/Dispatch/report`, {
    params,
    timeout: 30000,
    signal,
  });
  return response.data;
};

/**
 * Fetch modal details for vehicle drill-down (SP_NEW_REPORT status='DISPATCH_REPORT_DATA_VIEW')
 */
export const getDispatchReportDetails = async (params, signal) => {
  const response = await axios.get(`${API_BASE}/api/Dispatch/report-details`, {
    params,
    timeout: 30000,
    signal,
  });
  return response.data;
};

/**
 * Parse an Excel file (.xlsx or .xls) in the browser for instant client-side preview.
 * Intelligently inspects sheets to find the active sheet with headers & data rows.
 */
export const parseExcelPreview = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('The workbook contains no sheets.');
        }

        let bestSheetName = workbook.SheetNames[0];
        let bestHeaders = [];
        let bestRows = [];

        for (const sName of workbook.SheetNames) {
          const ws = workbook.Sheets[sName];
          if (!ws) continue;

          const matrix = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (!matrix || matrix.length === 0) continue;

          // Find the header row (first row with at least 2 non-empty cells)
          let headerRowIdx = -1;
          for (let i = 0; i < Math.min(matrix.length, 10); i++) {
            const row = matrix[i];
            if (Array.isArray(row)) {
              const nonEmpty = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
              if (nonEmpty.length >= 2) {
                headerRowIdx = i;
                break;
              }
            }
          }

          // Fallback if no multi-cell header row found: check row 0
          if (headerRowIdx === -1 && matrix[0] && Array.isArray(matrix[0])) {
            const nonEmpty = matrix[0].filter(c => c !== null && c !== undefined && String(c).trim() !== '');
            if (nonEmpty.length > 0) headerRowIdx = 0;
          }

          if (headerRowIdx === -1) continue;

          const headerRow = matrix[headerRowIdx];
          const headers = headerRow.map(h => String(h || '').trim()).filter(Boolean);

          // Parse data rows after headerRowIdx
          const rows = XLSX.utils.sheet_to_json(ws, {
            range: headerRowIdx,
            defval: '',
            blankrows: false
          }).filter(r => Object.values(r).some(v => v !== null && v !== undefined && String(v).trim() !== ''));

          // Scoring: prioritize sheets with data rows; if both have rows, prefer more rows; if neither, prefer more headers
          const currentScore = (bestRows.length > 0 ? 10000 + bestRows.length : bestHeaders.length);
          const candidateScore = (rows.length > 0 ? 10000 + rows.length : headers.length);

          if (candidateScore > currentScore || bestHeaders.length === 0) {
            bestSheetName = sName;
            bestHeaders = headers;
            bestRows = rows;
          }
        }

        resolve({
          headers: bestHeaders,
          rows: bestRows,
          sheetName: bestSheetName,
          totalRows: bestRows.length
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Normalization helper: strips non-alphanumeric characters and converts to UPPERCASE
 */
export const cleanCol = (col) => String(col || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

/**
 * Frontend Validation Engine based strictly on the Demo Excels:
 * - RDC_MASTER: Demo "MASTER MAPPING DATA.xls"
 *   Format A: ['Zone', 'RDC/STATE', 'SHED', 'SITE', 'STORE DESCRIPTION', 'RDC CODE']
 *   Format B: ['Receiving Site', 'Zone', 'State', 'S.DESC.', 'Vehicle Type', 'Day']
 * - HU_INPUT: Demo "HU LOAD FOR RDC .xlsx"
 *   Columns: ['HU No', 'Store', 'Store Desc', 'WH DESC', 'Created Date', 'Transfer Value', 'COUNT']
 * - PICKLIST: Demo "Picklist_File_Format.xlsx"
 *   Columns: ['Picklistno', 'Date', 'Material', 'Description', 'Qty', 'Pack', 'Box']
 */
export const validateExcelFileFormat = (type, headers = [], rows = []) => {
  if (!headers || headers.length === 0) {
    return {
      isValid: false,
      error: 'The uploaded file does not contain any readable header row. Please verify the workbook format.'
    };
  }

  const normHeaders = headers.map(cleanCol);

  if (type === 'RDC_MASTER') {
    // Requires Zone and Site (or Receiving Site)
    const hasZone = normHeaders.includes('ZONE');
    const hasSite = normHeaders.includes('SITE') || normHeaders.includes('RECEIVINGSITE') || normHeaders.some(h => h.includes('SITE'));

    if (!hasZone || !hasSite) {
      const missing = [];
      if (!hasZone) missing.push("'Zone'");
      if (!hasSite) missing.push("'Site' / 'Receiving Site'");
      return {
        isValid: false,
        error: `Invalid RDC Master format. Missing required columns: ${missing.join(' and ')}. Expected format from MASTER MAPPING DATA demo excel.`
      };
    }

    if (rows && rows.length > 0) {
      const validRows = rows.filter(r => {
        const zoneVal = r['Zone'] || r['ZONE'] || r['zone'];
        const siteVal = r['Site'] || r['SITE'] || r['SITE '] || r['Receiving Site'] || r['RECEIVING SITE'];
        return zoneVal || siteVal;
      });
      if (validRows.length === 0) {
        return {
          isValid: false,
          error: 'No valid data rows found with Zone or Site populated in the file.'
        };
      }
    }

    return { isValid: true, message: 'RDC Master columns verified successfully.' };
  }

  if (type === 'HU_INPUT') {
    // Expected: HU No, Store, Store Desc, WH DESC, Created Date, Transfer Value, COUNT
    const hasHuNo = normHeaders.some(h => h === 'HUNO' || h === 'HUNUMBER' || h.includes('HU'));
    const hasStore = normHeaders.some(h => h === 'STORE' || h === 'STORECODE' || h.includes('STORE'));

    if (!hasHuNo || !hasStore) {
      const missing = [];
      if (!hasHuNo) missing.push("'HU No'");
      if (!hasStore) missing.push("'Store'");
      return {
        isValid: false,
        error: `Invalid HU Input format. Missing required columns: ${missing.join(' and ')}. Expected columns: [HU No, Store, Store Desc, WH DESC, Created Date, Transfer Value, COUNT].`
      };
    }

    if (rows && rows.length > 0) {
      const hasValidHu = rows.some(r => {
        const hu = r['HU No'] || r['HU NO'] || r['Hu No'] || r['hu_no'] || r['Hu_No'] || r['HUNO'] || r['HUNo'];
        return hu !== undefined && String(hu).trim().length > 0;
      });
      if (!hasValidHu) {
        return {
          isValid: false,
          error: "No rows contain a valid 'HU No' in the file."
        };
      }
    }

    return { isValid: true, message: 'HU Input columns verified successfully.' };
  }

  if (type === 'PICKLIST') {
    // Expected: Picklistno, Date, Material, Description, Qty, Pack, Box
    const hasPicklist = normHeaders.some(h => h === 'PICKLISTNO' || h === 'PICKLISTNUMBER' || h.includes('PICKLIST'));
    const hasDate = normHeaders.includes('DATE');
    const hasMaterial = normHeaders.some(h => h === 'MATERIAL' || h === 'MATERIALNO' || h === 'ITEM');

    if (!hasPicklist || !hasDate || !hasMaterial) {
      const missing = [];
      if (!hasPicklist) missing.push("'Picklistno'");
      if (!hasDate) missing.push("'Date'");
      if (!hasMaterial) missing.push("'Material'");
      return {
        isValid: false,
        error: `Invalid Picklist format. Missing required columns: ${missing.join(', ')}. Expected columns: [Picklistno, Date, Material, Description, Qty, Pack, Box].`
      };
    }

    if (rows && rows.length > 0) {
      // Invariant: single picklist and date across all rows in the file
      const picklistSet = new Set();
      const dateSet = new Set();
      rows.forEach(r => {
        const pl = r['Picklistno'] || r['picklistno'] || r['PicklistNo'] || r['PICKLISTNO'];
        const dt = r['Date'] || r['date'] || r['DATE'];
        if (pl && String(pl).trim()) picklistSet.add(String(pl).trim());
        if (dt && String(dt).trim()) dateSet.add(String(dt).trim());
      });

      if (picklistSet.size > 1) {
        return {
          isValid: false,
          error: `Multiple Picklist numbers detected (${Array.from(picklistSet).join(', ')}). A picklist file must contain only a single Picklist number per batch.`
        };
      }
    }

    return { isValid: true, message: 'Picklist columns verified successfully.' };
  }

  return { isValid: true };
};

/**
 * Generate and download official Excel template dynamically in-memory
 * Strictly matching the exact headers provided in the images:
 * - Image 1 (RDC Master): ['Zone', 'RDC/STATE', 'SHED', 'SITE', 'STORE DESCRIPTION', 'RDC CODE']
 * - Image 2 (HU Input): ['HU No', 'Store', 'Store Desc', 'WH DESC', 'Created Date', 'Transfer Value', 'COUNT']
 * - Image 3 (Picklist): ['Picklistno', 'Date', 'Material', 'Description', 'Qty', 'Pack', 'Box']
 * 
 * Creates a blank template with ONLY the header row (0 disk space overhead in publish bundle).
 */
export const downloadTemplate = (type) => {
  let headers = [];
  let fileName = 'Template.xlsx';
  let sheetName = 'Sheet1';

  if (type === 'RDC_MASTER') {
    // Image 1: Zone, RDC/STATE, SHED, SITE, STORE DESCRIPTION, RDC CODE
    headers = ['Zone', 'RDC/STATE', 'SHED', 'SITE', 'STORE DESCRIPTION', 'RDC CODE'];
    fileName = 'MASTER_MAPPING_DATA_Template.xlsx';
    sheetName = 'DC';
  } else if (type === 'HU_INPUT') {
    // Image 2: HU No, Store, Store Desc, WH DESC, Created Date, Transfer Value, COUNT
    headers = ['HU No', 'Store', 'Store Desc', 'WH DESC', 'Created Date', 'Transfer Value', 'COUNT'];
    fileName = 'HU_LOAD_FOR_RDC_Template.xlsx';
    sheetName = 'dc 29';
  } else if (type === 'PICKLIST') {
    // Image 3: Picklistno, Date, Material, Description, Qty, Pack, Box
    headers = ['Picklistno', 'Date', 'Material', 'Description', 'Qty', 'Pack', 'Box'];
    fileName = 'Picklist_File_Format.xlsx';
    sheetName = 'ALLOCATION';
  }

  // Create worksheet with ONLY the header row (no sample rows)
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
};
