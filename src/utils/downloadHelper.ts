import { apiFetch } from '../services/financial/apiFetch';

/**
 * Downloads a file from an authenticated endpoint
 * @param url The download URL
 * @param defaultFilename Fallback filename if not provided by server
 */
export async function downloadAuthenticatedFile(url: string, defaultFilename: string = 'report.xlsx') {
  try {
    const response = await apiFetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Try to get filename from Content-Disposition header
    const disposition = response.headers.get('Content-Disposition');
    let filename = defaultFilename;
    
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) { 
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    // Create temporary link and trigger download
    const objectUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
    }, 100);
  } catch (error) {
    console.error('[DownloadHelper] Error downloading file:', error);
    throw error;
  }
}
