// ComparisonChart.tsx - Comparative bar charts across subsidiaries
// Requirements: 4.7, 4.8

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { RatioName } from '../../../types/financial/ratio';
import { RATIO_META } from './RatioCard';

export interface ComparisonDataPoint {
  subsidiaryId: string;
  subsidiaryName: string;
  color: string;
  [ratioKey: string]: number | null | string;
}

interface ComparisonChartProps {
  data: ComparisonDataPoint[];
  selectedRatio: RatioName;
  onRatioChange: (ratio: RatioName) => void;
  isRefreshing?: boolean;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
        <span className="text-slate-500">{entry.name}:</span>
        <span className="font-semibold text-slate-800">
          {entry.value !== null && entry.value !== undefined ? entry.value.toFixed(2) : '—'}
        </span>
      </div>
    </div>
  );
};

export const ComparisonChart: React.FC<ComparisonChartProps> = React.memo(({
  data,
  selectedRatio,
  onRatioChange,
  isRefreshing = false,
  className,
}) => {
  const meta = React.useMemo(() => RATIO_META.find((m) => m.key === selectedRatio), [selectedRatio]);

  // Build chart data: one bar per subsidiary
  const chartData = React.useMemo(() => data.map((d) => ({
    name: d.subsidiaryName,
    value: d[selectedRatio] as number | null,
    color: d.color,
  })), [data, selectedRatio]);

  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Subsidiary Comparison</h3>
          {isRefreshing && (
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
          )}
        </div>
      </div>

      {/* Ratio selector tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {RATIO_META.map((m) => (
          <button
            key={m.key}
            onClick={() => onRatioChange(m.key)}
            className={cn(
              'px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors',
              selectedRatio === m.key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
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
            <Bar
              dataKey="value"
              name={meta?.label ?? selectedRatio}
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Unit label */}
      {meta && (
        <p className="text-[10px] text-slate-400 text-center mt-1">
          {meta.description} ({meta.unit})
        </p>
      )}
    </div>
  );
});
