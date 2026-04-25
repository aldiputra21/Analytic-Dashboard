// FinancialSummaryCards.tsx — Cards untuk Total Assets, Current Assets, Equity, Liabilities
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatRupiah } from '../../../utils/format';
import type { AssetComposition, EquityLiabilityComposition } from '../../../services/mafinda/dashboardService';
import { useAuth } from '../../../hooks/financial/useAuth';
import { mafindaI18n } from '../../../i18n/mafinda';

interface Props {
  assetData: AssetComposition | null;
  equityData: EquityLiabilityComposition | null;
  isLoading: boolean;
}

interface CardProps {
  label: string;
  value: number;
  subLabel?: string;
  subValue?: number;
  color: string;
  bgColor: string;
  borderColor: string;
  pct?: number;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ label, value, subLabel, subValue, color, bgColor, borderColor, pct, trend }: CardProps) {
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${color} uppercase tracking-wide`}>{label}</span>
        {pct !== undefined && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            pct >= 50 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>{pct.toFixed(1)}%</span>
        )}
        {trend && (
          <span className={`${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </span>
        )}
      </div>
      <div className={`text-lg font-bold ${color}`}>{formatRupiah(value, false)}</div>
      {subLabel && subValue !== undefined && (
        <div className="text-xs text-slate-500 flex justify-between border-t border-white/50 pt-1.5 mt-0.5">
          <span>{subLabel}</span>
          <span className="font-semibold text-slate-700">{formatRupiah(subValue, false)}</span>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-2/3 mb-3" />
      <div className="h-6 bg-slate-200 rounded w-full mb-2" />
      <div className="h-3 bg-slate-200 rounded w-1/2" />
    </div>
  );
}

export const FinancialSummaryCards: React.FC<Props> = ({ assetData, equityData, isLoading }) => {
  const { language } = useAuth();
  const t = mafindaI18n[language].dashboard;
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const totalAssets = assetData?.totalAssets ?? 0;
  const currentAssets = assetData?.currentAssets ?? 0;
  const totalEquity = equityData?.totalEquity ?? 0;
  const currentEquity = equityData?.paidInCapital ?? 0; // Modal disetor = current equity
  const totalLiabilities = equityData?.totalLiabilities ?? 0;
  const currentLiabilities = equityData?.shortTermLiabilities ?? 0;

  const cards: CardProps[] = [
    {
      label: t.totalAssets,
      value: totalAssets,
      subLabel: t.fields.fixedAssets,
      subValue: assetData?.fixedAssets ?? 0,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      trend: 'up',
    },
    {
      label: t.assetLabels.current,
      value: currentAssets,
      subLabel: t.fields.otherAssets,
      subValue: assetData?.otherAssets ?? 0,
      color: 'text-sky-700',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      pct: totalAssets > 0 ? (currentAssets / totalAssets) * 100 : 0,
    },
    {
      label: t.totalEquity,
      value: totalEquity,
      subLabel: t.fields.retainedEarnings,
      subValue: equityData?.retainedEarnings ?? 0,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      pct: totalAssets > 0 ? (totalEquity / totalAssets) * 100 : 0,
    },
    {
      label: t.equityLabels.current, // Current Equity / Paid in Capital
      value: currentEquity,
      subLabel: t.fields.otherEquity,
      subValue: equityData?.otherEquity ?? 0,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      pct: totalEquity > 0 ? (currentEquity / totalEquity) * 100 : 0,
    },
    {
      label: t.totalLiabilities,
      value: totalLiabilities,
      subLabel: t.fields.longTerm,
      subValue: equityData?.longTermLiabilities ?? 0,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      pct: totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0,
      trend: totalLiabilities > totalEquity ? 'down' : 'neutral',
    },
    {
      label: t.fields.currentLiabilities,
      value: currentLiabilities,
      subLabel: t.fields.vsCurrentAssets,
      subValue: currentAssets,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      pct: currentAssets > 0 ? (currentLiabilities / currentAssets) * 100 : 0,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{t.fields.balanceSheetSummary}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Balance Sheet — {t.fields.period}: {assetData?.period ?? equityData?.period ?? '—'}
          </p>
        </div>
        {/* Solvency indicator */}
        {totalAssets > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            totalEquity > totalLiabilities
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {totalEquity > totalLiabilities ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {totalEquity > totalLiabilities ? t.fields.solvent : t.fields.highLeverage}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c, i) => (
          <div key={i}>
            <StatCard label={c.label} value={c.value} subLabel={c.subLabel} subValue={c.subValue} color={c.color} bgColor={c.bgColor} borderColor={c.borderColor} pct={c.pct} trend={c.trend} />
          </div>
        ))}
      </div>
      {/* Balance check bar */}
      {totalAssets > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>{t.liabilityLabels.equity} {((totalEquity / totalAssets) * 100).toFixed(1)}%</span>
            <span className="font-semibold text-slate-700">{t.totalAssets} = {formatRupiah(totalAssets, false)}</span>
            <span>{t.operationalCost} {((totalLiabilities / totalAssets) * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-orange-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${(totalEquity / totalAssets) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-emerald-600 font-medium">{t.liabilityLabels.equity}: {formatRupiah(totalEquity, false)}</span>
            <span className="text-orange-600 font-medium">{t.operationalCost}: {formatRupiah(totalLiabilities, false)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
