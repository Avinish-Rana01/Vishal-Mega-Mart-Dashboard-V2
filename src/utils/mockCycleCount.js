// --- MOCK DATA GENERATOR FOR CYCLE COUNT ---
// Generates realistic cycle count records for ~20 stores
// to demonstrate the dashboard at scale during demo.

const STORE_NAMES = [
  'Uttam Nagar 2', 'Dwarka', 'Dundahera', 'Rohini Sec 11', 'Janakpuri',
  'Lajpat Nagar', 'Pitampura', 'Rajouri Garden', 'Nehru Place', 'Saket',
  'Vasant Kunj', 'Noida Sec 18', 'Gurgaon DLF', 'Faridabad NIT', 'Ghaziabad Indirapuram',
  'Greater Noida', 'Meerut Cantt', 'Agra MG Road', 'Lucknow Gomti', 'Varanasi BHU'
];

function padTwo(n) {
  return n.toString().padStart(2, '0');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a realistic Time_Taken string (HH:MM:SS).
 * Distribution:
 *   ~60% fast audits    (30m - 1h 30m)
 *   ~25% normal audits  (1h 30m - 3h)
 *   ~10% slow audits    (3h - 5h)
 *   ~5%  outliers       (5h - 8h)
 */
function generateDuration() {
  const roll = Math.random();
  let totalSecs;
  if (roll < 0.60) {
    totalSecs = randomInt(30 * 60, 90 * 60);      // 30m–1h30m
  } else if (roll < 0.85) {
    totalSecs = randomInt(90 * 60, 180 * 60);      // 1h30m–3h
  } else if (roll < 0.95) {
    totalSecs = randomInt(180 * 60, 300 * 60);     // 3h–5h
  } else {
    totalSecs = randomInt(300 * 60, 600 * 60);     // 5h–10h (outlier)
  }
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`;
}

/**
 * Generates a start time and computes the end time from the duration.
 */
function generateTimes(durationStr) {
  // Start between 07:00 and 18:00
  const startH = randomInt(7, 18);
  const startM = randomInt(0, 59);
  const startS = randomInt(0, 59);

  const [dH, dM, dS] = durationStr.split(':').map(Number);
  const durationSecs = dH * 3600 + dM * 60 + dS;

  const startTotalSecs = startH * 3600 + startM * 60 + startS;
  const endTotalSecs = startTotalSecs + durationSecs;

  const endH = Math.floor(endTotalSecs / 3600) % 24;
  const endM = Math.floor((endTotalSecs % 3600) / 60);
  const endS = endTotalSecs % 60;

  return {
    start: `${padTwo(startH)}:${padTwo(startM)}:${padTwo(startS)}`,
    end: `${padTwo(endH)}:${padTwo(endM)}:${padTwo(endS)}`
  };
}

/**
 * Generates a recent date string (within the last 7 days).
 */
function generateRecentDate() {
  const now = new Date();
  const daysAgo = randomInt(0, 6);
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export function generateMockCycleCount(count = 20) {
  const records = [];

  for (let i = 0; i < count; i++) {
    const storeNum = i + 1;
    const prefix = storeNum <= 10 ? 'HD' : 'HH';
    const storeCode = `${prefix}${storeNum.toString().padStart(2, '0')}`;
    const storeName = `${storeCode} - ${STORE_NAMES[i % STORE_NAMES.length]}`;
    const date = generateRecentDate();
    const duration = generateDuration();
    const { start, end } = generateTimes(duration);
    const type = Math.random() < (1/150) ? 'MC' : 'TA';
    const refNo = date.replace(/-/g, '') + padTwo(randomInt(0, 23)) + padTwo(randomInt(0, 59)) + padTwo(randomInt(0, 59));

    records.push({
      RowNumber: i + 1,
      DATE: date,
      STORE_CODE: storeCode,
      STORE_NAME: storeName,
      CYCLE_COUNT_TYPE: type,
      REF_NO: refNo,
      Start_DateTime: start,
      END_DateTime: end,
      Time_Taken: duration
    });
  }

  return records;
}
