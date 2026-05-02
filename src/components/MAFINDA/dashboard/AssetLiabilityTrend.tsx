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
import { useAuth } from '../../../hooks/financial/useAuth';
import { mafindaI18n } from '../../../i18n/mafinda';

interface AssetLiabilityTrendProps {
  data: HistoricalDataPoint[];
  isLoading: boolean;
}

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

export const AssetLiabilityTrend: React.FC<AssetLiabilityTrendProps> = ({
  data,
  isLoading,
}) => {
  const { language } = useAuth();
  const t = mafindaI18n[language].dashboard;
  const mt = mafindaI18n[language].trends;

  const yearlyData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Group monthly data by year. For Balance Sheet, take the last month's value.
    const byYear = new Map<number, { period: string; totalAssets: number; totalLiabilities: number }>();
    
    data.forEach(d => {
      const year = parseInt(d.period.split('-')[0], 10);
      const existing = byYear.get(year);
      
      // Update if this month is later in the year
      if (!existing || d.period > existing.period) {
        byYear.set(year, {
          period: d.period,
          totalAssets: d.totalAssets,
          totalLiabilities: d.totalLiabilities
        });
      }
    });

    return Array.from(byYear.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, values]) => ({
        year,
        totalAssets: values.totalAssets,
        totalLiabilities: values.totalLiabilities
      }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full min-h-[350px]">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-6 animate-pulse" />
        <div className="h-64 bg-slate-50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full min-h-[350px] flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800">{mt.assetLiability}</h3>
        <p className="text-[10px] text-slate-400 font-medium">{mt.yearlyTrend}</p>
      </div>

      <div className="flex-1 min-h-[260px]">
        {yearlyData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-slate-400">{t.noData}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={yearlyData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
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
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} verticalAlign="bottom" />
              <Line
                type="monotone"
                dataKey="totalAssets"
                name={t.totalAssets}
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="totalLiabilities"
                name={t.totalLiabilities}
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
