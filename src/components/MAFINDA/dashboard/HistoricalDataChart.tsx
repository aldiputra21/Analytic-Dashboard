// HistoricalDataChart.tsx — Multi-line trend chart for historical financial data
// Requirements: 6.1, 6.2, 6.3, 6.4

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatRupiah } from '../../../utils/format';
import type { HistoricalDataPoint } from '../../../services/mafinda/dashboardService';

type RangeMonths = 3 | 6 | 12 | 24;

interface HistoricalDataChartProps {
  data: HistoricalDataPoint[];
  selectedMonths: RangeMonths;
  onMonthsChange: (months: RangeMonths) => void;
  isLoading: boolean;
}

const RANGE_OPTIONS: { label: string; value: RangeMonths }[] = [
  { label: '3 Bulan', value: 3 },
  { label: '6 Bulan', value: 6 },
  { label: '1 Tahun', value: 12 },
  { label: '2 Tahun', value: 24 },
];

const LINES: { key: keyof HistoricalDataPoint; label: string; color: string }[] = [
  { key: 'revenue', label: 'Revenue', color: '#3b82f6' },
  { key: 'netProfit', label: 'Net Profit', color: '#10b981' },
  { key: 'totalAssets', label: 'Total Aset', color: '#8b5cf6' },
  { key: 'totalLiabilities', label: 'Total Liabilitas', color: '#f97316' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[180px]">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <span className="font-medium">{formatRupiah(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

export const HistoricalDataChart: React.FC<HistoricalDataChartProps> = ({
  data,
  selectedMonths,
  onMonthsChange,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-6 animate-pulse" />
        <div className="h-64 bg-slate-50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      {/* Header + range selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Tren Data Keuangan Historis</h3>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onMonthsChange(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedMonths === opt.value
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-sm text-slate-400">Tidak ada data historis untuk rentang waktu yang dipilih.</p>
          <p className="text-xs text-slate-300 mt-1">Coba pilih rentang waktu yang lebih panjang atau input data keuangan terlebih dahulu.</p>
        </div>
      ) : (
        <>
          {data.length < 3 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
              Data terbatas — hanya {data.length} periode tersedia. Menampilkan data yang ada.
            </p>
          )}
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatRupiah(v)}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {LINES.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.label}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: line.color }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
};
