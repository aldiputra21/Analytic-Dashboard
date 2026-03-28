// DataVersionHistory.tsx - View version history for a financial data entry
// Requirements: 11.6

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/financial/useAuth';

interface FinancialDataVersion {
  id: string;
  financialDataId: string;
  version: number;
  subsidiaryId: string;
  periodType: string;
  periodStartDate: string;
  periodEndDate: string;
  revenue: number;
  netProfit: number;
  operatingCashFlow: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  changedAt: string;
  changedBy: string;
  changeReason?: string;
}

interface DataVersionHistoryProps {
  financialDataId: string;
  onClose: () => void;
}

function fmt(n: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
}

export const DataVersionHistory: React.FC<DataVersionHistoryProps> = ({ financialDataId, onClose }) => {
  const { token } = useAuth();
  const [versions, setVersions] = useState<FinancialDataVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<FinancialDataVersion | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/frs/financial-data/${financialDataId}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error?.message ?? 'Failed to load history');
        }
        const data = await res.json();
        setVersions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [financialDataId, token]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Version History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Financial data entry: {financialDataId.slice(-8)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Version list */}
          <div className="w-56 border-r border-slate-200 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <p className="text-xs text-red-600 p-4">{error}</p>
            ) : versions.length === 0 ? (
              <p className="text-xs text-slate-400 p-4">No version history available</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {versions.map((v) => (
                  <li key={v.id}>
                    <button
                      onClick={() => setSelectedVersion(v)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                        selectedVersion?.id === v.id ? 'bg-indigo-50 border-l-2 border-indigo-600' : ''
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-800">Version {v.version}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(v.changedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{v.changedBy}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Version detail */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedVersion ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">
                Select a version to view details
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    Version {selectedVersion.version}
                  </span>
                  <span className="text-xs text-slate-500">
                    Changed by <strong>{selectedVersion.changedBy}</strong> on{' '}
                    {new Date(selectedVersion.changedAt).toLocaleString()}
                  </span>
                </div>

                {selectedVersion.changeReason && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                    <strong>Restatement reason:</strong> {selectedVersion.changeReason}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Period Type', value: selectedVersion.periodType },
                    { label: 'Period Start', value: selectedVersion.periodStartDate },
                    { label: 'Period End', value: selectedVersion.periodEndDate },
                    { label: 'Revenue', value: fmt(selectedVersion.revenue) },
                    { label: 'Net Profit', value: fmt(selectedVersion.netProfit) },
                    { label: 'Operating Cash Flow', value: fmt(selectedVersion.operatingCashFlow) },
                    { label: 'Total Assets', value: fmt(selectedVersion.totalAssets) },
                    { label: 'Total Liabilities', value: fmt(selectedVersion.totalLiabilities) },
                    { label: 'Total Equity', value: fmt(selectedVersion.totalEquity) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
