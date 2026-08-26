import { STORE_MAPPING } from '../config/constants';

export const generateMockReturnDashboard = (count = 20) => {
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
    
    // Generate realistic randomized return quantities
    const returnQty = Math.floor(Math.random() * 50) + 10;
    const encodeQty = Math.floor(Math.random() * returnQty);
    const differenceQty = returnQty - encodeQty;

    summary.returnQty += returnQty;
    summary.returnEncodedQty += encodeQty;
    summary.pendingQty += differenceQty;

    return {
      RowNumber: i + 1,
      DATE: "2026-08-25 12:00 AM Tuesday",
      LASTDATE: "2026-08-18 12:00 AM Tuesday",
      Store_Code: storeCode,
      STORE_NAME: `${storeCode} - ${storeName}`,
      RETURN_QTY: returnQty,
      ENCODE_QTY: encodeQty,
      DIFFERENCE_QTY: differenceQty
    };
  });

  return { summary, items };
};
