// EquityLiabilityChart.tsx — Donut chart for equity & liability composition
// Requirements: 5.1, 5.2, 5.4

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { formatRupiah, formatPercentage } from '../../../utils/format';
import type { EquityLiabilityComposition } from '../../../services/mafinda/dashboardService';

interface EquityLiabilityChartProps {
  data: EquityLiabilityComposition | null;
  isLoading: boolean;
}

// Equity components: shades of green/teal; Liability: shades of orange/red
const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#f97316', '#fb923c'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy + 4} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill="#00000015" />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 8} outerRadius={outerRadius + 12}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{item.name}</p>
      <p className="text-slate-600">{formatRupiah(item.value, false)}</p>
      <p className="text-slate-500">{formatPercentage(item.pct)}</p>
    </div>
  );
};

export const EquityLiabilityChart: React.FC<EquityLiabilityChartProps> = ({ data, isLoading }) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-6" />
        <div className="h-56 bg-slate-50 rounded" />
      </div>
    );
  }

  if (!data || data.totalAssets === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
        <p className="text-sm text-slate-400">Tidak ada data komposisi ekuitas & liabilitas.</p>
      </div>
    );
  }

  const total = data.totalAssets;

  const chartData = [
    { name: 'Modal Disetor', value: data.paidInCapital, group: 'Ekuitas' },
    { name: 'Laba Ditahan', value: data.retainedEarnings, group: 'Ekuitas' },
    { name: 'Ekuitas Lainnya', value: data.otherEquity, group: 'Ekuitas' },
    { name: 'Liabilitas Jangka Pendek', value: data.shortTermLiabilities, group: 'Liabilitas' },
    { name: 'Liabilitas Jangka Panjang', value: data.longTermLiabilities, group: 'Liabilitas' },
  ]
    .filter((d) => d.value > 0)
    .map((d) => ({ ...d, pct: (d.value / total) * 100 }));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Komposisi Ekuitas & Liabilitas</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Total Pasiva: <span className="font-medium text-slate-700">{formatRupiah(total, false)}</span>
          {' · '}Periode: {data.period}
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 text-xs">
          <p className="text-emerald-600 font-medium">Total Ekuitas</p>
          <p className="font-bold text-emerald-800">{formatRupiah(data.totalEquity, false)}</p>
          <p className="text-emerald-500">{formatPercentage((data.totalEquity / total) * 100)}</p>
        </div>
        <div className="flex-1 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-xs">
          <p className="text-orange-600 font-medium">Total Liabilitas</p>
          <p className="font-bold text-orange-800">{formatRupiah(data.totalLiabilities, false)}</p>
          <p className="text-orange-500">{formatPercentage((data.totalLiabilities / total) * 100)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="value"
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(undefined)}
            animationDuration={800}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 space-y-1.5">
        {chartData.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors"
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-slate-600">{item.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                item.group === 'Ekuitas' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
              }`}>{item.group}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-800">{formatRupiah(item.value, false)}</span>
              <span className="text-slate-400 ml-2">{formatPercentage(item.pct)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
