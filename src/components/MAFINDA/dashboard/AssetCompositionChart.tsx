// AssetCompositionChart.tsx — Donut chart for asset composition
// Requirements: 4.1, 4.2, 4.4

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
import type { AssetComposition } from '../../../services/mafinda/dashboardService';

interface AssetCompositionChartProps {
  data: AssetComposition | null;
  isLoading: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];
const LABELS = ['Aset Lancar', 'Aset Tetap', 'Aset Lainnya'];

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

export const AssetCompositionChart: React.FC<AssetCompositionChartProps> = ({ data, isLoading }) => {
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
        <p className="text-sm text-slate-400">Tidak ada data komposisi aset.</p>
      </div>
    );
  }

  const chartData = [
    { name: LABELS[0], value: data.currentAssets, pct: (data.currentAssets / data.totalAssets) * 100 },
    { name: LABELS[1], value: data.fixedAssets, pct: (data.fixedAssets / data.totalAssets) * 100 },
    { name: LABELS[2], value: data.otherAssets, pct: (data.otherAssets / data.totalAssets) * 100 },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Komposisi Aset</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Total Aset: <span className="font-medium text-slate-700">{formatRupiah(data.totalAssets, false)}</span>
          {' · '}Periode: {data.period}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
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
      <div className="mt-3 space-y-2">
        {chartData.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-slate-700 font-medium">{item.name}</span>
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
