// CompositionPie3D.tsx — Pie Chart 3D effect untuk Asset dan Equity composition
import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector,
} from 'recharts';
import { formatRupiah, formatPercentage } from '../../../utils/format';
import type { AssetComposition, EquityLiabilityComposition } from '../../../services/mafinda/dashboardService';

interface Props {
  assetData: AssetComposition | null;
  equityData: EquityLiabilityComposition | null;
  isLoading: boolean;
}

const ASSET_COLORS = ['#3b82f6', '#0ea5e9', '#6366f1'];
const EQUITY_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#f97316', '#fb923c'];

// 3D effect: render shadow slice + main slice + outer ring
const render3DShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, midAngle } = props;
  const DEPTH = 10; // 3D depth in px

  // Shadow (bottom layer, offset down)
  const shadowCy = cy + DEPTH;

  return (
    <g>
      {/* 3D depth shadow */}
      <Sector
        cx={cx} cy={shadowCy}
        innerRadius={innerRadius} outerRadius={outerRadius}
        startAngle={startAngle} endAngle={endAngle}
        fill={fill} opacity={0.25}
      />
      {/* Side face for 3D illusion */}
      <Sector
        cx={cx} cy={cy + DEPTH / 2}
        innerRadius={outerRadius - 2} outerRadius={outerRadius + 2}
        startAngle={startAngle} endAngle={endAngle}
        fill={fill} opacity={0.5}
      />
      {/* Main top face */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius} outerRadius={outerRadius}
        startAngle={startAngle} endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const render3DActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const DEPTH = 10;
  return (
    <g>
      <Sector cx={cx} cy={cy + DEPTH} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.2} />
      <Sector cx={cx} cy={cy + DEPTH / 2} innerRadius={outerRadius + 4} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.5} />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs min-w-[160px]">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-3 h-3 rounded-sm" style={{ background: payload[0].fill }} />
        <span className="font-semibold text-slate-800">{item.name}</span>
      </div>
      <div className="text-slate-700 font-bold">{formatRupiah(item.value, false)}</div>
      <div className="text-slate-400 mt-0.5">{item.pct?.toFixed(1)}% dari total</div>
    </div>
  );
};

interface PieSection {
  title: string;
  subtitle: string;
  total: number;
  data: { name: string; value: number; pct: number }[];
  colors: string[];
}

function Pie3DChart({ section }: { section: PieSection }) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{section.subtitle}</p>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={section.data}
              cx="50%"
              cy="45%"
              outerRadius={88}
              innerRadius={0}
              dataKey="value"
              activeIndex={activeIndex}
              activeShape={render3DActiveShape}
              shape={render3DShape}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(undefined)}
              animationDuration={900}
              animationBegin={100}
              paddingAngle={2}
            >
              {section.data.map((_, i) => (
                <Cell key={i} fill={section.colors[i % section.colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-12px' }}>
          <div className="text-center">
            <div className="text-xs text-slate-400 font-medium">Total</div>
            <div className="text-sm font-bold text-slate-800 leading-tight">
              {formatRupiah(section.total, false)}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 space-y-2">
        {section.data.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(undefined)}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: section.colors[i % section.colors.length] }} />
              <span className="text-slate-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="font-semibold text-slate-800">{formatRupiah(item.value, false)}</span>
              <span className="text-slate-400 w-10 text-right">{item.pct.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const CompositionPie3D: React.FC<Props> = ({ assetData, equityData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
            <div className="h-52 bg-slate-50 rounded mb-4" />
            <div className="space-y-2">
              {[0, 1, 2].map(j => <div key={j} className="h-3 bg-slate-100 rounded" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const assetSection: PieSection = {
    title: 'Komposisi Aset (3D)',
    subtitle: `Total Aset: ${formatRupiah(assetData?.totalAssets ?? 0, false)} · ${assetData?.period ?? '—'}`,
    total: assetData?.totalAssets ?? 0,
    colors: ASSET_COLORS,
    data: assetData ? [
      { name: 'Aset Lancar', value: assetData.currentAssets, pct: assetData.totalAssets > 0 ? (assetData.currentAssets / assetData.totalAssets) * 100 : 0 },
      { name: 'Aset Tetap', value: assetData.fixedAssets, pct: assetData.totalAssets > 0 ? (assetData.fixedAssets / assetData.totalAssets) * 100 : 0 },
      { name: 'Aset Lainnya', value: assetData.otherAssets, pct: assetData.totalAssets > 0 ? (assetData.otherAssets / assetData.totalAssets) * 100 : 0 },
    ].filter(d => d.value > 0) : [],
  };

  const equityTotal = equityData?.totalEquity ?? 0;
  const liabTotal = equityData?.totalLiabilities ?? 0;
  const grandTotal = equityTotal + liabTotal;

  const equitySection: PieSection = {
    title: 'Komposisi Ekuitas & Liabilitas (3D)',
    subtitle: `Total Pasiva: ${formatRupiah(grandTotal, false)} · ${equityData?.period ?? '—'}`,
    total: grandTotal,
    colors: EQUITY_COLORS,
    data: equityData ? [
      { name: 'Modal Disetor', value: equityData.paidInCapital, pct: grandTotal > 0 ? (equityData.paidInCapital / grandTotal) * 100 : 0 },
      { name: 'Laba Ditahan', value: equityData.retainedEarnings, pct: grandTotal > 0 ? (equityData.retainedEarnings / grandTotal) * 100 : 0 },
      { name: 'Ekuitas Lainnya', value: equityData.otherEquity, pct: grandTotal > 0 ? (equityData.otherEquity / grandTotal) * 100 : 0 },
      { name: 'Liabilitas Jangka Pendek', value: equityData.shortTermLiabilities, pct: grandTotal > 0 ? (equityData.shortTermLiabilities / grandTotal) * 100 : 0 },
      { name: 'Liabilitas Jangka Panjang', value: equityData.longTermLiabilities, pct: grandTotal > 0 ? (equityData.longTermLiabilities / grandTotal) * 100 : 0 },
    ].filter(d => d.value > 0) : [],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Pie3DChart section={assetSection} />
      <Pie3DChart section={equitySection} />
    </div>
  );
};
