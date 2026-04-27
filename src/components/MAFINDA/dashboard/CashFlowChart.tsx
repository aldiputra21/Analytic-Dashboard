// CashFlowChart.tsx — Area chart for Cash In / Cash Out with department & project filters
// Requirements: 3.1, 3.2, 3.3, 3.4

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatRupiah } from '../../../utils/format';
import type { CashFlowDataPoint } from '../../../services/mafinda/dashboardService';
import { SearchableSelect } from '../../financial/shared/SearchableSelect';
import { useAuth } from '../../../hooks/financial/useAuth';
import { mafindaI18n } from '../../../i18n/mafinda';

interface CashFlowChartProps {
  data: CashFlowDataPoint[];
  departments: { value: string; label: string; sublabel?: string }[];
  projects: { value: string; label: string; sublabel?: string; departmentId: string }[];
  selectedDepartmentId: string;
  selectedProjectId: string;
  onDepartmentChange: (id: string) => void;
  onProjectChange: (id: string) => void;
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label, t }: any) => {
  if (!active || !payload?.length) return null;
  const cashIn = payload.find((p: any) => p.dataKey === 'cashIn')?.value ?? 0;
  const cashOut = payload.find((p: any) => p.dataKey === 'cashOut')?.value ?? 0;
  const net = cashIn - cashOut;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      <p className="text-emerald-600">{t.cashIn}: <span className="font-medium">{formatRupiah(cashIn)}</span></p>
      <p className="text-red-500">{t.cashOut}: <span className="font-medium">{formatRupiah(cashOut)}</span></p>
      <p className={`mt-1 font-semibold ${net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
        {t.net}: {formatRupiah(net)}
      </p>
    </div>
  );
};

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  data,
  departments,
  projects,
  selectedDepartmentId,
  selectedProjectId,
  onDepartmentChange,
  onProjectChange,
  isLoading,
}) => {
  const { language } = useAuth();
  const t = mafindaI18n[language].dashboard.cashFlow;
  const common = mafindaI18n[language].dashboard;
  const filteredProjects = projects.filter(
    (p) => p.departmentId === selectedDepartmentId
  );

  const safeData = Array.isArray(data) ? data : [];
  const totalNetCashFlow = safeData.reduce((sum, d) => sum + (d.netCashFlow || 0), 0);

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
      {/* Header + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{t.title}</h3>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <SearchableSelect
              options={departments}
              value={selectedDepartmentId}
              onChange={(val) => {
                onDepartmentChange(val);
                onProjectChange('');
              }}
              placeholder={common.allDepartments}
            />
          </div>
          {selectedDepartmentId && (
            <div className="w-40">
              <SearchableSelect
                options={filteredProjects}
                value={selectedProjectId}
                onChange={onProjectChange}
                placeholder={common.allProjects}
              />
            </div>
          )}
        </div>
      </div>

      {safeData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
          {t.empty}
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={safeData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="cashInGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="cashOutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => formatRupiah(v)}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip t={t} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => v === 'cashIn' ? t.cashIn : t.cashOut} />
              <Area
                type="monotone"
                dataKey="cashIn"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#cashInGrad)"
                dot={{ r: 3, fill: '#10b981' }}
              />
              <Area
                type="monotone"
                dataKey="cashOut"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#cashOutGrad)"
                dot={{ r: 3, fill: '#ef4444' }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Net cash flow summary */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{t.totalNet}</span>
            <span className={`text-sm font-bold ${totalNetCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalNetCashFlow >= 0 ? '+' : ''}{formatRupiah(totalNetCashFlow)}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
