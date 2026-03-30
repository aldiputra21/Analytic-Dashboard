// DepartmentPerformance.tsx — Department Performance Achievement Card dengan filter
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, Award, Target, BarChart2 } from 'lucide-react';
import { formatRupiah, formatPercentage } from '../../../utils/format';
import type { DeptRevenueTargetItem } from '../../../services/mafinda/dashboardService';

interface Department { id: string; name: string; description?: string; }

interface Props {
  departments: DeptRevenueTargetItem[];
  allDepartments: Department[];
  period: string;
  isLoading: boolean;
}

function getAchievementColor(rate: number) {
  if (rate >= 100) return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' };
  if (rate >= 80)  return { bar: 'bg-blue-500',  text: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700' };
  if (rate >= 60)  return { bar: 'bg-yellow-500',text: 'text-yellow-700',bg: 'bg-yellow-50',border: 'border-yellow-200',badge: 'bg-yellow-100 text-yellow-700' };
  return           { bar: 'bg-red-500',   text: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200',   badge: 'bg-red-100 text-red-700' };
}

function getStatusLabel(rate: number) {
  if (rate >= 100) return 'Tercapai';
  if (rate >= 80)  return 'On Track';
  if (rate >= 60)  return 'Perlu Perhatian';
  return 'Di Bawah Target';
}

function getStatusIcon(rate: number) {
  if (rate >= 100) return <Award className="w-3.5 h-3.5" />;
  if (rate >= 80)  return <TrendingUp className="w-3.5 h-3.5" />;
  if (rate >= 60)  return <Minus className="w-3.5 h-3.5" />;
  return <TrendingDown className="w-3.5 h-3.5" />;
}

function SkeletonRow() {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex justify-between mb-2">
        <div className="h-4 bg-slate-100 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-16" />
      </div>
      <div className="h-2 bg-slate-100 rounded w-full mb-2" />
      <div className="flex justify-between">
        <div className="h-3 bg-slate-100 rounded w-1/4" />
        <div className="h-3 bg-slate-100 rounded w-1/4" />
      </div>
    </div>
  );
}

export const DepartmentPerformance: React.FC<Props> = ({
  departments, allDepartments, period, isLoading,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'achievement' | 'realization' | 'name'>('achievement');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const filtered = selectedDept === 'all'
    ? departments
    : departments.filter(d => d.departmentId === selectedDept);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'achievement') return b.achievementRate - a.achievementRate;
    if (sortBy === 'realization') return b.realization - a.realization;
    return a.departmentName.localeCompare(b.departmentName);
  });

  // Summary stats
  const totalTarget = departments.reduce((s, d) => s + d.target, 0);
  const totalRealization = departments.reduce((s, d) => s + d.realization, 0);
  const overallRate = totalTarget > 0 ? (totalRealization / totalTarget) * 100 : 0;
  const achieved = departments.filter(d => d.achievementRate >= 100).length;
  const onTrack = departments.filter(d => d.achievementRate >= 80 && d.achievementRate < 100).length;
  const below = departments.filter(d => d.achievementRate < 60).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              Department Performance Achievement
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Target vs Realisasi Revenue — Periode: {period}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Department filter */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 cursor-pointer"
              >
                <option value="all">Semua Departemen</option>
                {allDepartments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 cursor-pointer"
            >
              <option value="achievement">Sort: Achievement</option>
              <option value="realization">Sort: Realisasi</option>
              <option value="name">Sort: Nama</option>
            </select>

            {/* View toggle */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('card')}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                Cards
              </button>
              <button onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Overall summary bar */}
        {!isLoading && departments.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <div className="text-xs text-slate-500 mb-0.5">Overall Achievement</div>
              <div className={`text-xl font-bold ${getAchievementColor(overallRate).text}`}>
                {overallRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xs text-green-600 mb-0.5">Tercapai</div>
              <div className="text-xl font-bold text-green-700">{achieved}</div>
              <div className="text-xs text-green-500">dept</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xs text-blue-600 mb-0.5">On Track</div>
              <div className="text-xl font-bold text-blue-700">{onTrack}</div>
              <div className="text-xs text-blue-500">dept</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-xs text-red-600 mb-0.5">Di Bawah Target</div>
              <div className="text-xl font-bold text-red-700">{below}</div>
              <div className="text-xs text-red-500">dept</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400">
            Tidak ada data department performance untuk periode ini.
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((dept, idx) => {
              const c = getAchievementColor(dept.achievementRate);
              const barWidth = Math.min(dept.achievementRate, 100);
              return (
                <div key={dept.departmentId}
                  className={`rounded-xl border ${c.border} ${c.bg} p-4 hover:shadow-md transition-shadow`}>
                  {/* Rank + Name */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{dept.departmentName}</div>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.badge}`}>
                      {getStatusIcon(dept.achievementRate)}
                      {getStatusLabel(dept.achievementRate)}
                    </span>
                  </div>

                  {/* Achievement rate big number */}
                  <div className={`text-3xl font-black ${c.text} mb-2`}>
                    {dept.achievementRate.toFixed(1)}%
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/70 rounded-full h-2.5 mb-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.bar} transition-all duration-700`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  {/* Target vs Realization */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/60 rounded-lg p-2">
                      <div className="text-slate-500 mb-0.5 flex items-center gap-1">
                        <Target className="w-3 h-3" />Target
                      </div>
                      <div className="font-bold text-slate-800">{formatRupiah(dept.target, false)}</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2">
                      <div className="text-slate-500 mb-0.5 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />Realisasi
                      </div>
                      <div className={`font-bold ${c.text}`}>{formatRupiah(dept.realization, false)}</div>
                    </div>
                  </div>

                  {/* Gap */}
                  {dept.target > 0 && (
                    <div className="mt-2 text-xs text-slate-500 text-right">
                      Gap: <span className={`font-semibold ${dept.realization >= dept.target ? 'text-green-600' : 'text-red-600'}`}>
                        {dept.realization >= dept.target ? '+' : ''}{formatRupiah(dept.realization - dept.target, false)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Table view */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['#', 'Departemen', 'Target', 'Realisasi', 'Achievement', 'Gap', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((dept, idx) => {
                  const c = getAchievementColor(dept.achievementRate);
                  const gap = dept.realization - dept.target;
                  return (
                    <tr key={dept.departmentId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{dept.departmentName}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{formatRupiah(dept.target, false)}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-800">{formatRupiah(dept.realization, false)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${c.bar}`} style={{ width: `${Math.min(dept.achievementRate, 100)}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${c.text}`}>{dept.achievementRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`font-semibold ${gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {gap >= 0 ? '+' : ''}{formatRupiah(gap, false)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-semibold ${c.badge}`}>
                          {getStatusIcon(dept.achievementRate)}
                          {getStatusLabel(dept.achievementRate)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-700">TOTAL</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{formatRupiah(totalTarget, false)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{formatRupiah(totalRealization, false)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${getAchievementColor(overallRate).text}`}>
                      {overallRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold">
                    <span className={totalRealization >= totalTarget ? 'text-green-600' : 'text-red-600'}>
                      {totalRealization >= totalTarget ? '+' : ''}{formatRupiah(totalRealization - totalTarget, false)}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
