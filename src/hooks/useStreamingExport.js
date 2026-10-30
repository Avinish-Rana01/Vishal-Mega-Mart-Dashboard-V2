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

      // Trigger native browser download via persistent hidden iframe.
      // Reusing a persistent iframe ensures Chrome never abruptly kills the connection mid-stream.
      let iframe = document.getElementById('vmm-download-frame');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'vmm-download-frame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }
      iframe.src = targetUrl;

      setTimeout(() => {
        setIsExporting(false);
        setProgressPercent(0);
      }, 1500);

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
