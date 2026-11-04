import { useState, useCallback, useRef } from 'react';
import { getActiveUserId } from '../services/stockService';

/**
 * Custom hook for downloading server-streamed reports via native browser download
 * with immediate download popup invocation.
 */
export const useStreamingExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [exportError, setExportError] = useState(null);
  
  const abortControllerRef = useRef(null);

  const cancelExport = useCallback(() => {
    clearInterval(abortControllerRef.current);
    setIsExporting(false);
    setProgressPercent(0);
  }, []);

  const startExport = useCallback(async ({
    downloadUrl,
    fileName = 'Report.xlsx',
    totalRecords = 0,
    onSuccess,
    onError,
    onNoData
  }) => {
    setIsExporting(true);
    setProgressPercent(10);
    setExportError(null);

    try {
      const uid = getActiveUserId();
      let targetUrl = downloadUrl;
      if (uid && typeof targetUrl === 'string') {
        const lower = targetUrl.toLowerCase();
        if (!lower.includes('userid=') && !lower.includes('user_id=')) {
          const sep = targetUrl.includes('?') ? '&' : '?';
          targetUrl = `${targetUrl}${sep}userId=${encodeURIComponent(uid)}`;
        }
      }

      // Trigger native browser download via persistent hidden iframe.
      // Reusing a persistent iframe ensures Chrome never abruptly kills the connection mid-stream.
      let iframe = document.getElementById('vmm-download-frame');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'vmm-download-frame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }
      // Unique token: backend echoes it back as a cookie with the first response packet
      const token = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const tokenSep = targetUrl.includes('?') ? '&' : '?';
      iframe.src = `${targetUrl}${tokenSep}downloadToken=${token}`;

      // Ease the bar towards 90% while the server prepares data; only hit 100% on first packet
      const startedAt = Date.now();
      const MAX_WAIT_MS = 180000; // safety fallback (e.g. frontend & API on different hosts)
      clearInterval(abortControllerRef.current);
      const timer = setInterval(() => {
        const firstPacketArrived = document.cookie
          .split('; ')
          .some((c) => c === `vmm_download_token=${token}`);

        if (firstPacketArrived || Date.now() - startedAt > MAX_WAIT_MS) {
          clearInterval(timer);
          setProgressPercent(100);
          setTimeout(() => {
            setIsExporting(false);
            setProgressPercent(0);
          }, 300);
          return;
        }

        setProgressPercent((prev) => (prev >= 90 ? prev : prev + Math.max(1, Math.round((90 - prev) * 0.1))));
      }, 200);
      abortControllerRef.current = timer;


      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Export trigger failed:', err);
      setExportError(err.message || 'Export failed.');
      setIsExporting(false);
      setProgressPercent(0);
      if (onError) onError(err);
    }
  }, []);

  return {
    isExporting,
    progressPercent,
    exportError,
    startExport,
    cancelExport
  };
};

export default useStreamingExport;
