import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for downloading server-streamed reports with progress tracking
 * and cancellation support.
 */
export const useStreamingExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [exportError, setExportError] = useState(null);
  
  const abortControllerRef = useRef(null);

  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
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
    setProgressPercent(5);
    setExportError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Simulated progress timer for smooth visual feedback on massive datasets
    let progressTimer = null;
    let estimatedProgress = 5;

    try {
      progressTimer = setInterval(() => {
        // Smooth asymptotic curve up to 90% while streaming
        if (estimatedProgress < 30) {
          estimatedProgress += 5;
        } else if (estimatedProgress < 65) {
          estimatedProgress += 3;
        } else if (estimatedProgress < 90) {
          estimatedProgress += 1;
        }
        setProgressPercent(estimatedProgress);
      }, 300);

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, */*'
        },
        signal: controller.signal
      });

      // Guard: 204 No Content returned by backend when 0 records exist
      if (response.status === 204) {
        clearInterval(progressTimer);
        setIsExporting(false);
        setProgressPercent(0);
        if (onNoData) onNoData();
        return { success: false, noData: true };
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(errorText || `Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser response.');
      }

      const reader = response.body.getReader();
      const chunks = [];
      const contentLengthHeader = response.headers.get('Content-Length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes > 0) {
          const actualPercent = Math.min(95, Math.round((receivedBytes / totalBytes) * 100));
          setProgressPercent(actualPercent);
        }
      }

      clearInterval(progressTimer);

      if (chunks.length === 0 || receivedBytes === 0) {
        setIsExporting(false);
        setProgressPercent(0);
        if (onNoData) onNoData();
        return { success: false, noData: true };
      }

      setProgressPercent(100);

      // Extract filename from Content-Disposition header if available
      let resolvedFileName = fileName;
      const disposition = response.headers.get('Content-Disposition');
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
        if (match && match[1]) {
          resolvedFileName = decodeURIComponent(match[1].trim());
        }
      }

      // Assemble final XLSX blob
      const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob(chunks, { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      // Trigger browser download via dynamic DOM anchor
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', resolvedFileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Cleanup DOM and object URL
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        setIsExporting(false);
        setProgressPercent(0);
      }, 600);

      if (onSuccess) onSuccess();
    } catch (err) {
      if (progressTimer) clearInterval(progressTimer);

      if (err.name === 'AbortError') {
        console.warn('Export operation cancelled by user.');
        setIsExporting(false);
        setProgressPercent(0);
      } else {
        console.error('Streaming export failed:', err);
        setExportError(err.message || 'Export failed.');
        setIsExporting(false);
        setProgressPercent(0);
        if (onError) onError(err);
      }
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
