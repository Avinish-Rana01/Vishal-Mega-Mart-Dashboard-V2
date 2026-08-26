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
    
    // Generate realistic base total DPOS sale (e.g. 300 to 1200 items)
    const totalDposSale = Math.floor(Math.random() * 800) + 400;

    // Realistic split: ~0.5% Manual, ~9.5% Taffeta, and the remaining ~90% RFID Checkout
    const manualRate = 0.003 + Math.random() * 0.004; // 0.3% - 0.7%
    const taffetaRate = 0.085 + Math.random() * 0.02;  // 8.5% - 10.5%
    
    const manualSale = Math.max(1, Math.round(totalDposSale * manualRate));
    const taffetaSale = Math.round(totalDposSale * taffetaRate);
    const totalRfidCheckout = totalDposSale - taffetaSale - manualSale;

    totals.totalDposSale += totalDposSale;
    totals.totalRfidCheckout += totalRfidCheckout;
    totals.totalManualSale += manualSale;
    totals.totalTaffetaSale += taffetaSale;

    return {
      RowNumber: i + 1,
      STORE: storeCode,
      STORE_NAME: storeName,
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
