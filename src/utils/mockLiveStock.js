// --- MOCK DATA GENERATOR ---
export const generateMockData = () => {
  const stores = [];
  let totalSap = 0;
  let totalRfid = 0;

  for (let i = 1; i <= 50; i++) {
    const storeCode = `ST${i.toString().padStart(3, '0')}`;
    const sapStock = Math.floor(Math.random() * 50000) + 10000; // 10k-60k
    
    // Distribute accuracy: 46% >=95, 26% 90-95, 17% 80-90, 11% <80
    const rand = Math.random();
    let accuracy;
    if (rand < 0.46) accuracy = 0.95 + Math.random() * 0.05; // 95-100%
    else if (rand < 0.72) accuracy = 0.90 + Math.random() * 0.05; // 90-95%
    else if (rand < 0.89) accuracy = 0.80 + Math.random() * 0.10; // 80-90%
    else accuracy = 0.60 + Math.random() * 0.20; // 60-80%

    const rfidStock = Math.floor(sapStock * accuracy);
    const diff = sapStock - rfidStock;
    const percentage = ((rfidStock / sapStock) * 100).toFixed(2);

    totalSap += sapStock;
    totalRfid += rfidStock;

    stores.push({
      STORE_CODE: storeCode,
      STORE_NAME: `${storeCode} - Mock Store ${i}`,
      SAP_STOCK: sapStock,
      RFID_STOCK: rfidStock,
      DIFFERENCE: diff,
      PERCENTAGE: percentage
    });
  }

  const mockTotals = {
    SAP_STOCK: totalSap.toLocaleString('en-IN'),
    RFID_STOCK: totalRfid.toLocaleString('en-IN'),
    DIFFERENCE: (totalSap - totalRfid).toLocaleString('en-IN')
  };

  return { mockStores: stores, mockTotals };
};
