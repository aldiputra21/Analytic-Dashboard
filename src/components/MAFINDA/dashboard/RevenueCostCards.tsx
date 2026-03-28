// RevenueCostCards.tsx — Revenue & Operational Cost summary cards with department filter
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.6

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatRupiah, formatPercentage } from '../../../utils/format';
import type { RevenueCostSummary } from '../../../services/mafinda/dashboardService';
import type { Department } from '../../../hooks/mafinda/useManagement';

interface RevenueCostCardsProps {
  summary: RevenueCostSummary | null;
  departments: Department[];
  selectedDepartmentId: string;
  onDepartmentChange: (id: string) => void;
  isLoading: boolean;
}

interface MetricCardProps {
  label: string;
  value: number;
  change: number;
  isLoading: boolean;
  colorClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, isLoading, colorClass }) => {
  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? 'text-green-600' : 'text-red-500';

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse">
        <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
        <div className="h-7 bg-slate-100 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{formatRupiah(value, false)}</p>
      <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
        <TrendIcon className="w-3.5 h-3.5" />
        <span>{isPositive ? '+' : ''}{formatPercentage(change)} vs periode sebelumnya</span>
      </div>
    </div>
  );
};

export const RevenueCostCards: React.FC<RevenueCostCardsProps> = ({
  summary,
  departments,
  selectedDepartmentId,
  onDepartmentChange,
  isLoading,
}) => {
  const noData = !isLoading && summary && summary.revenue === 0 && summary.operationalCost === 0;

  return (
    <div className="space-y-3">
      {/* Department filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Revenue & Biaya Operasional</h3>
        <select
          value={selectedDepartmentId}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Semua Departemen</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {noData && (
        <p className="text-xs text-slate-400 text-center py-2">
          Tidak ada data untuk{' '}
          {selectedDepartmentId
            ? departments.find((d) => d.id === selectedDepartmentId)?.name ?? 'departemen ini'
            : 'periode ini'}.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          label="Total Revenue"
          value={summary?.revenue ?? 0}
          change={summary?.revenueChange ?? 0}
          isLoading={isLoading}
          colorClass="text-blue-700"
        />
        <MetricCard
          label="Biaya Operasional"
          value={summary?.operationalCost ?? 0}
          change={summary?.operationalCostChange ?? 0}
          isLoading={isLoading}
          colorClass="text-orange-600"
        />
      </div>
    </div>
  );
};
