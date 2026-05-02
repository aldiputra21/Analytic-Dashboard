import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { formatRupiah } from '../../../utils/format';
import { useAuth } from '../../../hooks/financial/useAuth';
import { dashboardI18n } from '../../../i18n/dashboard';

interface WaterfallItem {
  label: string;
  value: number;
  type: string;
  isCumulative?: boolean;
}

interface WaterfallChartProps {
  data: WaterfallItem[];
  isLoading: boolean;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ data, isLoading }) => {
  const { language } = useAuth();
  const t = dashboardI18n[language];

  const chartData = React.useMemo(() => {
    const labelMap: Record<string, string> = {
      start: t.bridgeOpening,
      inflow: t.bridgeCashIn,
      outflow: t.bridgeCashOut,
      end: t.bridgeEnding,
      net: t.bridgeCashIn,
    };
    let currentBalance = 0;
    return data.map((item) => {
      const start = currentBalance;
      const end = item.isCumulative ? item.value : currentBalance + item.value;
      const isPositive = item.value >= 0;
      
      const entry = {
        name: labelMap[item.type] ?? item.label,
        value: item.value,
        displayValue: Math.abs(item.value),
        // For non-cumulative: lower = min(start, end), delta = abs(value)
        // For cumulative: lower = 0, delta = value
        lower: item.isCumulative ? 0 : Math.min(start, end),
        delta: Math.abs(item.value),
        color: item.isCumulative ? '#6366f1' : (isPositive ? '#10b981' : '#ef4444'),
      };
      
      currentBalance = end;
      return entry;
    });
  }, [data, t]);


  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="h-5 bg-slate-100 rounded w-1/3 mb-6 animate-pulse" />
        <div className="h-64 bg-slate-50 rounded animate-pulse" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full flex flex-col">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">{t.cashFlowBridge}</h3>
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
          {t.noData}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-6">{t.cashFlowBridge}</h3>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(v) => formatRupiah(v, false)}
              tick={{ fontSize: 10, fill: '#64748b' }}
              width={80}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
                      <p className="font-bold text-slate-700 mb-1">{data.name}</p>
                      <p className={data.value >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                        {formatRupiah(data.value, false)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="lower" stackId="a" fill="transparent" />
            <Bar dataKey="delta" stackId="a">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList 
                dataKey="value" 
                position="top" 
                formatter={(v: number) => formatRupiah(v, false)}
                style={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
