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
    setProgressPercent(100);
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

      // Trigger native browser download immediately via hidden iframe.
      // This immediately activates Chrome's native download manager in ~0.1s.
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = targetUrl;
      document.body.appendChild(iframe);

      // Clean up iframe after download has initiated
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        } catch {
          // ignore cleanup errors
        }
        setIsExporting(false);
        setProgressPercent(0);
      }, 2500);

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
