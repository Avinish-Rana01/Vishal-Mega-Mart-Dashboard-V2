import * as signalR from '@microsoft/signalr';

/**
 * Service to manage SignalR connection for Live Stock updates
 */
class LiveStockSocketService {
  constructor() {
    this.connection = null;
    this.patchListeners = new Set();
    this.statusListeners = new Set();
    this.isConnected = false;
    this.isConnecting = false;
  }

  getHubUrl() {
    let baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    baseUrl = baseUrl.replace(/\/+$/, '');
    return `${baseUrl}/hubs/livestock`;
  }

  async connect() {
    if (this.connection && (this.isConnected || this.isConnecting)) {
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
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.connection.on('ReceiveLiveStockPatch', (patch) => {
        this.patchListeners.forEach(cb => {
          try {
            cb(patch);
          } catch (err) {
            console.error('[LiveStockSocket] Error in patch listener:', err);
          }
        });
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
      console.warn('[LiveStockSocket] Initial connection failed, falling back:', err.message);
      this.isConnected = false;
      this.isConnecting = false;
      this.notifyStatus('disconnected');
    }
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

  onPatch(callback) {
    this.patchListeners.add(callback);
    return () => this.patchListeners.delete(callback);
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
        console.error('[LiveStockSocket] Error in status listener:', err);
      }
    });
  }
}

export const liveStockSocket = new LiveStockSocketService();
