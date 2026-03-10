import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Target,
  AlertTriangle,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  Maximize2,
  Minimize2,
  RefreshCw,
  Calendar,
  Building2,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar
} from 'recharts';

interface Props {
  companyId: string;
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

export default function ExecutiveDashboard({ companyId }: Props) {
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Data states
  const [keyMetrics, setKeyMetrics] = useState<any>(null);
  const [cashPosition, setCashPosition] = useState<any>(null);
  const [deptPerformance, setDeptPerformance] = useState<any>(null);
  const [achievement, setAchievement] = useState<any>(null);
  const [assetComposition, setAssetComposition] = useState<any>(null);
  const [equityComposition, setEquityComposition] = useState<any>(null);
  const [historicalCashFlow, setHistoricalCashFlow] = useState<any[]>([]);
  const [costControl, setCostControl] = useState<any[]>([]);

  const currentPeriod = new Date().toISOString().slice(0, 7);

  // Fetch all data
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [metrics, cash, dept, ach, asset, equity, historical, cost] = await Promise.all([
        fetch(`/api/dashboard/key-metrics?companyId=${companyId}&period=${currentPeriod}`).then(r => r.json()),
        fetch(`/api/dashboard/cash-position?companyId=${companyId}`).then(r => r.json()),
        fetch(`/api/dashboard/dept-performance?companyId=${companyId}&period=${currentPeriod}`).then(r => r.json()),
        fetch(`/api/dashboard/achievement-gauge?companyId=${companyId}&period=${currentPeriod}`).then(r => r.json()),
        fetch(`/api/dashboard/asset-composition?companyId=${companyId}&period=${currentPeriod}`).then(r => r.json()),
        fetch(`/api/dashboard/equity-composition?companyId=${companyId}&period=${currentPeriod}`).then(r => r.json()),
        fetch(`/api/dashboard/historical-cash-flow?companyId=${companyId}&months=6`).then(r => r.json()),
        fetch(`/api/cost-control?companyId=${companyId}&period=${currentPeriod}`).then(r => r.json())
      ]);

      setKeyMetrics(metrics);
      setCashPosition(cash);
      setDeptPerformance(dept);
      setAchievement(ach);
      setAssetComposition(asset);
      setEquityComposition(equity);
      setHistoricalCashFlow(historical);
      setCostControl(cost);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [companyId]);

  const toggleWidget = (widgetId: string) => {
    setExpandedWidget(expandedWidget === widgetId ? null : widgetId);
  };

  // KPI Cards Data
  const kpiData = keyMetrics ? [
    {
      id: 'revenue',
      label: 'Net Profit',
      value: formatRupiah(keyMetrics.netProfit),
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'from-emerald-50 to-teal-50'
    },
    {
      id: 'assets',
      label: 'Total Assets',
      value: formatRupiah(keyMetrics.totalAssets),
      change: 8.3,
      trend: 'up',
      icon: Wallet,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'from-blue-50 to-cyan-50'
    },
    {
      id: 'ratio',
      label: 'Current Ratio',
      value: keyMetrics.currentRatio.toFixed(2),
      status: keyMetrics.currentRatio >= 1.0 ? 'healthy' : 'warning',
      icon: Activity,
      color: keyMetrics.currentRatio >= 1.0 ? 'from-green-500 to-emerald-600' : 'from-orange-500 to-red-600',
      bgColor: keyMetrics.currentRatio >= 1.0 ? 'from-green-50 to-emerald-50' : 'from-orange-50 to-red-50'
    },
    {
      id: 'der',
      label: 'DER',
      value: keyMetrics.der.toFixed(2),
      status: keyMetrics.der <= 2.0 ? 'healthy' : 'warning',
      icon: Target,
      color: keyMetrics.der <= 2.0 ? 'from-green-500 to-emerald-600' : 'from-orange-500 to-red-600',
      bgColor: keyMetrics.der <= 2.0 ? 'from-green-50 to-emerald-50' : 'from-orange-50 to-red-50'
    }
  ] : [];

  // Achievement gauge data
  const achievementData = achievement ? [
    {
      name: 'Achievement',
      value: achievement.overallAchievement || 0,
      fill: achievement.overallAchievement >= 75 ? '#10b981' : achievement.overallAchievement >= 50 ? '#f59e0b' : '#ef4444'
    }
  ] : [];

  // Asset & Equity pie data
  const assetPieData = assetComposition ? [
    { name: 'Current', value: assetComposition.currentAssets, color: '#10b981' },
    { name: 'Fixed', value: assetComposition.fixedAssets, color: '#3b82f6' },
    { name: 'Other', value: assetComposition.otherAssets, color: '#8b5cf6' }
  ] : [];

  const equityPieData = equityComposition ? [
    { name: 'Modal', value: equityComposition.modal, color: '#f59e0b' },
    { name: 'Laba', value: equityComposition.labaDitahan, color: '#10b981' },
    { name: 'Deviden', value: equityComposition.deviden, color: '#6366f1' }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Executive Dashboard</h1>
            <p className="text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last updated: {lastUpdate.toLocaleTimeString('id-ID')}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiData.map((kpi, index) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-gradient-to-br ${kpi.bgColor} rounded-2xl p-6 shadow-xl border border-white/10 overflow-hidden group hover:scale-105 transition-transform`}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, currentColor 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>
            </div>

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color} shadow-lg`}>
                  <kpi.icon className="w-6 h-6 text-white" />
                </div>
                {kpi.change && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                    kpi.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {kpi.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {kpi.change}%
                  </div>
                )}
                {kpi.status && (
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    kpi.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {kpi.status === 'healthy' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  </div>
                )}
              </div>

              <p className="text-sm font-medium text-slate-600 mb-1">{kpi.label}</p>
              <p className="text-3xl font-black text-slate-900">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Achievement Gauge - Compact */}
        <motion.div
          layout
          className={`${expandedWidget === 'achievement' ? 'col-span-12 md:col-span-6' : 'col-span-12 md:col-span-4'} bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Overall Achievement</h3>
            <button
              onClick={() => toggleWidget('achievement')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {expandedWidget === 'achievement' ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              data={achievementData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={10}
                fill={achievementData[0]?.fill}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-4xl font-black fill-white"
              >
                {achievementData[0]?.value.toFixed(0)}%
              </text>
            </RadialBarChart>
          </ResponsiveContainer>

          {deptPerformance && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Top: {deptPerformance.highest?.divisionName}</span>
                <span className="text-green-400 font-bold">{deptPerformance.highest?.achievement.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Low: {deptPerformance.lowest?.divisionName}</span>
                <span className="text-orange-400 font-bold">{deptPerformance.lowest?.achievement.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Historical Cash Flow - Compact */}
        <motion.div
          layout
          className={`${expandedWidget === 'cashflow' ? 'col-span-12' : 'col-span-12 md:col-span-8'} bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Cash Flow Trend (6M)</h3>
            <button
              onClick={() => toggleWidget('cashflow')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {expandedWidget === 'cashflow' ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <ResponsiveContainer width="100%" height={expandedWidget === 'cashflow' ? 300 : 200}>
            <AreaChart data={historicalCashFlow}>
              <defs>
                <linearGradient id="cashIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="cashOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Area type="monotone" dataKey="cash_in" stroke="#10b981" fillOpacity={1} fill="url(#cashIn)" name="Cash In" />
              <Area type="monotone" dataKey="cash_out" stroke="#ef4444" fillOpacity={1} fill="url(#cashOut)" name="Cash Out" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Asset Composition - Compact */}
        <motion.div
          layout
          className={`${expandedWidget === 'asset' ? 'col-span-12 md:col-span-6' : 'col-span-12 md:col-span-4'} bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Assets</h3>
            <button
              onClick={() => toggleWidget('asset')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {expandedWidget === 'asset' ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={assetPieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {assetPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: any) => formatRupiah(value)}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {assetPieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="text-white font-semibold">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Equity Composition - Compact */}
        <motion.div
          layout
          className={`${expandedWidget === 'equity' ? 'col-span-12 md:col-span-6' : 'col-span-12 md:col-span-4'} bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Equity</h3>
            <button
              onClick={() => toggleWidget('equity')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {expandedWidget === 'equity' ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={equityPieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {equityPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(value: any) => formatRupiah(value)}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {equityPieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="text-white font-semibold">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cost Control Alerts - Compact */}
        <motion.div
          layout
          className={`${expandedWidget === 'cost' ? 'col-span-12' : 'col-span-12 md:col-span-4'} bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Cost Alerts
            </h3>
            <button
              onClick={() => toggleWidget('cost')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {expandedWidget === 'cost' ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {costControl && costControl.filter(c => c.alert).slice(0, expandedWidget === 'cost' ? 10 : 3).map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 bg-slate-700/50 rounded-lg border-l-4 border-red-500"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{item.category}</span>
                  <span className="text-xs font-bold text-red-400">+{item.variancePercentage.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Budget: {formatRupiah(item.budgeted)}</span>
                  <span>Actual: {formatRupiah(item.actual)}</span>
                </div>
              </motion.div>
            ))}
            {(!costControl || costControl.filter(c => c.alert).length === 0) && (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>All costs within budget</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
