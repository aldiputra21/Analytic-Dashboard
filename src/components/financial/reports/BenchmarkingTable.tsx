// BenchmarkingTable.tsx - Performance ranking table for all subsidiaries
// Requirements: 6.2, 6.3

import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { RatioName } from '../../../types/financial/ratio';
import { BenchmarkResult, IndustryBenchmarkEntry } from '../../../services/financial/benchmarkingService';
import { apiFetch } from '../../../services/financial/apiFetch';
import { useAuth } from '../../../hooks/financial/useAuth';
import { commonsI18n } from '../../../i18n/commons';

import { reportsI18n } from '../../../i18n/reports';

// Ratio labels are now handled inside the component via reportsI18n

function RankBadge({ rank, t }: { rank: number; t: any }) {
  const badgeClass = rank === 1 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm shadow-yellow-100' :
                     rank === 2 ? 'bg-slate-100 text-slate-700 border border-slate-300 shadow-sm shadow-slate-100' :
                     rank === 3 ? 'bg-orange-100 text-orange-700 border border-orange-300 shadow-sm shadow-orange-100' :
                     'bg-slate-50 text-slate-500 border border-slate-200';
  
  const label = t.ranks[rank] || `${t.ranks.suffix || ''}${rank}${(!t.ranks.suffix && rank > 3) ? 'th' : ''}`;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight', badgeClass)}>
      {rank === 1 && <Trophy className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}

function GapIndicator({ gap, t }: { gap: number | null; t: any }) {
  if (gap === null) return <span className="text-slate-400 text-xs">—</span>;
  if (Math.abs(gap) < 0.01) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-tight">
      {t.best}
    </span>
  );
  return (
    <span className={cn('text-[11px] font-black', gap > 0 ? 'text-rose-500' : 'text-emerald-600')}>
      {gap > 0 ? '+' : ''}{gap.toFixed(1)}%
    </span>
  );
}

interface BenchmarkingTableProps {
  className?: string;
}

export const BenchmarkingTable: React.FC<BenchmarkingTableProps> = ({ className }) => {
  const { language } = useAuth();
  const common = commonsI18n[language];
  const t = reportsI18n[language].benchmarking;
  const ratioLabels = t.ratioLabels;
  
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [industryData, setIndustryData] = useState<IndustryBenchmarkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<RatioName>('roa');
  const [showIndustry, setShowIndustry] = useState(false);

  const fetchBenchmarks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/frs/ratios/benchmark');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to fetch benchmarks');
      }
      const data = await res.json();
      setBenchmarks(data.benchmarks ?? []);
      setIndustryData(data.industryComparisons ?? []);
    } catch (err: any) {
      setError(err.message ?? common.errorLoadTable);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  const currentBenchmark = benchmarks.find((b) => b.ratioName === selectedRatio);
  const currentIndustry = industryData.filter((d) => d.ratioName === selectedRatio);

  return (
    <div className={cn('bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t.title}</h3>
        </div>
        <button
          onClick={() => setShowIndustry((v) => !v)}
          className={cn(
            'text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-sm',
            showIndustry
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          )}
        >
          {showIndustry ? t.hideIndustry : t.vsIndustry}
        </button>
      </div>

      {/* Ratio selector */}
      <div className="px-6 py-3 border-b border-slate-50 flex flex-wrap gap-2 bg-white">
        {(Object.keys(ratioLabels) as RatioName[]).map((rn) => (
          <button
            key={rn}
            onClick={() => setSelectedRatio(rn)}
            className={cn(
              'text-[10px] font-black uppercase tracking-tight px-3 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer',
              selectedRatio === rn
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:border-slate-300'
            )}
          >
            {ratioLabels[rn]}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto min-h-[300px] relative">
        <table className="w-full text-xs font-bold border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <th className="text-left px-6 py-4">{t.subsidiary}</th>
              <th className="text-right px-4 py-4">{t.value}</th>
              <th className="text-center px-4 py-4">{t.rank}</th>
              <th className="text-right px-4 py-4">{t.gapBest}</th>
              <th className="text-right px-4 py-4">{t.vsPortfolioAvg}</th>
              {showIndustry && (
                <th className="text-right px-6 py-4">{t.vsIndustryAvg}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <motion.tr
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="animate-pulse"
                  >
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-16 ml-auto" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-12 mx-auto" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-16 ml-auto" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-slate-100 rounded w-16 ml-auto" /></td>
                    {showIndustry && <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16 ml-auto" /></td>}
                  </motion.tr>
                ))
              ) : error ? (
                <motion.tr key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan={showIndustry ? 6 : 5} className="py-20">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="p-4 bg-red-50 rounded-full text-red-400 border border-red-100">
                        <AlertCircle size={40} />
                      </div>
                      <div>
                        <p className="text-slate-800 font-black text-lg">{common.errorLoadTable}</p>
                        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">{error}</p>
                        <button
                          onClick={() => fetchBenchmarks()}
                          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
                        >
                          <RefreshCw size={14} />
                          {common.retry}
                        </button>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ) : (!currentBenchmark || currentBenchmark.subsidiaries.length === 0) ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan={showIndustry ? 6 : 5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <BarChart3 size={40} />
                      </div>
                      <p className="text-slate-800 font-black text-lg">{t.empty}</p>
                      <p className="text-slate-500 text-sm">{t.emptyDesc}</p>
                    </div>
                  </td>
                </motion.tr>
              ) : (
                currentBenchmark.subsidiaries.map((sub, idx) => {
                  const industryEntry = currentIndustry.find((d) => d.subsidiaryId === sub.subsidiaryId);
                  const isLeader = sub.subsidiaryId === currentBenchmark.bestSubsidiaryId;

                  return (
                    <motion.tr
                      key={sub.subsidiaryId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        'hover:bg-slate-50/50 transition-colors',
                        isLeader && 'bg-yellow-50/30'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isLeader && <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                          <span className="font-bold text-slate-700">{sub.subsidiaryName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right font-black text-slate-800">
                        {sub.value !== null ? sub.value.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {sub.rank > 0 ? <RankBadge rank={sub.rank} t={t} /> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <GapIndicator gap={sub.gapFromBest} t={t} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        {sub.varianceFromAverage !== null ? (
                          <span className={cn(
                            'text-[11px] font-black',
                            sub.varianceFromAverage > 0 ? 'text-emerald-600' : 'text-rose-500'
                          )}>
                            {sub.varianceFromAverage > 0 ? '+' : ''}{sub.varianceFromAverage.toFixed(2)}
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      {showIndustry && (
                        <td className="px-6 py-4 text-right">
                          {industryEntry?.variance !== null && industryEntry?.variance !== undefined ? (
                            <span className={cn(
                              'text-[11px] font-black',
                              industryEntry.variance > 0 ? 'text-emerald-600' : 'text-rose-500'
                            )}>
                              {industryEntry.variance > 0 ? '+' : ''}{industryEntry.variance.toFixed(2)}
                            </span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                      )}
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
          {currentBenchmark?.portfolioAverage !== null && !isLoading && !error && currentBenchmark?.subsidiaries.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50/80 border-t border-slate-200">
                <td className="px-6 py-4 font-black text-slate-600 text-[10px] uppercase tracking-widest">{t.portfolioAvg}</td>
                <td className="px-4 py-4 text-right font-black text-slate-800">
                  {currentBenchmark?.portfolioAverage?.toFixed(2) ?? '—'}
                </td>
                <td colSpan={showIndustry ? 4 : 3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
