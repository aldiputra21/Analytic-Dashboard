// BulkImport.tsx - CSV/Excel bulk import with progress and error reporting
// Requirements: 2.4, 2.5, 12.6

import React, { useState, useRef } from 'react';

const API_BASE = '/api/frs';

function getToken(): string {
  return localStorage.getItem('frs_token') ?? '';
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  processedRows: number;
}

interface BulkImportProps {
  onSuccess?: (result: ImportResult) => void;
}

export const BulkImport: React.FC<BulkImportProps> = ({ onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult(null);
    setUploadError(null);
    setProgress(0);
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setResult(null);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 85));
      }, 300);

      const res = await fetch(`${API_BASE}/financial-data/bulk`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await res.json();

      if (!res.ok && res.status !== 422) {
        throw new Error(data.error?.message ?? 'Upload failed');
      }

      setResult(data);
      onSuccess?.(data);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setResult(null);
    setUploadError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const acceptedTypes = '.csv,.xlsx,.xls';

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          selectedFile ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) {
            setSelectedFile(file);
            setResult(null);
            setUploadError(null);
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
          id="bulk-import-file"
        />

        {selectedFile ? (
          <div className="space-y-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
            <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Remove file
            </button>
          </div>
        ) : (
          <label htmlFor="bulk-import-file" className="cursor-pointer space-y-2 block">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Drop file here or click to browse</p>
            <p className="text-xs text-slate-400">Supports CSV, Excel (.xlsx, .xls)</p>
          </label>
        )}
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload button */}
      {selectedFile && !uploading && !result && (
        <button
          onClick={handleUpload}
          className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Import Data
        </button>
      )}

      {/* Error */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          {uploadError}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-slate-800">{result.processedRows}</p>
              <p className="text-xs text-slate-500">Total Rows</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-700">{result.successCount}</p>
              <p className="text-xs text-green-600">Imported</p>
            </div>
            <div className={`border rounded-xl p-3 text-center ${result.errorCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-lg font-bold ${result.errorCount > 0 ? 'text-red-700' : 'text-slate-400'}`}>
                {result.errorCount}
              </p>
              <p className={`text-xs ${result.errorCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>Errors</p>
            </div>
          </div>

          {/* Error report */}
          {result.errors.length > 0 && (
            <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
              <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                <p className="text-xs font-semibold text-red-700">Error Report</p>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 w-16">Row</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 w-32">Field</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.errors.map((err, i) => (
                      <tr key={i} className="hover:bg-red-50">
                        <td className="px-3 py-2 font-medium text-slate-700">{err.row}</td>
                        <td className="px-3 py-2 text-slate-600">{err.field}</td>
                        <td className="px-3 py-2 text-red-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Import Another File
          </button>
        </div>
      )}

      {/* Template hint */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
        <p className="font-semibold">Required CSV columns:</p>
        <p className="text-slate-500 font-mono text-xs leading-relaxed">
          subsidiary_id, period_type, period_start_date, period_end_date, revenue, net_profit,
          operating_cash_flow, cash, current_assets, total_assets, current_liabilities,
          total_liabilities, total_equity
        </p>
      </div>
    </div>
  );
};
