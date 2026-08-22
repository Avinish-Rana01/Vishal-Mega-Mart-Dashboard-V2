export function generateMockStoreValidation(count = 20) {
  const stores = [];
  let totalReceived = 0;
  let totalValidated = 0;
  let totalHht = 0;
  let totalWrong = 0;
  let totalPending = 0;

  for (let i = 1; i <= count; i++) {
    const storeCode = `HD${Math.floor(Math.random() * 900) + 100}`;
    const received = Math.floor(Math.random() * 500) + 100;
    
    // Validated is usually somewhat less than or equal to received
    const validated = Math.floor(received * (Math.random() * 0.4 + 0.6)); 
    
    // HHT is part of validated
    const hht = Math.floor(validated * (Math.random() * 0.5 + 0.5));
    
    // Wrong is a small number
    const wrong = Math.random() > 0.5 ? Math.floor(Math.random() * 5) : 0;
    
    const pending = received - validated;

    totalReceived += received;
    totalValidated += validated;
    totalHht += hht;
    totalWrong += wrong;
    totalPending += pending;

    stores.push({
      STORE: storeCode,
      STORE_NAME: `Store ${storeCode}`,
      DATE: new Date().toISOString().replace('T', ' ').substring(0, 19),
      HU_RECEIVED_QTY: received,
      HU_VALIDATED_QTY: validated,
      HHT_VALIDATE_QTY: hht,
      STORE_PENDING_QTY: pending,
      HU_WRONG_QTY: wrong,
    });
  }

  const mockTotals = {
    HU_RECEIVED_QTY: totalReceived.toLocaleString('en-IN'),
    HU_VALIDATED_QTY: totalValidated.toLocaleString('en-IN'),
    HHT_VALIDATE_QTY: totalHht.toLocaleString('en-IN'),
    ENCODED_QTY: totalValidated.toLocaleString('en-IN'), // roughly same
    HU_WRONG_QTY: totalWrong.toLocaleString('en-IN'),
    STORE_PENDING_QTY: totalPending.toLocaleString('en-IN')
  };

  return { mockStores: stores, mockTotals };
}
