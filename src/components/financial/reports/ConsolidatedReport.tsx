// ConsolidatedReport.tsx - Consolidated financial report with drill-down
// Requirements: 7.6

import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { PeriodType } from '../../../types/financial/financialData';
import { ConsolidatedReport as ConsolidatedReportData } from '../../../services/financial/reportGenerator';

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function MetricCard({ label, value, unit = '' }: { label: string; value: number; unit?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-slate-900 mt-0.5">
        {formatCurrency(value)}{unit}
      </p>
    </div>
  );
}

function RatioRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-600">{label}</span>
      <span className="text-xs font-semibold text-slate-800">
        {value !== null ? value.toFixed(2) : 'N/A'}
      </span>
    </div>
  );
}

interface ConsolidatedReportProps {
  className?: string;
}

export const ConsolidatedReport: React.FC<ConsolidatedReportProps> = ({ className }) => {
  const [periodType, setPeriodType] = useState<PeriodType>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<ConsolidatedReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubsidiary, setExpandedSubsidiary] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('frs_token');
      const params = new URLSearchParams({ periodType, startDate, endDate });
      const res = await fetch(`/api/frs/reports/consolidated?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch consolidated report');
      const data: ConsolidatedReportData = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <FileText className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-slate-900">Consolidated Report</h3>
      </div>

      {/* Filters */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Period Type</label>
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={fetchReport}
          disabled={!startDate || !endDate || isLoading}
          className="text-xs px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        {!report && !isLoading && (
          <p className="text-sm text-slate-400 text-center py-8">
            Select a period and click Generate to view the consolidated report.
          </p>
        )}

        {isLoading && (
          <div className="py-8 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Generating consolidated report...</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-xs text-slate-400 text-center">Aggregating data from all subsidiaries</p>
          </div>
        )}

        {report && (
          <div className="space-y-5">
            {/* Summary metrics */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Group Totals — {report.subsidiaryCount} Subsidiaries
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <MetricCard label="Revenue" value={report.consolidated.revenue} />
                <MetricCard label="Net Profit" value={report.consolidated.netProfit} />
                <MetricCard label="Total Assets" value={report.consolidated.totalAssets} />
                <MetricCard label="Total Equity" value={report.consolidated.totalEquity} />
                <MetricCard label="Total Liabilities" value={report.consolidated.totalLiabilities} />
              </div>
            </div>

            {/* Consolidated ratios */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Consolidated Ratios
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <div>
                  <RatioRow label="ROA (%)" value={report.consolidatedRatios.roa} />
                  <RatioRow label="ROE (%)" value={report.consolidatedRatios.roe} />
                  <RatioRow label="NPM (%)" value={report.consolidatedRatios.npm} />
                  <RatioRow label="DER" value={report.consolidatedRatios.der} />
                  <RatioRow label="Health Score" value={report.consolidatedRatios.healthScore} />
                </div>
                <div>
                  <RatioRow label="Current Ratio" value={report.consolidatedRatios.currentRatio} />
                  <RatioRow label="Quick Ratio" value={report.consolidatedRatios.quickRatio} />
                  <RatioRow label="Cash Ratio" value={report.consolidatedRatios.cashRatio} />
                  <RatioRow label="OCF Ratio" value={report.consolidatedRatios.ocfRatio} />
                  <RatioRow label="DSCR" value={report.consolidatedRatios.dscr} />
                </div>
              </div>
            </div>

            {/* Subsidiary contributions with drill-down (Req 7.6) */}
            {report.contributions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Subsidiary Contributions
                </p>
                <div className="space-y-2">
                  {report.contributions.map((contrib) => (
                    <div key={contrib.subsidiaryId} className="border border-slate-100 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedSubsidiary(
                          expandedSubsidiary === contrib.subsidiaryId ? null : contrib.subsidiaryId
                        )}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedSubsidiary === contrib.subsidiaryId
                            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="text-xs font-semibold text-slate-800">{contrib.subsidiaryName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-slate-500">
                            Revenue: <span className="font-semibold text-slate-700">{contrib.revenueContribution.toFixed(1)}%</span>
                          </span>
                          <span className="text-slate-500">
                            Profit: <span className="font-semibold text-slate-700">{contrib.profitContribution.toFixed(1)}%</span>
                          </span>
                        </div>
                      </button>

                      {expandedSubsidiary === contrib.subsidiaryId && (
                        <div className="px-4 pb-3 bg-slate-50 border-t border-slate-100">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                            <div>
                              <p className="text-[10px] text-slate-500">Revenue</p>
                              <p className="text-sm font-bold text-slate-800">{formatCurrency(contrib.revenue)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500">Net Profit</p>
                              <p className={cn('text-sm font-bold', contrib.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                                {formatCurrency(contrib.netProfit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500">Total Assets</p>
                              <p className="text-sm font-bold text-slate-800">{formatCurrency(contrib.totalAssets)}</p>
                            </div>
                          </div>
                          {/* Contribution bars */}
                          <div className="mt-3 space-y-1.5">
                            <div>
                              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                <span>Revenue contribution</span>
                                <span>{contrib.revenueContribution.toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${Math.min(contrib.revenueContribution, 100)}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                                <span>Profit contribution</span>
                                <span>{contrib.profitContribution.toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    contrib.profitContribution >= 0 ? 'bg-emerald-500' : 'bg-red-400'
                                  )}
                                  style={{ width: `${Math.min(Math.abs(contrib.profitContribution), 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
