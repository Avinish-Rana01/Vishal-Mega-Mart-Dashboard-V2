export const generateMockVoidDashboard = (count = 20) => {
  const storeNames = [
    'Uttam Nagar 2', 'Dwarka', 'Dundahera', 'Lajpat Nagar', 'Karol Bagh',
    'Rohini Sector 15', 'Janakpuri', 'Vasant Kunj', 'Saket', 'Gurugram Sector 14',
    'Noida Sector 18', 'Faridabad', 'Ghaziabad', 'Connaught Place', 'South Extension',
    'Rajouri Garden', 'Kamla Nagar', 'Preet Vihar', 'Pitampura', 'Chandni Chowk'
  ];

  let summary = {
    recordCount: count,
    totalCount: 0,
    returnQty: 0,
    returnEncodedQty: 0,
    pendingQty: 0
  };

  const items = Array.from({ length: count }, (_, i) => {
    const storeCode = `HD${(10 + i).toString().padStart(2, '0')}`;
    const storeName = storeNames[i % storeNames.length];
    
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
