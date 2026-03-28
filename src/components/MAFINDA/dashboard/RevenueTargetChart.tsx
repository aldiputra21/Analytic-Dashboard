// RevenueTargetChart.tsx — Grouped bar chart: target vs realisasi revenue per departemen
// Requirements: 1.1, 1.3, 1.4, 1.5

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatRupiah, formatPercentage } from '../../../utils/format';
import type { DeptRevenueTargetItem } from '../../../services/mafinda/dashboardService';

interface RevenueTargetChartProps {
  data: DeptRevenueTargetItem[];
  period: string;
  isLoading: boolean;
}

function achievementColor(rate: number): string {
  if (rate >= 100) return '#22c55e'; // green
  if (rate >= 80) return '#f97316';  // orange
  return '#ef4444';                  // red
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const target = payload.find((p: any) => p.dataKey === 'target')?.value ?? 0;
  const realization = payload.find((p: any) => p.dataKey === 'realization')?.value ?? 0;
  const rate = target > 0 ? (realization / target) * 100 : 0;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-800 mb-2">{label}</p>
      <p className="text-slate-600">Target: <span className="font-medium text-slate-800">{formatRupiah(target)}</span></p>
      <p className="text-slate-600">Realisasi: <span className="font-medium text-slate-800">{formatRupiah(realization)}</span></p>
      <p className="mt-1 font-semibold" style={{ color: achievementColor(rate) }}>
        Achievement: {formatPercentage(rate)}
      </p>
    </div>
  );
};

// Custom label rendered above the realization bar showing achievement %
const AchievementLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value == null) return null;
  const color = achievementColor(value);
  return (
    <text
      x={x + width / 2}
      y={y - 4}
      fill={color}
      textAnchor="middle"
      fontSize={10}
      fontWeight={600}
    >
      {formatPercentage(value)}
    </text>
  );
};

export const RevenueTargetChart: React.FC<RevenueTargetChartProps> = ({ data, period, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-6 animate-pulse" />
        <div className="h-64 bg-slate-50 rounded animate-pulse" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
        <p className="text-sm text-slate-500">Tidak ada data target & realisasi untuk periode {period}.</p>
      </div>
    );
  }

  // Attach achievementRate to each bar for the label
  const chartData = data.map((d) => ({
    ...d,
    achievementRate: d.achievementRate,
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Target vs Realisasi Revenue per Departemen</h3>
          <p className="text-xs text-slate-500 mt-0.5">Periode: {period}</p>
        </div>
        {/* Legend for achievement colors */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> ≥100%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> 80–99%</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> &lt;80%</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 16, left: 8, bottom: 4 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="departmentName"
            tick={{ fontSize: 11, fill: '#64748b' }}
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
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => value === 'target' ? 'Target' : 'Realisasi'}
          />
          {/* Target bar — neutral blue */}
          <Bar dataKey="target" name="target" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={40} />
          {/* Realization bar — colored by achievement */}
          <Bar dataKey="realization" name="realization" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={achievementColor(entry.achievementRate)} />
            ))}
            <LabelList dataKey="achievementRate" content={<AchievementLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
