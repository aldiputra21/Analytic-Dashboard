import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CostControlData {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  trend: number[];
  alert: boolean;
  notes?: string;
  actionPlan?: string;
}

interface Props {
  data: CostControlData[] | null;
  loading?: boolean;
}

function formatRupiah(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}M`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function CostControlMonitoring({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg text-center">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No cost control data available</p>
      </div>
    );
  }

  const cumulativeVariance = data.reduce((sum, item) => sum + item.variance, 0);
  const alertCount = data.filter(item => item.alert).length;

  // Prepare chart data
  const chartData = data.map(item => ({
    name: item.category.split(' ').slice(0, 2).join(' '),
    budgeted: item.budgeted,
    actual: item.actual,
    variance: item.variance
  }));

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 shadow-lg text-white"
        >
          <p className="text-sm opacity-90 mb-2">Total Categories</p>
          <p className="text-4xl font-bold">{data.length}</p>
          <p className="text-xs opacity-75 mt-2">Cost control categories</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-xl p-6 shadow-lg text-white ${
            cumulativeVariance > 0 
              ? 'bg-gradient-to-br from-red-600 to-pink-600' 
              : 'bg-gradient-to-br from-green-600 to-emerald-600'
          }`}
        >
          <p className="text-sm opacity-90 mb-2">Cumulative Variance</p>
          <p className="text-4xl font-bold">{formatRupiah(Math.abs(cumulativeVariance))}</p>
          <p className="text-xs opacity-75 mt-2">{cumulativeVariance > 0 ? 'Over budget' : 'Under budget'}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-xl p-6 shadow-lg text-white ${
            alertCount > 0 
              ? 'bg-gradient-to-br from-orange-600 to-red-600' 
              : 'bg-gradient-to-br from-green-600 to-emerald-600'
          }`}
        >
          <p className="text-sm opacity-90 mb-2">Alerts</p>
          <p className="text-4xl font-bold">{alertCount}</p>
          <p className="text-xs opacity-75 mt-2">Categories over budget</p>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Budget vs Actual Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip formatter={(value: number) => formatRupiah(value)} />
            <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
            <Bar dataKey="actual" fill="#ef4444" name="Actual" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Cost Control Details</h3>
        
        {data.map((item, index) => (
          <motion.div
            key={item.category}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white rounded-xl p-6 shadow-lg border-l-4 ${
              item.alert ? 'border-red-500' : 'border-green-500'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {item.alert && <AlertTriangle className="w-6 h-6 text-red-500" />}
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{item.category}</h4>
                  {item.alert && (
                    <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      OVER BUDGET
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className={`text-2xl font-bold ${item.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {item.variancePercentage > 0 ? '+' : ''}{item.variancePercentage.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">Variance</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-semibold mb-1">BUDGETED</p>
                <p className="text-lg font-bold text-blue-900">{formatRupiah(item.budgeted)}</p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-orange-600 font-semibold mb-1">ACTUAL</p>
                <p className="text-lg font-bold text-orange-900">{formatRupiah(item.actual)}</p>
              </div>
              
              <div className={`rounded-lg p-3 ${item.variance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <p className={`text-xs font-semibold mb-1 ${item.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  VARIANCE
                </p>
                <p className={`text-lg font-bold ${item.variance > 0 ? 'text-red-900' : 'text-green-900'}`}>
                  {formatRupiah(Math.abs(item.variance))}
                </p>
              </div>
            </div>

            {/* Trend */}
            {item.trend && item.trend.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">6-Month Variance Trend</p>
                <div className="flex items-end gap-1 h-16">
                  {item.trend.map((value, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t transition-all ${
                        value > 10 ? 'bg-red-400' : value > 0 ? 'bg-yellow-400' : 'bg-green-400'
                      }`}
                      style={{ height: `${Math.min(Math.abs(value) * 2, 100)}%` }}
                      title={`${value.toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Notes and Action Plan */}
            {(item.notes || item.actionPlan) && (
              <div className="space-y-2 pt-4 border-t border-gray-200">
                {item.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Notes:</p>
                    <p className="text-sm text-gray-700">{item.notes}</p>
                  </div>
                )}
                {item.actionPlan && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Action Plan:</p>
                    <p className="text-sm text-gray-700">{item.actionPlan}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
