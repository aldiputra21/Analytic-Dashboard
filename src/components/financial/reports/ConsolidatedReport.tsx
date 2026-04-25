// ConsolidatedReport.tsx - Consolidated financial report with drill-down
// Requirements: 7.6

import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronRight, TrendingUp, TrendingDown, AlertCircle, RefreshCw, Layers, Calendar, ChevronDown as ChevronDownIcon, Search, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { PeriodType } from '../../../types/financial/financialData';
import { ConsolidatedReport as ConsolidatedReportData } from '../../../services/financial/reportGenerator';
import { apiFetch } from '../../../services/financial/apiFetch';
import { useAuth } from '../../../hooks/financial/useAuth';
import { commonsI18n } from '../../../i18n/commons';
import { formatRupiah } from '../../../utils/format';

import { reportsI18n } from '../../../i18n/reports';

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function MetricCard({ label, value, unit = '', color = 'slate' }: { label: string; value: number; unit?: string; color?: 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' }) {
  const variants = {
    slate: 'bg-slate-50 border-slate-100 text-slate-900',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-2xl p-4 border shadow-sm transition-all hover:shadow-md", variants[color])}
    >
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
      <p className="text-xl font-black">
        {formatCurrency(value)}{unit}
      </p>
    </motion.div>
  );
}

function RatioRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors group">
      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors">{label}</span>
      <span className="text-sm font-black text-slate-800">
        {value !== null ? value.toFixed(2) : 'N/A'}
      </span>
    </div>
  );
}

interface ConsolidatedReportProps {
  className?: string;
}

export const ConsolidatedReport: React.FC<ConsolidatedReportProps> = ({ className }) => {
  const { language } = useAuth();
  const common = commonsI18n[language];
  const t = reportsI18n[language].consolidated;

  const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
    { value: 'monthly', label: t.periods.monthly },
    { value: 'quarterly', label: t.periods.quarterly },
    { value: 'annual', label: t.periods.annual },
  ];

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
      const params = new URLSearchParams({ periodType, startDate, endDate });
      const res = await apiFetch(`/api/frs/reports/consolidated?${params}`);
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to fetch consolidated report');
      }
      
      const data: ConsolidatedReportData = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message ?? common.errorLoadTable);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tighter">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-6 py-5 border-b border-slate-50 flex flex-wrap gap-5 bg-white items-end">
        <div className="space-y-1.5 flex-1 min-w-[140px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Calendar size={12} /> {t.periodType}
          </label>
          <div className="relative">
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as PeriodType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-10 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm"
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[180px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.startDate}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        <div className="space-y-1.5 flex-1 min-w-[180px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.endDate}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        <button
          onClick={fetchReport}
          disabled={!startDate || !endDate || isLoading}
          className="px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 cursor-pointer h-[38px]"
        >
          {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
          {isLoading ? t.generating : t.generate}
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-20 flex flex-col items-center justify-center text-center"
            >
              <div className="p-4 bg-red-50 rounded-full text-red-400 border border-red-100 mb-4">
                <AlertCircle size={48} />
              </div>
              <h4 className="text-slate-800 font-black text-lg">{t.failed}</h4>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">{error}</p>
              <button
                onClick={fetchReport}
                className="mt-8 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={14} />
                {common.retry}
              </button>
            </motion.div>
          ) : isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center text-center"
            >
              <div className="relative w-24 h-24 mb-6">
                <motion.div 
                  className="absolute inset-0 border-4 border-indigo-100 rounded-full"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div 
                  className="absolute inset-2 border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                  <FileText size={32} />
                </div>
              </div>
              <h4 className="text-slate-800 font-black text-lg">{t.generating}</h4>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto font-bold">{t.subtitle}</p>
            </motion.div>
          ) : !report ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 flex flex-col items-center justify-center text-center"
            >
              <div className="p-5 bg-slate-50 rounded-3xl text-slate-300 border border-slate-100 mb-4">
                <FileText size={64} />
              </div>
              <h4 className="text-slate-800 font-black text-lg">{t.empty}</h4>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto font-bold">{t.emptyDesc}</p>
            </motion.div>
          ) : (
            <motion.div 
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-10"
            >
              {/* Summary metrics */}
              <section>
                <div className="flex items-center gap-2 mb-4 ml-1">
                  <Info size={14} className="text-indigo-400" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t.groupTotals} — {report.subsidiaryCount} {t.subsidiariesCount}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <MetricCard label={t.revenue} value={report.consolidated.revenue} color="indigo" />
                  <MetricCard label={t.netProfit} value={report.consolidated.netProfit} color={report.consolidated.netProfit >= 0 ? 'emerald' : 'rose'} />
                  <MetricCard label={t.totalAssets} value={report.consolidated.totalAssets} color="slate" />
                  <MetricCard label={t.totalEquity} value={report.consolidated.totalEquity} color="slate" />
                  <MetricCard label={t.totalLiabilities} value={report.consolidated.totalLiabilities} color="rose" />
                </div>
              </section>

              {/* Consolidated ratios */}
              <section className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={16} className="text-indigo-600" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                    {t.ratios}
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
                  <div className="space-y-1">
                    <RatioRow label={t.ratioLabels.roa} value={report.consolidatedRatios.roa} />
                    <RatioRow label={t.ratioLabels.roe} value={report.consolidatedRatios.roe} />
                    <RatioRow label={t.ratioLabels.npm} value={report.consolidatedRatios.npm} />
                    <RatioRow label={t.ratioLabels.der} value={report.consolidatedRatios.der} />
                    <RatioRow label={t.ratioLabels.healthScore} value={report.consolidatedRatios.healthScore} />
                  </div>
                  <div className="space-y-1">
                    <RatioRow label={t.ratioLabels.currentRatio} value={report.consolidatedRatios.currentRatio} />
                    <RatioRow label={t.ratioLabels.quickRatio} value={report.consolidatedRatios.quickRatio} />
                    <RatioRow label={t.ratioLabels.cashRatio} value={report.consolidatedRatios.cashRatio} />
                    <RatioRow label={t.ratioLabels.ocfRatio} value={report.consolidatedRatios.ocfRatio} />
                    <RatioRow label={t.ratioLabels.dscr} value={report.consolidatedRatios.dscr} />
                  </div>
                </div>
              </section>

              {/* Subsidiary contributions */}
              {report.contributions.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-5 ml-1">
                    <Layers size={14} className="text-indigo-400" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t.contributions}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {report.contributions.map((contrib, idx) => (
                      <motion.div 
                        key={contrib.subsidiaryId} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-slate-200"
                      >
                        <button
                          onClick={() => setExpandedSubsidiary(
                            expandedSubsidiary === contrib.subsidiaryId ? null : contrib.subsidiaryId
                          )}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                              {expandedSubsidiary === contrib.subsidiaryId
                                ? <ChevronDown className="w-4 h-4" />
                                : <ChevronRight className="w-4 h-4" />}
                            </div>
                            <span className="text-sm font-black text-slate-800">{contrib.subsidiaryName}</span>
                          </div>
                          <div className="hidden sm:flex items-center gap-6">
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t.revenueContrib}</span>
                              <span className="text-xs font-black text-indigo-600">{contrib.revenueContribution.toFixed(1)}%</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t.profitContrib}</span>
                              <span className={cn("text-xs font-black", contrib.profitContribution >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                {contrib.profitContribution.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </button>

                        <AnimatePresence>
                          {expandedSubsidiary === contrib.subsidiaryId && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 pt-2 bg-slate-50/30 border-t border-slate-50">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-4">
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.revenue}</p>
                                    <p className="text-sm font-black text-slate-800">{formatRupiah(contrib.revenue, false)}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.netProfit}</p>
                                    <p className={cn('text-sm font-black', contrib.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600')}>
                                      {formatRupiah(contrib.netProfit, false)}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.totalAssets}</p>
                                    <p className="text-sm font-black text-slate-800">{formatRupiah(contrib.totalAssets, false)}</p>
                                  </div>
                                </div>
                                
                                {/* Contribution bars */}
                                <div className="mt-8 space-y-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                      <span>{t.revenueContrib}</span>
                                      <span>{contrib.revenueContribution.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(contrib.revenueContribution, 100)}%` }}
                                        className="h-full bg-indigo-500 rounded-full shadow-sm"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                      <span>{t.profitContrib}</span>
                                      <span>{contrib.profitContribution.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(Math.abs(contrib.profitContribution), 100)}%` }}
                                        className={cn(
                                          'h-full rounded-full shadow-sm',
                                          contrib.profitContribution >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                        )}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
