// TrendAnalysis.tsx - Historical trend charts with YoY comparison
// Requirements: 8.2, 8.5

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { RatioName } from '../../../types/financial/ratio';
import { useTrends, TrendPeriodFilter } from '../../../hooks/financial/useTrends';
import { useSubsidiaries } from '../../../hooks/financial/useSubsidiaries';

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

const PERIOD_OPTIONS: { value: TrendPeriodFilter; label: string }[] = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '3y', label: '3Y' },
  { value: '5y', label: '5Y' },
];

const SUBSIDIARY_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-semibold text-slate-800">
            {entry.value !== null && entry.value !== undefined ? entry.value.toFixed(2) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
};

interface TrendAnalysisProps {
  className?: string;
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ className }) => {
  const [selectedRatio, setSelectedRatio] = useState<RatioName>('roa');
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriodFilter>('1y');
  const [showMovingAvg, setShowMovingAvg] = useState(false);

  const { subsidiaries } = useSubsidiaries();
  const { trends, isLoading, error } = useTrends({
    ratioName: selectedRatio,
    period: selectedPeriod,
  });

  // Build chart data: merge all subsidiaries by date
  const ratioTrends = trends.filter((t) => t.ratioName === selectedRatio && t.periods);

  // Collect all unique dates
  const allDates = Array.from(
    new Set(ratioTrends.flatMap((t) => t.periods?.map((p) => p.periodStartDate) ?? []))
  ).sort();

  const chartData = allDates.map((date) => {
    const point: Record<string, any> = { date, label: date.slice(0, 7) };
    for (const trend of ratioTrends) {
      const period = trend.periods?.find((p) => p.periodStartDate === date);
      point[`${trend.subsidiaryId}_value`] = period?.value ?? null;
      if (showMovingAvg) {
        point[`${trend.subsidiaryId}_ma3m`] = period?.movingAverage3m ?? null;
      }
    }
    return point;
  });

  // Count significant changes
  const significantChanges = ratioTrends.flatMap(
    (t) => t.periods?.filter((p) => p.isSignificantChange) ?? []
  ).length;

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Trend Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          {significantChanges > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              {significantChanges} significant change{significantChanges !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => setShowMovingAvg((v) => !v)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-lg border transition-colors',
              showMovingAvg
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            3M MA
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap gap-3 items-center">
        {/* Ratio selector */}
        <div className="flex flex-wrap gap-1">
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

        {/* Period selector */}
        <div className="flex gap-1 ml-auto">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => setSelectedPeriod(p.value)}
              className={cn(
                'text-[11px] px-2.5 py-1 rounded-lg border transition-colors',
                selectedPeriod === p.value
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        {isLoading && (
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        )}
        {error && (
          <p className="text-sm text-red-500 text-center py-8">{error}</p>
        )}
        {!isLoading && !error && chartData.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No trend data available for this period.</p>
        )}
        {!isLoading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconType="circle" iconSize={8} />
              {ratioTrends.map((trend, idx) => {
                const sub = subsidiaries.find((s) => s.id === trend.subsidiaryId);
                const color = SUBSIDIARY_COLORS[idx % SUBSIDIARY_COLORS.length];
                const lines = [
                  <Line
                    key={`${trend.subsidiaryId}_value`}
                    type="monotone"
                    dataKey={`${trend.subsidiaryId}_value`}
                    name={sub?.name ?? trend.subsidiaryId}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls={false}
                  />,
                ];
                if (showMovingAvg) {
                  lines.push(
                    <Line
                      key={`${trend.subsidiaryId}_ma3m`}
                      type="monotone"
                      dataKey={`${trend.subsidiaryId}_ma3m`}
                      name={`${sub?.name ?? trend.subsidiaryId} (3M MA)`}
                      stroke={color}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={false}
                      connectNulls={false}
                    />
                  );
                }
                return lines;
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
