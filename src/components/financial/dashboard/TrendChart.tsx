// TrendChart.tsx - Line chart for revenue, profit, and ratio trends
// Requirements: 4.5, 4.6

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { PeriodRange } from './PeriodSelector';

export interface TrendDataPoint {
  date: Date;
  label: string;
  [key: string]: number | Date | string | null;
}

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  unit?: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  series: TrendSeries[];
  title: string;
  period: PeriodRange;
  yoyData?: { key: string; label: string; value: number | null }[];
  className?: string;
  formatValue?: (value: number, key: string) => string;
}

/**
 * Calculates year-over-year growth percentage.
 * YoY% = ((Current - Previous) / |Previous|) × 100
 * Requirements: 4.6
 */
export function calculateYoY(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

const CustomTooltip = ({ active, payload, label, formatValue }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="font-semibold text-slate-800">
            {entry.value !== null && entry.value !== undefined
              ? formatValue
                ? formatValue(entry.value, entry.dataKey)
                : entry.value.toFixed(2)
              : '—'}
          </span>
        </div>
      ))}
    </div>
  );
};

export const TrendChart: React.FC<TrendChartProps> = React.memo(({
  data,
  series,
  title,
  period,
  yoyData,
  className,
  formatValue,
}) => {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm p-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Period: {period.toUpperCase()}</p>
        </div>

        {/* YoY badges */}
        {yoyData && yoyData.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {yoyData.map((yoy) => {
              const isPositive = yoy.value !== null && yoy.value > 0;
              const isNegative = yoy.value !== null && yoy.value < 0;
              return (
                <div
                  key={yoy.key}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold',
                    isPositive ? 'bg-emerald-50 text-emerald-700' :
                    isNegative ? 'bg-red-50 text-red-700' :
                    'bg-slate-50 text-slate-500'
                  )}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> :
                   isNegative ? <TrendingDown className="w-3 h-3" /> :
                   <Minus className="w-3 h-3" />}
                  <span>{yoy.label}:</span>
                  <span>
                    {yoy.value !== null
                      ? `${yoy.value > 0 ? '+' : ''}${yoy.value.toFixed(1)}% YoY`
                      : 'N/A'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart */}
      {data.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-slate-400">
          No data available for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            <Tooltip
              content={<CustomTooltip formatValue={formatValue} />}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="circle"
              iconSize={8}
            />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});
