const axios = require('axios');
const fs = require('fs');
const { performance } = require('perf_hooks');

const API_BASE = 'http://localhost:5000';
const USER_ID = '26'; 
const PAGE_INDEX = 1;
const PAGE_SIZE = 10;
const DATE = new Date().toISOString().split('T')[0];

const endpoints = [
  { name: 'LiveStock', url: `/api/stock/live-details?pageIndex=${PAGE_INDEX}&pageSize=${PAGE_SIZE}&searchTerm=&userId=${USER_ID}` },
  { name: 'CycleCount', url: `/api/stock/cycle-count-dashboard?pageIndex=${PAGE_INDEX}&pageSize=${PAGE_SIZE}&searchTerm=&sortColumn=STORE%20CODE&sortDirection=ASC&userId=${USER_ID}` },
  { name: 'VendorDiscrepancy', url: `/api/stock/vendor-hu-discrepancy?pageIndex=${PAGE_INDEX}&pageSize=${PAGE_SIZE}&searchTerm=&sortColumn=DIFF_TILL_DATE&sortDirection=asc&userId=${USER_ID}` },
  { name: 'TagLocation', url: `/api/stock/tag-management-location` },
  { name: 'TagCycleCount', url: `/api/stock/tag-cycle-count` },
  { name: 'StoreDashboard', url: `/api/stock/store-dashboard?pageIndex=${PAGE_INDEX}&pageSize=${PAGE_SIZE}&searchTerm=&sortColumn=Store&sortDirection=asc&userId=${USER_ID}` },
  { name: 'SaleDashboard', url: `/api/stock/sale-dashboard?pageIndex=${PAGE_INDEX}&pageSize=${PAGE_SIZE}&searchTerm=&sortColumn=Store&sortDirection=asc&userId=${USER_ID}` },
  { name: 'VoidDashboard', url: `/api/stock/void-dashboard?pageIndex=${PAGE_INDEX}&pageSize=${PAGE_SIZE}&searchTerm=&sortColumn=Store&sortDirection=asc&userId=${USER_ID}` },
  { name: 'ReturnDashboard', url: `/api/stock/return-dashboard?pageIndex=${PAGE_INDEX}&pageSize=${PAGE_SIZE}&searchTerm=&sortColumn=Store&sortDirection=asc&userId=${USER_ID}` },
  { name: 'WarehouseEncoding', url: `/api/stock/warehouse-encoding?fromDate=${DATE}&toDate=${DATE}` },
  { name: 'DcValidation', url: `/api/stock/dc-validate-dashboard?pageIndex=${PAGE_INDEX}&pageSize=${PAGE_SIZE}&userId=${USER_ID}` }
];

async function measureApi(endpoint) {
  const start = performance.now();
  let success = false;
  let status = 0;
  try {
    const res = await axios.get(API_BASE + endpoint.url, { headers: { 'Accept': 'application/json' }, timeout: 15000 });
    success = res.status === 200;
    status = res.status;
  } catch (e) {
    status = e.response ? e.response.status : e.message;
  }
  const duration = performance.now() - start;
  return { name: endpoint.name, duration, success, status };
}

function calculateMetrics(times) {
  if (times.length === 0) return { p50: 'N/A', p90: 'N/A', p95: 'N/A', p99: 'N/A', stdDev: 'N/A', median: 'N/A' };
  times.sort((a, b) => a - b);
  
  const percentile = (p) => times[Math.floor(p * (times.length - 1))].toFixed(2);
  
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  
  const variance = times.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance).toFixed(2);
  
  return {
    median: percentile(0.50),
    p90: percentile(0.90),
    p95: percentile(0.95),
    p99: percentile(0.99),
    stdDev: stdDev
  };
}

async function runTest() {
  const stats = {};
  endpoints.forEach(e => {
    stats[e.name] = { min: Infinity, max: 0, sum: 0, count: 0, errors: 0, times: [] };
  });

  const ITERATIONS = 60;
  console.log(`Starting Detailed API Benchmark: ${ITERATIONS} iterations, 1 second apart...`);
  
  for (let i = 0; i < ITERATIONS; i++) {
    console.log(`Iteration ${i + 1}/${ITERATIONS}...`);
    const results = await Promise.all(endpoints.map(e => measureApi(e)));
    
    results.forEach(res => {
      const s = stats[res.name];
      s.count++;
      if (res.success) {
        s.times.push(res.duration);
        s.sum += res.duration;
        if (res.duration < s.min) s.min = res.duration;
        if (res.duration > s.max) s.max = res.duration;
      } else {
        s.errors++;
      }
    });

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  let report = `\`\`\`markdown\n# Detailed API Performance Report (60 Iterations)\n\n`;
  report += `This report details the response time of the 11 dashboard APIs, hit simultaneously once per second for 1 minute.\n\n`;
  report += `| API Endpoint | Avg (ms) | Median (ms) | P90 (ms) | P95 (ms) | P99 (ms) | Min (ms) | Max (ms) | Std Dev (ms) | Cache Hits (Est) | Errors |\n`;
  report += `|---|---|---|---|---|---|---|---|---|---|---|\n`;

  for (const [name, s] of Object.entries(stats)) {
    const avgNum = s.count - s.errors > 0 ? (s.sum / (s.count - s.errors)) : 0;
    const avg = avgNum > 0 ? avgNum.toFixed(2) : 'N/A';
    const min = s.min === Infinity ? 'N/A' : s.min.toFixed(2);
    const max = s.max.toFixed(2);
    
    const metrics = calculateMetrics(s.times);
    
    // Assume anything < 200ms is a cache hit based on local network speeds and fast cache
    const cacheHits = s.times.filter(t => t < 200).length;
    const cacheHitRate = s.times.length > 0 ? ((cacheHits / s.times.length) * 100).toFixed(1) + '%' : 'N/A';
    
    report += `| ${name} | ${avg} | ${metrics.median} | ${metrics.p90} | ${metrics.p95} | ${metrics.p99} | ${min} | ${max} | ${metrics.stdDev} | ${cacheHits}/${s.times.length} (${cacheHitRate}) | ${s.errors}/${s.count} |\n`;
  }
  report += `\n\`\`\``;

  fs.writeFileSync('C:/Users/MARKSS/.gemini/antigravity-ide/brain/ad091712-a1e0-4bd9-8d77-4ed5eaa6ecae/api_benchmark_report_detailed.md', report);
  console.log("Benchmark complete. Report saved.");
}

runTest();
