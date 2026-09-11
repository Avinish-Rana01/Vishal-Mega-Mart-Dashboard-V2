# Pending Optimizations & Handover Guide

This document captures the latest architecture status, completed fixes, and the next 3 planned optimizations for the **Vishal Mega Mart Dashboard V2** frontend.

---

## 📌 Summary of Completed Work

1. **WebSocket / SignalR Lifecycle (`liveStockSocket.js`)**:
   - Removed the 5-second consumer-count idle auto-disconnect logic.
   - Connection stays active continuously across tab and report navigation.
   - Disconnect occurs strictly on explicit user logout or browser window unload.

2. **Empty Results / Stale Data Fix (`useDashboardData.js`)**:
   - Removed `baseFetch.data.length > 0` condition from `useLiveStock`, `useCycleCount`, `useVendorDiscrepancy`, and `useStoreDashboard`.
   - When an API search/filter returns zero rows (`[]`), the frontend immediately clears previous results and resets summary totals.

3. **Dynamic User ID Integration (`stockService.js` & `AuthContext.jsx`)**:
   - Fixed property casing to support `response.userID: "30"` (capital `ID`) returned by backend `POST /api/Auth/login`.
   - Replaced hardcoded `API_DEFAULTS.USER_ID = '26'` with dynamic helper `getActiveUserId()`.

---

## 🚀 Tomorrow's Planned Optimizations

### 1. Centralize `userId` via an Axios Request Interceptor
**Objective**: Instead of manually appending `&userId=${getActiveUserId()}` to individual URLs across `stockService.js`, automatically inject the active user ID (and future JWT tokens) via an Axios request interceptor.

#### Implementation Plan:
In `src/services/apiClient.js` (or at the top of `src/services/stockService.js`):
```javascript
import axios from 'axios';
import { getActiveUserId } from './stockService';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

apiClient.interceptors.request.use((config) => {
  const userId = getActiveUserId();
  if (userId) {
    config.params = {
      ...config.params,
      userId
    };
  }

  // Future JWT Token support:
  // const token = sessionStorage.getItem('vmm_token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }

  return config;
}, (error) => Promise.reject(error));

export default apiClient;
```

---

### 2. Expose Full User Metadata in `AuthContext` (For Planned RBAC)
**Objective**: The backend login response returns valuable role and assignment information:
```json
{
  "userID": "30",
  "userName": "Admin",
  "userType": "Super Admin",
  "storeCode": "",
  "warehouseCode": "",
  "storeName": "",
  "warehouseName": ""
}
```

#### Implementation Plan:
Update `src/context/AuthContext.jsx`:
1. Add state hooks for `userType`, `storeCode`, and `warehouseCode`:
   ```javascript
   const [userType, setUserType] = useState(null);
   const [storeCode, setStoreCode] = useState(null);
   const [warehouseCode, setWarehouseCode] = useState(null);
   ```
2. Parse and populate them in both `login(userData)` and the initial session restoration `useEffect`:
   ```javascript
   setUserType(parsed.userType || null);
   setStoreCode(parsed.storeCode || null);
   setWarehouseCode(parsed.warehouseCode || null);
   ```
3. Expose them in the Context Provider `value`:
   ```javascript
   const value = {
     isLoggedIn,
     loggedInUser,
     userId,
     userType,
     storeCode,
     warehouseCode,
     login,
     logout
   };
   ```
4. **Usage in Components**:
   - Restrict store billers (`userType === 'Store'`) to their assigned `storeCode`.
   - Hide DC tabs (`DcValidation`, `DcEncoding`) from non-warehouse users.

---

### 3. Vite Vendor Chunk Splitting (`vite.config.js`)
**Objective**: Eliminate the Vite build warning (`(!) Some chunks are larger than 500 kB after minification: dist/assets/index-*.js: 1,532 kB`) by splitting heavy libraries into separate cached browser bundles.

#### Implementation Plan:
Update `vite.config.js`:
```javascript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_API_BASE_URL || 'http://localhost:5000';

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) return 'vendor-charts';
              if (id.includes('@microsoft/signalr')) return 'vendor-signalr';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('datatables.net') || id.includes('jquery')) return 'vendor-tables';
              return 'vendor-core';
            }
          }
        }
      },
      chunkSizeWarningLimit: 600
    },
    server: {
      port: 5999,
      proxy: {
        '/Dashboard.aspx': { target: backendTarget, changeOrigin: true, secure: false },
        '/api': { target: backendTarget, changeOrigin: true, secure: false },
        '/hubs': { target: backendTarget, changeOrigin: true, ws: true, secure: false }
      }
    }
  };
});
```

---

## 🛠️ Verification & Development Commands

- **Start Development Server**:
  ```bash
  npm run dev
  ```
  Runs on `http://localhost:5999`.

- **Production Build Validation**:
  ```bash
  npm run build
  ```
