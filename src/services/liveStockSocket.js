import * as signalR from '@microsoft/signalr';

/**
 * Service to manage SignalR connection for Real-Time Dashboard Updates:
 * - Live Stock
 * - Cycle Count
 * - Store Validation
 * - DC Encoding
 * - Tag Management
 * - Vendor Discrepancy
 */
class DashboardSocketService {
  constructor() {
    this.connection = null;
    this.patchListeners = new Set(); // Live Stock
    this.cyclePatchListeners = new Set();
    this.storeValidationPatchListeners = new Set();
    this.dcEncodingPatchListeners = new Set();
    this.tagManagementPatchListeners = new Set();
    this.vendorDiscrepancyPatchListeners = new Set();

    this.statusListeners = new Set();
    this.isConnected = false;
    this.isConnecting = false;
  }

  getHubUrl() {
    let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    baseUrl = baseUrl.replace(/\/+$/, '');
    return `${baseUrl}/hubs/dashboard`;
  }

  async connect() {
    if (this.connection) {
      if (
        this.connection.state === signalR.HubConnectionState.Connected ||
        this.connection.state === signalR.HubConnectionState.Connecting ||
        this.connection.state === signalR.HubConnectionState.Reconnecting
      ) {
        return;
      }
      try {
        await this.connection.stop();
      } catch (e) {
        // ignore
      }
      this.connection = null;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.notifyStatus('connecting');

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.getHubUrl(), {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            // Jittered backoff: Stagger reconnects across 500 concurrent users so they do not hammer the server simultaneously
            if (retryContext.previousRetryCount >= 10) return null;
            const delays = [2000, 4000, 8000, 15000, 30000];
            const baseDelay = delays[Math.min(retryContext.previousRetryCount, delays.length - 1)];
            const jitter = Math.floor(Math.random() * 1500); // 0-1500ms random jitter
            return baseDelay + jitter;
          }
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      // 1. Live Stock
      this.connection.on('ReceiveLiveStockPatch', (patch) => {
        this.dispatch(this.patchListeners, patch, 'LiveStock');
      });

      // 2. Cycle Count
      this.connection.on('ReceiveCycleCountPatch', (patch) => {
        this.dispatch(this.cyclePatchListeners, patch, 'CycleCount');
      });

      // 3. Store Validation
      this.connection.on('ReceiveStoreValidationPatch', (patch) => {
        this.dispatch(this.storeValidationPatchListeners, patch, 'StoreValidation');
      });

      // 4. DC Encoding
      this.connection.on('ReceiveDcEncodingPatch', (patch) => {
        this.dispatch(this.dcEncodingPatchListeners, patch, 'DcEncoding');
      });

      // 5. Tag Management
      this.connection.on('ReceiveTagManagementPatch', (patch) => {
        this.dispatch(this.tagManagementPatchListeners, patch, 'TagManagement');
      });

      // 6. Vendor Discrepancy
      this.connection.on('ReceiveVendorDiscrepancyPatch', (patch) => {
        this.dispatch(this.vendorDiscrepancyPatchListeners, patch, 'VendorDiscrepancy');
      });

      this.connection.onreconnecting(() => {
        this.isConnected = false;
        this.notifyStatus('reconnecting');
      });

      this.connection.onreconnected(() => {
        this.isConnected = true;
        this.notifyStatus('connected');
      });

      this.connection.onclose(() => {
        this.isConnected = false;
        this.isConnecting = false;
        this.notifyStatus('disconnected');
      });

      await this.connection.start();
      this.isConnected = true;
      this.isConnecting = false;
      this.notifyStatus('connected');
    } catch (err) {
      console.warn('[DashboardSocket] Initial connection failed, falling back:', err.message);
      this.isConnected = false;
      this.isConnecting = false;
      this.notifyStatus('disconnected');
    }
  }

  dispatch(listenerSet, patch, channelName) {
    listenerSet.forEach(cb => {
      try {
        cb(patch);
      } catch (err) {
        console.error(`[DashboardSocket] Error in ${channelName} listener:`, err);
      }
    });
  }

  disconnect() {
    if (this.connection) {
      try {
        this.connection.stop();
      } catch (e) {
        // ignore
      }
      this.connection = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.notifyStatus('disconnected');
    }
  }

  // Live Stock listeners
  onPatch(callback) {
    this.patchListeners.add(callback);
    return () => this.patchListeners.delete(callback);
  }

  // Cycle Count listeners
  onCycleCountPatch(callback) {
    this.cyclePatchListeners.add(callback);
    return () => this.cyclePatchListeners.delete(callback);
  }

  // Store Validation listeners
  onStoreValidationPatch(callback) {
    this.storeValidationPatchListeners.add(callback);
    return () => this.storeValidationPatchListeners.delete(callback);
  }

  // DC Encoding listeners
  onDcEncodingPatch(callback) {
    this.dcEncodingPatchListeners.add(callback);
    return () => this.dcEncodingPatchListeners.delete(callback);
  }

  // Tag Management listeners
  onTagManagementPatch(callback) {
    this.tagManagementPatchListeners.add(callback);
    return () => this.tagManagementPatchListeners.delete(callback);
  }

  // Vendor Discrepancy listeners
  onVendorDiscrepancyPatch(callback) {
    this.vendorDiscrepancyPatchListeners.add(callback);
    return () => this.vendorDiscrepancyPatchListeners.delete(callback);
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected ? 'connected' : this.isConnecting ? 'connecting' : 'disconnected');
    return () => this.statusListeners.delete(callback);
  }

  notifyStatus(status) {
    this.statusListeners.forEach(cb => {
      try {
        cb(status);
      } catch (err) {
        console.error('[DashboardSocket] Error in status listener:', err);
      }
    });
  }
}

export const liveStockSocket = new DashboardSocketService();
export const dashboardSocket = liveStockSocket;
