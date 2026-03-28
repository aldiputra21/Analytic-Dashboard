// BenchmarkingTable.tsx - Performance ranking table for all subsidiaries
// Requirements: 6.2, 6.3

import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { RatioName } from '../../../types/financial/ratio';
import { BenchmarkResult, IndustryBenchmarkEntry } from '../../../services/financial/benchmarkingService';

const RATIO_LABELS: Record<RatioName, string> = {
  roa: 'ROA (%)',
  roe: 'ROE (%)',
  npm: 'NPM (%)',
  der: 'DER',
  currentRatio: 'Current Ratio',
  quickRatio: 'Quick Ratio',
  cashRatio: 'Cash Ratio',
  ocfRatio: 'OCF Ratio',
  dscr: 'DSCR',
};

const RANK_BADGES: Record<number, { label: string; className: string }> = {
  1: { label: '1st', className: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
  2: { label: '2nd', className: 'bg-slate-100 text-slate-700 border border-slate-300' },
  3: { label: '3rd', className: 'bg-orange-100 text-orange-700 border border-orange-300' },
};

function RankBadge({ rank }: { rank: number }) {
  const badge = RANK_BADGES[rank];
  if (badge) {
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', badge.className)}>
        {rank === 1 && <Trophy className="w-2.5 h-2.5" />}
        {badge.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
      {rank}th
    </span>
  );
}

function GapIndicator({ gap }: { gap: number | null }) {
  if (gap === null) return <span className="text-slate-400 text-xs">—</span>;
  if (Math.abs(gap) < 0.01) return <span className="text-emerald-600 text-xs font-semibold">Best</span>;
  return (
    <span className={cn('text-xs font-semibold', gap > 0 ? 'text-red-500' : 'text-emerald-600')}>
      {gap > 0 ? '+' : ''}{gap.toFixed(1)}%
    </span>
  );
}

interface BenchmarkingTableProps {
  className?: string;
}

export const BenchmarkingTable: React.FC<BenchmarkingTableProps> = ({ className }) => {
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [industryData, setIndustryData] = useState<IndustryBenchmarkEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<RatioName>('roa');
  const [showIndustry, setShowIndustry] = useState(false);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('frs_token');
        const res = await fetch('/api/frs/ratios/benchmark', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch benchmarks');
        const data = await res.json();
        setBenchmarks(data.benchmarks ?? []);
        setIndustryData(data.industryComparisons ?? []);
      } catch (err: any) {
        setError(err.message ?? 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBenchmarks();
  }, []);

  const currentBenchmark = benchmarks.find((b) => b.ratioName === selectedRatio);
  const currentIndustry = industryData.filter((d) => d.ratioName === selectedRatio);

  if (isLoading) {
    return (
      <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm p-6', className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-32 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm p-6', className)}>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Performance Benchmarking</h3>
        </div>
        <button
          onClick={() => setShowIndustry((v) => !v)}
          className={cn(
            'text-xs px-3 py-1.5 rounded-lg border transition-colors',
            showIndustry
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          )}
        >
          {showIndustry ? 'Hide Industry' : 'vs Industry'}
        </button>
      </div>

      {/* Ratio selector */}
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-1.5">
        {(Object.keys(RATIO_LABELS) as RatioName[]).map((rn) => (
          <button
            key={rn}
            onClick={() => setSelectedRatio(rn)}
            className={cn(
              'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
              selectedRatio === rn
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            )}
          >
            {RATIO_LABELS[rn]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-semibold text-slate-600">Subsidiary</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Value</th>
              <th className="text-center px-4 py-3 font-semibold text-slate-600">Rank</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Gap from Best</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">vs Portfolio Avg</th>
              {showIndustry && (
                <th className="text-right px-4 py-3 font-semibold text-slate-600">vs Industry</th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentBenchmark?.subsidiaries.map((sub) => {
              const industryEntry = currentIndustry.find((d) => d.subsidiaryId === sub.subsidiaryId);
              const isLeader = sub.subsidiaryId === currentBenchmark.bestSubsidiaryId;

              return (
                <tr
                  key={sub.subsidiaryId}
                  className={cn(
                    'border-b border-slate-50 hover:bg-slate-50 transition-colors',
                    isLeader && 'bg-yellow-50/50'
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {isLeader && <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                      <span className="font-medium text-slate-800">{sub.subsidiaryName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {sub.value !== null ? sub.value.toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {sub.rank > 0 ? <RankBadge rank={sub.rank} /> : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <GapIndicator gap={sub.gapFromBest} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {sub.varianceFromAverage !== null ? (
                      <span className={cn(
                        'text-xs font-semibold',
                        sub.varianceFromAverage > 0 ? 'text-emerald-600' : 'text-red-500'
                      )}>
                        {sub.varianceFromAverage > 0 ? '+' : ''}{sub.varianceFromAverage.toFixed(2)}
                      </span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  {showIndustry && (
                    <td className="px-4 py-3 text-right">
                      {industryEntry?.variance !== null && industryEntry?.variance !== undefined ? (
                        <span className={cn(
                          'text-xs font-semibold',
                          industryEntry.variance > 0 ? 'text-emerald-600' : 'text-red-500'
                        )}>
                          {industryEntry.variance > 0 ? '+' : ''}{industryEntry.variance.toFixed(2)}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                  )}
                </tr>
              );
            })}
            {(!currentBenchmark || currentBenchmark.subsidiaries.length === 0) && (
              <tr>
                <td colSpan={showIndustry ? 6 : 5} className="px-5 py-8 text-center text-slate-400">
                  No benchmark data available
                </td>
              </tr>
            )}
          </tbody>
          {currentBenchmark?.portfolioAverage !== null && (
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="px-5 py-2.5 font-semibold text-slate-600 text-xs">Portfolio Average</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-700 text-xs">
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
