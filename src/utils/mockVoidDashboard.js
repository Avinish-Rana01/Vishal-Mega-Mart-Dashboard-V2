import { STORE_MAPPING } from '../config/constants';

export const generateMockVoidDashboard = (count = 20) => {
  const storeCodes = Object.keys(STORE_MAPPING);
  const actualCount = Math.min(count, storeCodes.length);

  let summary = {
    recordCount: count,
    totalCount: 0,
    returnQty: 0,
    returnEncodedQty: 0,
    pendingQty: 0
  };

  const items = Array.from({ length: actualCount }, (_, i) => {
    const storeCode = storeCodes[i];
    const storeName = STORE_MAPPING[storeCode];
    
    // Generate realistic void numbers
    const voidQty = Math.floor(Math.random() * 50); // up to 50 voids
    // Encoded is some random amount less than or equal to voidQty
    const encodeQty = Math.floor(Math.random() * (voidQty + 1)); 
    const diffQty = voidQty - encodeQty;

    summary.returnQty += voidQty;
    summary.returnEncodedQty += encodeQty;
    summary.pendingQty += diffQty;

    return {
      RowNumber: i + 1,
      DATE: "2026-08-24 12:00 AM Monday",
      LASTDATE: "2026-08-17 12:00 AM Monday",
      STORE: storeCode,
      STORE_NAME: `${storeCode} - ${storeName}`,
      VOID_QTY: voidQty,
      ENCODE_QTY: encodeQty,
      DIFFERENCE_QTY: diffQty
    };
  });

  return { summary, items };
};
