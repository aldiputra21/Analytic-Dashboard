import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface RatioData {
  name: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  previousValue?: number;
  unit?: string;
}

interface RatioGroup {
  groupName: 'Liquidity' | 'Profitability' | 'Leverage';
  ratios: RatioData[];
}

interface Props {
  data: RatioGroup[] | null;
  loading?: boolean;
}

export default function Dashboard6FinancialRatios({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg text-center">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No financial ratio data available</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'from-green-500 to-emerald-500';
      case 'warning': return 'from-yellow-500 to-orange-500';
      case 'critical': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'critical': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const groupIcons = {
    'Liquidity': '💧',
    'Profitability': '💰',
    'Leverage': '⚖️'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Financial Ratios
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {data.map((group, groupIndex) => (
          <motion.div
            key={group.groupName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {/* Group Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{groupIcons[group.groupName]}</span>
                <h3 className="text-lg font-bold text-white">{group.groupName} Ratios</h3>
              </div>
            </div>

            {/* Ratios List */}
            <div className="p-4 space-y-3">
              {group.ratios.map((ratio, ratioIndex) => {
                const TrendIcon = getTrendIcon(ratio.trend);
                return (
                  <motion.div
                    key={ratio.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupIndex * 0.1) + (ratioIndex * 0.05) }}
                    className={`border-2 rounded-lg p-4 transition-all duration-300 hover:shadow-md ${getStatusBg(ratio.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">{ratio.name}</span>
                      <TrendIcon className={`w-4 h-4 ${getTrendColor(ratio.trend)}`} />
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {ratio.value.toFixed(2)}{ratio.unit || ''}
                        </p>
                        {ratio.previousValue !== undefined && (
                          <p className="text-xs text-gray-500">
                            Previous: {ratio.previousValue.toFixed(2)}{ratio.unit || ''}
                          </p>
                        )}
                      </div>

                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        ratio.status === 'healthy' ? 'bg-green-100 text-green-700' :
                        ratio.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {ratio.status.charAt(0).toUpperCase() + ratio.status.slice(1)}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(ratio.value * 20, 100)}%` }}
                        transition={{ delay: (groupIndex * 0.1) + (ratioIndex * 0.05) + 0.3, duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${getStatusColor(ratio.status)}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
