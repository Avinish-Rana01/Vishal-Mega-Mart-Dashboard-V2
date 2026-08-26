import { STORE_MAPPING } from '../config/constants';

export function generateMockDcValidation(count = 20) {
  const storeCodes = Object.keys(STORE_MAPPING);
  const actualCount = Math.min(count, storeCodes.length);
  const items = [];
  let totalProcessedHu = 0;
  let totalUnprocessedHu = 0;
  let totalArticleQty = 0;

  for (let i = 0; i < actualCount; i++) {
    const storeCode = storeCodes[i];
    
    // Simulate typical DC validation stats
    const processedHu = Math.floor(Math.random() * 50) + 10;
    // Most stores have 0 backlog, some have a few
    const unprocessedHu = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0; 
    
    // Roughly 20-30 articles per HU
    const articleQty = processedHu * (Math.floor(Math.random() * 10) + 20);

    totalProcessedHu += processedHu;
    totalUnprocessedHu += unprocessedHu;
    totalArticleQty += articleQty;

    items.push({
      RowNumber: i + 1,
      DATE: new Date().toISOString().replace('T', ' ').substring(0, 19),
      LASTDATE: "2026-08-19 12:00 AM",
      Reciving_Plant: storeCode,
      STORE_NAME: STORE_MAPPING[storeCode],
      PROCESSED_HU: processedHu,
      UNPROCESSED_HU: unprocessedHu,
      PROCESSED_ARTICLE_QTY: articleQty
    });
  }

  const summary = {
    recordCount: items.length,
    processedHu: totalProcessedHu,
    unprocessedHu: totalUnprocessedHu,
    articleQty: totalArticleQty
  };

  return { items, summary };
}
