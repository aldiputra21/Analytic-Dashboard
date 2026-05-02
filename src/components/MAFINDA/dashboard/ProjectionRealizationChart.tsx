import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatRupiah } from '../../../utils/format';
import { useAuth } from '../../../hooks/financial/useAuth';
import { dashboardI18n } from '../../../i18n/dashboard';
import { mafindaI18n } from '../../../i18n/mafinda';

interface ProjectionRealizationItem {
  period: string;
  projectedIn: number;
  actualIn: number;
  projectedOut: number;
  actualOut: number;
}

interface ProjectionRealizationChartProps {
  data: ProjectionRealizationItem[];
  isLoading: boolean;
}

const monthNames: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};

export const ProjectionRealizationChart: React.FC<ProjectionRealizationChartProps> = ({ data, isLoading }) => {
  const { language } = useAuth();
  const t = dashboardI18n[language];
  const m = mafindaI18n[language].dashboard.cashFlow;

  const chartData = React.useMemo(() => {
    return data.map(d => ({
      ...d,
      label: `${monthNames[d.period.split('-')[1]]} ${d.period.split('-')[0].substring(2)}`
    }));
  }, [data]);

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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-slate-800">{t.projectionVsRealization}</h3>
      </div>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="label" 
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
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
                      <p className="font-bold text-slate-700 mb-2">{label}</p>
                      {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-slate-500">{entry.name}:</span>
                          <span className="font-medium" style={{ color: entry.color }}>
                            {formatRupiah(entry.value, false)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: 10, paddingBottom: 20 }}
            />
            <Bar dataKey="projectedIn" name={t.projCashIn} fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="actualIn" name={t.actCashIn} fill="#34d399" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="projectedOut" name={t.projCashOut} fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="actualOut" name={t.actCashOut} fill="#f87171" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
