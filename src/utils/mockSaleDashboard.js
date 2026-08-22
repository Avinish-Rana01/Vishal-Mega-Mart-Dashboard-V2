export const generateMockSaleDashboard = (count = 20) => {
  const storeNames = [
    'Uttam Nagar', 'Dwarka', 'Dundahera', 'Lajpat Nagar', 'Karol Bagh',
    'Rohini Sector 15', 'Janakpuri', 'Vasant Kunj', 'Saket', 'Gurugram Sector 14',
    'Noida Sector 18', 'Faridabad', 'Ghaziabad', 'Connaught Place', 'South Extension',
    'Rajouri Garden', 'Kamla Nagar', 'Preet Vihar', 'Pitampura', 'Chandni Chowk'
  ];

  let totals = {
    recordCount: count,
    totalDposSale: 0,
    totalRfidCheckout: 0,
    totalDposRfidSale: 0,
    totalRfidCheckoutMatch: 0,
    totalRfidCheckoutNotMatch: 0,
    totalPosSaleNotMatch: 0,
    totalTaffetaSale: 0,
    totalManualSale: 0,
    totalVoid: 0,
    totalRfidCheckoutMatchDpos: 0,
    totalDiffVoid: 0
  };

  const items = Array.from({ length: count }, (_, i) => {
    const storeCode = `HD${(10 + i).toString().padStart(2, '0')}`;
    const storeName = storeNames[i % storeNames.length];
    
    // Generate somewhat realistic numbers
    const totalDposSale = Math.floor(Math.random() * 500) + 100;
    
    // Usually RFID checkout is close to DPOS sale, sometimes slightly higher or lower
    const totalRfidCheckout = totalDposSale + Math.floor(Math.random() * 20) - 10;
    
    const rfidMatch = Math.floor(Math.min(totalDposSale, totalRfidCheckout) * (0.85 + Math.random() * 0.15));
    const rfidNotMatch = totalRfidCheckout - rfidMatch;
    
    const manualSale = Math.floor(Math.random() * 50);
    const voidSale = Math.floor(Math.random() * 30);
    const taffetaSale = Math.floor(Math.random() * 15);

    totals.totalDposSale += totalDposSale;
    totals.totalRfidCheckout += totalRfidCheckout;
    totals.totalRfidCheckoutMatch += rfidMatch;
    totals.totalRfidCheckoutNotMatch += rfidNotMatch;
    totals.totalManualSale += manualSale;
    totals.totalVoid += voidSale;
    totals.totalTaffetaSale += taffetaSale;

    return {
      RowNumber: i + 1,
      STORE: storeCode,
      STORE_NAME: `${storeCode} - ${storeName}`,
      DATE: "2026-08-21 12:00 AM Friday",
      LASTDATE: "2026-08-14 12:00 AM Friday",
      TOTAL_DPOS_SALE: totalDposSale,
      TOTAL_RFID_CHECKOUT: totalRfidCheckout,
      TOTAL_RFID_DPOS_SALE: totalDposSale + manualSale,
      RFID_CHECKOUT_MATCHING_WITH_DPOS_SALE: rfidMatch,
      RFID_CHECKOUT_NOT_MATCHING_WITH_DPOS_SALE: rfidNotMatch,
      DPOS_SALE_NOT_MATCHING_WITH_RFID_CHECKOUT: totalDposSale - rfidMatch,
      TOTAL_TAFFETA_SALE: taffetaSale,
      TOTAL_MANUAL_SALE: manualSale,
      TOTAL_VOID: voidSale,
      RFID_CHECKOUT_MATCHING_WITH_DPOS_VOID: Math.floor(voidSale * 0.8),
      TOTAL_DIFF_VOID: Math.floor(voidSale * 0.2)
    };
  });

  return { summary: totals, items };
};
