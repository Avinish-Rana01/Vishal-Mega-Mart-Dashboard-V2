import { STORE_MAPPING } from '../config/constants';

export const generateMockSaleDashboard = (count = 20) => {
  const storeCodes = Object.keys(STORE_MAPPING);
  const actualCount = Math.min(count, storeCodes.length);

  let totals = {
    recordCount: count,
    totalDposSale: 0,
    totalRfidCheckout: 0,
    totalTaffetaSale: 0,
    totalManualSale: 0
  };

  const items = Array.from({ length: actualCount }, (_, i) => {
    const storeCode = storeCodes[i];
    const storeName = STORE_MAPPING[storeCode];
    
    // Generate realistic numbers
    const totalDposSale = Math.floor(Math.random() * 500) + 100;
    const totalRfidCheckout = totalDposSale + Math.floor(Math.random() * 20) - 10;
    const manualSale = Math.floor(Math.random() * 50);
    const taffetaSale = Math.floor(Math.random() * 15);

    totals.totalDposSale += totalDposSale;
    totals.totalRfidCheckout += totalRfidCheckout;
    totals.totalManualSale += manualSale;
    totals.totalTaffetaSale += taffetaSale;

    return {
      RowNumber: i + 1,
      STORE: storeCode,
      STORE_NAME: `${storeCode} - ${storeName}`,
      DATE: "2026-08-23 12:00 AM Sunday",
      LASTDATE: "2026-08-16 12:00 AM Sunday",
      TOTAL_DPOS_SALE: totalDposSale,
      TOTAL_RFID_CHECKOUT: totalRfidCheckout,
      TOTAL_TAFFETA_SALE: taffetaSale,
      TOTAL_MANUAL_SALE: manualSale
    };
  });

  return { summary: totals, items };
};
