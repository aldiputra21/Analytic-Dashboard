import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface KeyMetricsData {
  totalAssets: number;
  currentAssets: number;
  totalLiabilities: number;
  currentLiabilities: number;
  netProfit: number;
  currentRatio: number;
  der: number;
  lastUpdated: {
    balanceSheet: string;
    incomeStatement: string;
  };
}

interface Props {
  data: KeyMetricsData | null;
  loading?: boolean;
}

function formatRupiah(value: number): string {
  if (Math.abs(value) >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}M`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function Dashboard2KeyMetrics({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-lg text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No financial data available</p>
        <p className="text-sm text-gray-500 mt-2">Please input balance sheet and income statement data</p>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Assets',
      value: formatRupiah(data.totalAssets),
      icon: DollarSign,
      gradient: 'from-blue-500 to-cyan-500',
      updated: data.lastUpdated.balanceSheet
    },
    {
      label: 'Current Assets',
      value: formatRupiah(data.currentAssets),
      icon: Wallet,
      gradient: 'from-green-500 to-emerald-500',
      updated: data.lastUpdated.balanceSheet
    },
    {
      label: 'Total Liabilities',
      value: formatRupiah(data.totalLiabilities),
      icon: DollarSign,
      gradient: 'from-orange-500 to-red-500',
      updated: data.lastUpdated.balanceSheet
    },
    {
      label: 'Current Liabilities',
      value: formatRupiah(data.currentLiabilities),
      icon: Wallet,
      gradient: 'from-yellow-500 to-orange-500',
      updated: data.lastUpdated.balanceSheet
    },
    {
      label: 'Net Profit',
      value: formatRupiah(data.netProfit),
      icon: data.netProfit >= 0 ? TrendingUp : TrendingDown,
      gradient: data.netProfit >= 0 ? 'from-green-500 to-teal-500' : 'from-red-500 to-pink-500',
      updated: data.lastUpdated.incomeStatement
    },
    {
      label: 'Current Ratio',
      value: data.currentRatio.toFixed(2),
      icon: data.currentRatio >= 1.0 ? TrendingUp : AlertCircle,
      gradient: data.currentRatio >= 1.0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500',
      status: data.currentRatio >= 1.0 ? 'Healthy' : 'Warning',
      statusColor: data.currentRatio >= 1.0 ? 'text-green-600' : 'text-red-600',
      updated: data.lastUpdated.balanceSheet
    },
    {
      label: 'DER (Debt to Equity)',
      value: data.der.toFixed(2),
      icon: data.der <= 2.0 ? TrendingUp : AlertCircle,
      gradient: data.der <= 2.0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500',
      status: data.der <= 2.0 ? 'Healthy' : 'Warning',
      statusColor: data.der <= 2.0 ? 'text-green-600' : 'text-red-600',
      updated: data.lastUpdated.balanceSheet
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Key Financial Metrics
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`}></div>
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                {metric.status && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${metric.statusColor} bg-opacity-10`}>
                    {metric.status}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-xs text-gray-500">
                  Updated: {new Date(metric.updated).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            {/* Hover effect border */}
            <div className={`absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
