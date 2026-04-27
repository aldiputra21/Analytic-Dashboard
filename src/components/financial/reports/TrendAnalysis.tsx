// TrendAnalysis.tsx - Historical trend charts with YoY comparison
// Requirements: 8.2, 8.5

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, AlertTriangle, Info, RefreshCw, Layers, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { RatioName } from '../../../types/financial/ratio';
import { useTrends, TrendPeriodFilter } from '../../../hooks/financial/useTrends';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { useAuth } from '../../../hooks/financial/useAuth';
import { commonsI18n } from '../../../i18n/commons';

import { reportsI18n } from '../../../i18n/reports';

// Ratio labels are now handled inside the component via reportsI18n

// PERIOD_OPTIONS removed, using t.periods

const SUBSIDIARY_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-4 min-w-[180px]">
      <p className="font-black text-slate-800 text-[10px] uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">{label}</p>
      <div className="space-y-2">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-[11px] font-bold text-slate-500">{entry.name}:</span>
            </div>
            <span className="text-xs font-black text-slate-800">
              {entry.value !== null && entry.value !== undefined ? entry.value.toFixed(2) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface TrendAnalysisProps {
  className?: string;
}

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ className }) => {
  const { language } = useAuth();
  const common = commonsI18n[language];
  const t = reportsI18n[language].trends;
  const ratioLabels = t.ratioLabels;
  
  const [selectedRatio, setSelectedRatio] = useState<RatioName>('roa');
  const [selectedPeriod, setSelectedPeriod] = useState<TrendPeriodFilter>('1y');
  const [showMovingAvg, setShowMovingAvg] = useState(false);

  const { corporates: subsidiaries } = useCorporates();
  const { trends, isLoading, error, refetch } = useTrends({
    ratioName: selectedRatio,
    period: selectedPeriod,
  });

  // Build chart data: merge all subsidiaries by date
  const ratioTrends = trends.filter((t) => t.ratioName === selectedRatio && t.periods);

  // Collect all unique dates
  const allDates = Array.from(
    new Set(ratioTrends.flatMap((t) => t.periods?.map((p) => p.periodStartDate) ?? []))
  ).sort();

  const chartData = allDates.map((date) => {
    const point: Record<string, any> = { date, label: date.slice(0, 7) };
    for (const trend of ratioTrends) {
      const period = trend.periods?.find((p) => p.periodStartDate === date);
      point[`${trend.subsidiaryId}_value`] = period?.value ?? null;
      if (showMovingAvg) {
        point[`${trend.subsidiaryId}_ma3m`] = period?.movingAverage3m ?? null;
      }
    }
    return point;
  });

  // Count significant changes
  const significantChanges = ratioTrends.flatMap(
    (t) => t.periods?.filter((p) => p.isSignificantChange) ?? []
  ).length;

  return (
    <div className={cn('bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tighter">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {significantChanges > 0 && !isLoading && !error && (
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {significantChanges} {t.significantChanges}
            </motion.span>
          )}
          <button
            onClick={() => setShowMovingAvg((v) => !v)}
            className={cn(
              'text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-sm',
              showMovingAvg
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            {t.movingAvg}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-3 border-b border-slate-50 flex flex-wrap gap-4 items-center bg-white">
        {/* Ratio selector */}
        <div className="flex flex-wrap gap-2 flex-1">
          {(Object.keys(ratioLabels) as RatioName[]).map((rn) => (
            <button
              key={rn}
              onClick={() => setSelectedRatio(rn)}
              className={cn(
                'text-[10px] font-black uppercase tracking-tight px-3 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer',
                selectedRatio === rn
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:border-slate-300'
              )}
            >
              {ratioLabels[rn]}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
          {(['3m', '6m', '1y', '3y', '5y'] as TrendPeriodFilter[]).map((pv) => (
            <button
              key={pv}
              onClick={() => setSelectedPeriod(pv)}
              className={cn(
                'text-[10px] font-black px-4 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer',
                selectedPeriod === pv
                  ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {t.periods[pv]}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6 relative min-h-[350px]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-[1px] z-10"
            >
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.loading}</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 flex flex-col items-center justify-center text-center"
            >
              <div className="p-4 bg-red-50 rounded-full text-red-400 border border-red-100 mb-4">
                <AlertCircle size={40} />
              </div>
              <h4 className="text-slate-800 font-black text-lg">{common.errorLoadTable}</h4>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">{error}</p>
              <button
                onClick={() => refetch()}
                className="mt-6 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={14} />
                {common.retry}
              </button>
            </motion.div>
          ) : chartData.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 flex flex-col items-center justify-center text-center"
            >
              <div className="p-5 bg-slate-50 rounded-3xl text-slate-300 border border-slate-100 mb-4">
                <TrendingUp size={56} />
              </div>
              <h4 className="text-slate-800 font-black text-lg">{t.empty}</h4>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto font-bold">{t.emptyDesc}</p>
            </motion.div>
          ) : (
            <motion.div 
              key="data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-[320px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {SUBSIDIARY_COLORS.map((color, i) => (
                      <filter key={`shadow-${i}`} id={`shadow-${i}`} height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                        <feOffset in="blur" dx="0" dy="4" result="offsetBlur" />
                        <feFlood floodColor={color} floodOpacity="0.2" result="offsetColor" />
                        <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="shadow" />
                        <feMerge>
                          <feMergeNode in="shadow" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '24px' }} 
                    iconType="circle" 
                    iconSize={8} 
                    verticalAlign="bottom"
                  />
                  {ratioTrends.map((trend, idx) => {
                    const sub = subsidiaries.find((s) => s.id === trend.subsidiaryId);
                    const color = SUBSIDIARY_COLORS[idx % SUBSIDIARY_COLORS.length];
                    return (
                      <React.Fragment key={trend.subsidiaryId}>
                        <Line
                          type="monotone"
                          dataKey={`${trend.subsidiaryId}_value`}
                          name={sub?.name ?? trend.subsidiaryId}
                          stroke={color}
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                          connectNulls={true}
                          filter={`url(#shadow-${idx % SUBSIDIARY_COLORS.length})`}
                          animationDuration={1500}
                        />
                        {showMovingAvg && (
                          <Line
                            type="monotone"
                            dataKey={`${trend.subsidiaryId}_ma3m`}
                            name={`${sub?.name ?? trend.subsidiaryId} (3M MA)`}
                            stroke={color}
                            strokeWidth={1.5}
                            strokeDasharray="6 4"
                            dot={false}
                            connectNulls={true}
                            opacity={0.4}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 flex items-center gap-2">
        <Info size={12} className="text-slate-400" />
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          {t.footer}
        </p>
      </div>
    </div>
  );
};
