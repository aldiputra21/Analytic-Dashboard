import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Filter,
  Building2,
  Calendar,
  Layers,
  Search,
  Settings,
  MoreHorizontal,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Info,
  Activity,
  PieChart as PieChartIcon,
  Wallet,
  ShieldCheck,
  Briefcase,
  Zap,
  Users,
  Upload,
  Shield,
  Key,
  Plus,
  Edit2,
  Trash2,
  Lock,
  X,
  Check,
  AlertTriangle,
  FileText,
  Scale,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

import { Company, FinancialRatio, PeriodType, User, Role, AuditLog, TimeRange } from './types';
import { HEALTH_THRESHOLDS, TIME_RANGES } from './constants';
import { METRIC_DESCRIPTIONS, PERMISSION_DESCRIPTIONS, STATUS_DESCRIPTIONS } from './tooltips';
import { InfoTooltip, LabelWithTooltip } from './components/Tooltip';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to format currency in Rupiah
function formatRupiah(value: number, showMillion: boolean = true): string {
  if (showMillion) {
    return `Rp ${(value / 1000000).toFixed(1)}M`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}

// --- Components ---

const Card = ({ children, className, title, subtitle, icon: Icon, tooltip }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden", className)}
  >
    {(title || Icon) && (
      <div className="px-6 py-4 border-bottom border-slate-100 flex items-center justify-between">
        <div>
          {title && (
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              {tooltip && <InfoTooltip title={tooltip.title} description={tooltip.description} />}
            </div>
          )}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>
    )}
    <div className="p-6">{children}</div>
  </motion.div>
);

const CompanyOverview = ({ company, latest, otherLatest, yoyRevenue, yoyProfit }: any) => {
  if (!latest) return null;

  const compareMetric = (key: string, val: number, otherVal: number | undefined) => {
    if (otherVal === undefined) return null;
    const diff = val - otherVal;
    const isBetter = key === 'der' ? diff < 0 : diff > 0;
    return (
      <div className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
        isBetter ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
      )}>
        {isBetter ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
        {Math.abs(diff).toFixed(1)}% vs Peer
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <Card className="lg:col-span-2 p-0">
        <div className="p-8 flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{company.name}</h2>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-wider">
                  Strategic Entity
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                Active
              </span>
            </div>
            <p className="text-slate-500 text-sm mb-6">Sector: Industrial Services • Established: 2010 • HQ: Jakarta, Indonesia</p>
            
            <div className="grid grid-cols-3 gap-8 mb-6">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Assets</p>
                  <InfoTooltip title={METRIC_DESCRIPTIONS.total_assets.title} description={METRIC_DESCRIPTIONS.total_assets.description} />
                </div>
                <p className="text-lg font-bold text-slate-900">{formatRupiah(latest.total_assets)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Equity</p>
                  <InfoTooltip title={METRIC_DESCRIPTIONS.total_equity.title} description={METRIC_DESCRIPTIONS.total_equity.description} />
                </div>
                <p className="text-lg font-bold text-slate-900">{formatRupiah(latest.total_equity)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Liabilities</p>
                  <InfoTooltip title={METRIC_DESCRIPTIONS.total_liabilities.title} description={METRIC_DESCRIPTIONS.total_liabilities.description} />
                </div>
                <p className="text-lg font-bold text-slate-900">{formatRupiah(latest.total_liabilities)}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ROA Benchmarking</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">{latest.roa.toFixed(2)}%</span>
                  {compareMetric('roa', latest.roa, otherLatest?.roa)}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NPM Benchmarking</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">{latest.npm.toFixed(2)}%</span>
                  {compareMetric('npm', latest.npm, otherLatest?.npm)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-slate-900 text-white border-none shadow-xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold opacity-70">Annual Growth</h3>
              <InfoTooltip title={METRIC_DESCRIPTIONS.annual_growth.title} description={METRIC_DESCRIPTIONS.annual_growth.description} />
            </div>
            <TrendingUp className="w-4 h-4 opacity-50" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">Revenue Growth</span>
                  <InfoTooltip title={METRIC_DESCRIPTIONS.revenue_growth.title} description={METRIC_DESCRIPTIONS.revenue_growth.description} />
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 font-bold">
                <ArrowUpRight className="w-4 h-4" />
                {yoyRevenue}%
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">Profit Growth</span>
                  <InfoTooltip title={METRIC_DESCRIPTIONS.profit_growth.title} description={METRIC_DESCRIPTIONS.profit_growth.description} />
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 font-bold">
                <ArrowUpRight className="w-4 h-4" />
                {yoyProfit}%
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-white/10">
            <p className="text-[10px] opacity-50 uppercase font-bold tracking-widest mb-2">Performance Badge</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold">TOP 10% SECTOR</span>
              <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold">HIGH LIQUIDITY</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const HealthScoreGauge = ({ score }: any) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score },
  ];
  const COLORS = ['#6366f1', '#f8fafc']; // Indigo for score

  return (
    <Card 
      title="Strategic Performance Index" 
      subtitle="Aggregate corporate health metric" 
      icon={ShieldCheck}
      tooltip={METRIC_DESCRIPTIONS.strategic_performance_index}
    >
      <div className="flex flex-col items-center">
        <div className="h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={80}
                outerRadius={110}
                paddingAngle={0}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <p className="text-5xl font-black text-slate-900 tracking-tighter">{score}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Index Points</p>
          </div>
        </div>
        
        <div className="w-full mt-8 grid grid-cols-2 gap-4">
          {[
            { label: 'Profitability', val: 85, color: 'bg-indigo-500', key: 'profitability' },
            { label: 'Liquidity', val: 70, color: 'bg-emerald-500', key: 'liquidity' },
            { label: 'Solvency', val: 90, color: 'bg-blue-500', key: 'solvency' },
            { label: 'Efficiency', val: 75, color: 'bg-violet-500', key: 'efficiency' },
          ].map((dim) => (
            <div key={dim.label} className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                <div className="flex items-center gap-1">
                  <span>{dim.label}</span>
                  <InfoTooltip 
                    title={METRIC_DESCRIPTIONS[dim.key].title} 
                    description={METRIC_DESCRIPTIONS[dim.key].description}
                  />
                </div>
                <span>{dim.val}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.val}%` }}
                  className={cn("h-full rounded-full", dim.color)} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const KPICard = ({ label, value, unit = "%", trend, yoy, delta, status, companyName, companyColor, metricKey }: any) => {
  const isHealthy = status === 'Healthy';
  const isRisky = status === 'Risky';
  const tooltip = METRIC_DESCRIPTIONS[metricKey] || { title: label, description: '' };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: companyColor }} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{companyName}</span>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <InfoTooltip title={tooltip.title} description={tooltip.description} />
          </div>
          <h4 className="text-2xl font-bold tracking-tight text-slate-900">
            {typeof value === 'number' ? value.toFixed(2) : value}{unit}
          </h4>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold",
          isHealthy ? "bg-emerald-50 text-emerald-700" : isRisky ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
        )}>
          {isHealthy ? <CheckCircle2 className="w-3 h-3" /> : isRisky ? <AlertCircle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
          {status}
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1">
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-rose-500" />}
          <span className={cn("text-xs font-medium", trend === 'up' ? "text-emerald-600" : "text-rose-600")}>
            {yoy}% YoY
          </span>
          <InfoTooltip title={METRIC_DESCRIPTIONS.yoy.title} description={METRIC_DESCRIPTIONS.yoy.description} />
        </div>
        {delta !== undefined && (
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            Δ vs Other: <span className={cn(delta >= 0 ? "text-emerald-600" : "text-rose-600")}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
            <InfoTooltip title={METRIC_DESCRIPTIONS.benchmarking.title} description={METRIC_DESCRIPTIONS.benchmarking.description} />
          </div>
        )}
      </div>
    </div>
  );
};

const GrowthTrends = ({ data, companyId }: any) => {
  const isBoth = companyId === 'both';
  const primaryId = isBoth ? 'ASI' : companyId;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <Card 
        title="Revenue & Profitability Dynamics" 
        subtitle="Strategic growth trajectories" 
        icon={TrendingUp}
        tooltip={METRIC_DESCRIPTIONS.revenue_profitability_dynamics}
      >
        <div className="h-[300px] w-full flex items-center justify-center">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatRupiah(v)} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey={`${primaryId}_revenue`} name="Revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey={`${primaryId}_profit`} name="Net Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                {isBoth && <Area type="monotone" dataKey="TSI_revenue" name="TSI Revenue" stroke="#94a3b8" strokeWidth={2} fillOpacity={0} />}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm font-medium">No historical data available for this selection</div>
          )}
        </div>
      </Card>
      
      <Card 
        title="Operational Efficiency Ratios" 
        subtitle="NPM & ROE performance" 
        icon={Activity}
        tooltip={METRIC_DESCRIPTIONS.operational_efficiency_ratios}
      >
        <div className="h-[300px] w-full flex items-center justify-center">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line type="monotone" dataKey={`${primaryId}_roe`} name="Return on Equity" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} />
                <Line type="monotone" dataKey={`${primaryId}_npm`} name="Net Profit Margin" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm font-medium">No historical data available for this selection</div>
          )}
        </div>
      </Card>
    </div>
  );
};

const WaterfallChart = ({ latest }: any) => {
  const data = latest ? [
    { name: 'Revenue', value: latest.revenue, start: 0 },
    { name: 'COGS', value: -(latest.revenue * 0.6), start: latest.revenue },
    { name: 'Gross Profit', value: latest.revenue - (latest.revenue * 0.6), start: 0 },
    { name: 'OpEx', value: -(latest.revenue - (latest.revenue * 0.6) - latest.net_profit), start: latest.revenue - (latest.revenue * 0.6) },
    { name: 'Net Profit', value: latest.net_profit, start: 0 },
  ] : [];

  return (
    <Card 
      title="Value Creation Waterfall" 
      subtitle="Revenue to Net Income bridge" 
      icon={BarChart3}
      tooltip={METRIC_DESCRIPTIONS.value_creation_waterfall}
    >
      <div className="h-[300px] w-full flex items-center justify-center">
        {latest ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatRupiah(v)} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(v: any) => formatRupiah(Math.abs(v), false)} 
              />
              <Bar dataKey="start" stackId="a" fill="transparent" />
              <Bar dataKey="value" stackId="a" radius={[4, 4, 4, 4]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-slate-400 text-sm font-medium">No data available for waterfall analysis</div>
        )}
      </div>
    </Card>
  );
};

const FinancialBreakdown = ({ latest }: any) => {
  const assetData = latest ? [
    { name: 'Current Assets', value: latest.current_assets },
    { name: 'Fixed Assets', value: latest.total_assets - latest.current_assets },
  ] : [];
  
  const capitalData = latest ? [
    { name: 'Equity', value: latest.total_equity },
    { name: 'Liabilities', value: latest.total_liabilities },
  ] : [];

  const PIE_COLORS = ['#0f172a', '#94a3b8'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <Card 
        title="Asset Composition" 
        subtitle="Current vs Non-current assets" 
        icon={PieChartIcon}
        tooltip={METRIC_DESCRIPTIONS.asset_composition}
      >
        <div className="h-[250px] w-full flex items-center justify-center">
          {latest ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatRupiah(v, false)} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm font-medium">No asset data available</div>
          )}
        </div>
      </Card>
      
      <Card 
        title="Capital Structure" 
        subtitle="Equity vs Debt ratio" 
        icon={Wallet}
        tooltip={METRIC_DESCRIPTIONS.capital_structure}
      >
        <div className="h-[250px] w-full flex items-center justify-center">
          {latest ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={capitalData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {capitalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatRupiah(v, false)} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm font-medium">No capital data available</div>
          )}
        </div>
      </Card>
    </div>
  );
};

const EarlyWarningSummary = ({ ratios, companies, companyId, isVisible, onToggle }: any) => {
  const warnings: any[] = [];
  const currentRatios = ratios.filter((r: any) => companyId === 'both' || r.company_id === companyId).slice(0, 4);

  currentRatios.forEach((r: any) => {
    const company = companies.find((c: any) => c.id === r.company_id);
    const thresholds = company?.thresholds || { liquidity_drop: 20, der_rise: 15, margin_drop_months: 3 };
    const ideals = company?.ideal_ratios || { current_ratio: 1.5, quick_ratio: 1, der: 2, npm: 10 };

    // 1. Cash Flow Risk
    if (r.operating_cash_flow < 0) {
      warnings.push({ type: 'Cash Flow', msg: `Negative Operating Cash Flow for ${r.company_id}`, level: 'High' });
    }

    // 2. Solvency Risk (DER)
    if (r.der > ideals.der) {
      warnings.push({ type: 'Solvency', msg: `High Debt-to-Equity (${r.der.toFixed(2)}x) for ${r.company_id} (Target: <${ideals.der}x)`, level: 'High' });
    }

    // 3. Liquidity Risk (Current Ratio)
    if (r.current_ratio < ideals.current_ratio) {
      warnings.push({ type: 'Liquidity', msg: `Current Ratio (${r.current_ratio.toFixed(2)}x) below target for ${r.company_id}`, level: 'High' });
    }

    // 4. Profitability Risk (NPM)
    if (r.npm < ideals.npm) {
      warnings.push({ type: 'Profitability', msg: `Low Net Profit Margin (${r.npm.toFixed(2)}%) for ${r.company_id}`, level: 'Medium' });
    }
  });

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Strategic Risk Alerts</h3>
          {warnings.length > 0 && (
            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
              {warnings.length}
            </span>
          )}
        </div>
        <button 
          onClick={onToggle}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
        >
          {isVisible ? 'Hide Alerts' : 'Show Alerts'}
          <ChevronDown className={cn("w-4 h-4 transition-transform", isVisible ? "rotate-180" : "")} />
        </button>
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warnings.length === 0 ? (
                <div className="lg:col-span-3 flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-bold">System Status: Optimal. No critical financial risks detected across monitored entities.</span>
                </div>
              ) : (
                warnings.map((w, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all hover:shadow-md",
                    w.level === 'High' ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-amber-50 border-amber-100 text-amber-700"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        w.level === 'High' ? "bg-rose-100" : "bg-amber-100"
                      )}>
                        <AlertCircle className="w-5 h-5 shrink-0" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{w.type}</p>
                        <p className="text-sm font-bold tracking-tight">{w.msg}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-white/50 rounded-lg border border-current/10">{w.level}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PerformanceRanking = ({ asi, tsi }: any) => {
  if (!asi || !tsi) return null;

  const categories = [
    { label: 'Profitability (ROE)', key: 'roe', unit: '%' },
    { label: 'Margin Efficiency (NPM)', key: 'npm', unit: '%' },
    { label: 'Asset Utilization (ROA)', key: 'roa', unit: '%' },
    { label: 'Financial Leverage (DER)', key: 'der', unit: 'x', inverse: true },
    { label: 'Liquidity (Current Ratio)', key: 'current_ratio', unit: 'x' },
  ];

  const rankings = categories.map(cat => {
    const valA = asi[cat.key];
    const valB = tsi[cat.key];
    const isALeading = cat.inverse ? valA < valB : valA > valB;
    return {
      ...cat,
      valA,
      valB,
      leader: isALeading ? 'ASI' : 'TSI',
      diff: Math.abs(valA - valB)
    };
  });

  return (
    <Card 
      title="Performance Leaderboard" 
      subtitle="Comparative entity ranking by core metrics" 
      icon={TrendingUp}
      tooltip={METRIC_DESCRIPTIONS.performance_leaderboard}
    >
      <div className="space-y-6">
        {rankings.map((rank, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{rank.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">
                  Leader: {rank.leader}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Δ {rank.diff.toFixed(1)}{rank.unit}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(rank.valA / (rank.valA + rank.valB)) * 100}%` }}
                  className="h-full bg-indigo-500 border-r border-white/20"
                />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(rank.valB / (rank.valA + rank.valB)) * 100}%` }}
                  className="h-full bg-slate-400"
                />
              </div>
              <div className="flex gap-4 text-[10px] font-black min-w-[80px] justify-end">
                <span className="text-indigo-600">{rank.valA.toFixed(1)}{rank.unit}</span>
                <span className="text-slate-400">{rank.valB.toFixed(1)}{rank.unit}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">ASI Performance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">TSI Performance</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const CashFlowPanel = ({ data, companyId }: any) => {
  const isBoth = companyId === 'both';
  const primaryId = isBoth ? 'ASI' : companyId;

  const cfData = data.map((d: any) => ({
    period: d.period,
    operating: d[`${primaryId}_profit`] * 1.2,
    investing: -d[`${primaryId}_revenue`] * 0.1,
    financing: d[`${primaryId}_revenue`] * 0.05,
    net: (d[`${primaryId}_profit`] * 1.2) - (d[`${primaryId}_revenue`] * 0.1) + (d[`${primaryId}_revenue`] * 0.05)
  }));

  return (
    <Card 
      title="Liquidity & Cash Sustainability" 
      subtitle="Operational cash flow dynamics" 
      icon={Wallet}
      tooltip={METRIC_DESCRIPTIONS.liquidity_cash_sustainability}
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cfData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="period" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatRupiah(v)} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Bar dataKey="operating" name="Operating" fill="#6366f1" stackId="a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="investing" name="Investing" fill="#94a3b8" stackId="a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="financing" name="Financing" fill="#cbd5e1" stackId="a" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="net" name="Net Cash Flow" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const RiskAlertWidget = ({ score }: any) => {
  const riskLevel = score > 80 ? 'Low' : score > 60 ? 'Medium' : 'High';
  
  return (
    <Card 
      title="Governance Risk Matrix" 
      subtitle="Strategic risk exposure assessment" 
      icon={ShieldCheck}
      tooltip={METRIC_DESCRIPTIONS.governance_risk_matrix}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Composite Risk Profile</p>
            <h4 className={cn(
              "text-2xl font-black mt-1 tracking-tight",
              riskLevel === 'Low' ? "text-emerald-600" : riskLevel === 'Medium' ? "text-amber-600" : "text-rose-600"
            )}>{riskLevel} RISK</h4>
          </div>
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-inner",
            riskLevel === 'Low' ? "border-emerald-100 text-emerald-600 bg-emerald-50" : riskLevel === 'Medium' ? "border-amber-100 text-amber-600 bg-amber-50" : "border-rose-100 text-rose-600 bg-rose-50"
          )}>
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            { label: 'Market Volatility', status: 'Stable', color: 'emerald' },
            { label: 'Credit Exposure', status: 'Moderate', color: 'amber' },
            { label: 'Operational Integrity', status: 'Optimal', color: 'emerald' },
          ].map((risk, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100">
              <span className="text-xs text-slate-600 font-semibold">{risk.label}</span>
              <span className={cn(
                "px-2.5 py-1 rounded-lg font-bold text-[9px] uppercase tracking-wider",
                risk.color === 'emerald' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              )}>{risk.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const TrendAnalytics = ({ data, companyId }: any) => {
  const isBoth = companyId === 'both';
  const primaryId = isBoth ? 'ASI' : companyId;

  const trendData = data.map((d: any, i: number, arr: any[]) => {
    const window = arr.slice(Math.max(0, i - 2), i + 1);
    const avg = window.reduce((sum, curr) => sum + curr[`${primaryId}_revenue`], 0) / window.length;
    return {
      ...d,
      revenue: d[`${primaryId}_revenue`],
      movingAvg: avg
    };
  });

  return (
    <Card 
      title="Strategic Trend Forecasting" 
      subtitle="Revenue trajectory analysis" 
      icon={TrendingUp}
      tooltip={METRIC_DESCRIPTIONS.strategic_trend_forecasting}
    >
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="period" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatRupiah(v)} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Line type="monotone" dataKey="revenue" name="Actual Performance" stroke="#0f172a" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="movingAvg" name="3-Month Moving Average" stroke="#6366f1" strokeWidth={3} strokeDasharray="8 5" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const CompanyManagement = ({ companies, onEdit, onCreate }: any) => (
  <Card title="Corporate Management" subtitle="Manage company profiles and settings" icon={Building2}>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Company Master</h4>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Company
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-4 font-semibold text-slate-500">Company Name</th>
              <th className="pb-4 font-semibold text-slate-500">Industry</th>
              <th className="pb-4 font-semibold text-slate-500">Currency</th>
              <th className="pb-4 font-semibold text-slate-500">Status</th>
              <th className="pb-4 font-semibold text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {companies.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 font-medium text-slate-900">{c.name}</td>
                <td className="py-4 text-slate-500">{c.industry || 'N/A'}</td>
                <td className="py-4 text-slate-500">{c.currency || 'USD'}</td>
                <td className="py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase",
                    c.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                  )}>
                    {c.status || 'Active'}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <button onClick={() => onEdit(c)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </Card>
);

const UserManagement = ({ users, roles, onEdit, onCreate, onTogglePermission }: any) => (
  <div className="space-y-8">
    <Card title="User Management" subtitle="Manage system users and permissions" icon={Users}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">User Master</h4>
          <button 
            onClick={onCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 font-semibold text-slate-500">Username</th>
                <th className="pb-4 font-semibold text-slate-500">Role</th>
                <th className="pb-4 font-semibold text-slate-500">Status</th>
                <th className="pb-4 font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-medium text-slate-900">{u.username}</td>
                  <td className="py-4 text-slate-500">{u.role_name}</td>
                  <td className="py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-black uppercase",
                      u.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          const newPass = prompt('Enter new password for ' + u.username);
                          if (newPass) {
                            fetch(`/api/users/${u.id}/reset-password`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ password: newPass })
                            }).then(() => alert('Password reset successfully'));
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button onClick={() => onEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Deactivate user ' + u.username + '?')) {
                            fetch(`/api/users/${u.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...u, status: 'Inactive' })
                            }).then(() => window.location.reload());
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>

    <Card title="Permission Matrix" subtitle="Role-based access control configuration" icon={Shield}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-4 font-semibold text-slate-500">Permission</th>
              {roles.map((r: any) => (
                <th key={r.id} className="pb-4 font-semibold text-slate-500 text-center">{r.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {[
              { id: 'view_dashboard', label: 'View Dashboard' },
              { id: 'upload_data', label: 'Upload Data' },
              { id: 'edit_benchmark', label: 'Edit Benchmark' },
              { id: 'manage_user', label: 'Manage User' },
              { id: 'access_alert', label: 'Access Alert' },
              { id: 'export_report', label: 'Export Report' },
            ].map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 font-medium text-slate-700">{p.label}</td>
                {roles.map((r: any) => (
                  <td key={r.id} className="py-4 text-center">
                    <button 
                      onClick={() => onTogglePermission(r.id, p.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                      title={`Toggle ${p.label} for ${r.name}`}
                    >
                      {r.permissions?.includes(p.id) ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto group-hover:scale-110 transition-transform" />
                      ) : (
                        <X className="w-4 h-4 text-slate-200 mx-auto group-hover:text-rose-400 group-hover:scale-110 transition-all" />
                      )}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

const DataUpload = ({ companies }: any) => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [period, setPeriod] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !period) return;
    setIsUploading(true);
    
    // Sample data for demonstration
    const sampleData = {
      company_id: selectedCompany,
      period,
      revenue: 1200000 + Math.random() * 200000,
      net_profit: 150000 + Math.random() * 50000,
      total_assets: 5000000,
      total_equity: 3000000,
      total_liabilities: 2000000,
      current_assets: 1600000,
      current_liabilities: 850000,
      quick_assets: 1300000,
      cash: 600000,
      operating_cash_flow: 120000,
      ar_aging_90_plus: 80000,
      interest_expense: 45000,
      short_term_debt: 150000,
      long_term_debt: 750000
    };

    await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleData)
    });

    setIsUploading(false);
    alert('Data processed and ratios recalculated successfully!');
  };

  return (
    <Card title="Data Upload & Auto-Calculation" subtitle="Upload financial statements for processing" icon={Upload}>
      <form onSubmit={handleUpload} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Company</label>
            <select 
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            >
              <option value="">Choose a company...</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period (YYYY-MM)</label>
            <input 
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:border-indigo-300 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <Upload className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Financial Statements</p>
              <p className="text-xs text-slate-500 mt-1">Upload Balance Sheet, P&L, and Cash Flow (Excel/CSV)</p>
            </div>
          </div>
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:border-indigo-300 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Aging Reports</p>
              <p className="text-xs text-slate-500 mt-1">Upload AR/AP Aging details for risk analysis</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={isUploading}
            className={cn(
              "px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2",
              isUploading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"
            )}
          >
            {isUploading ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Process & Recalculate
              </>
            )}
          </button>
        </div>
      </form>
    </Card>
  );
};

const ConsolidatedReport = ({ companies, ratios }: any) => {
  const activeCompanies = companies.filter((c: Company) => c.status === 'Active');
  const latestPeriod = ratios.length > 0 ? ratios[0].period : '';
  
  const consolidated = activeCompanies.reduce((acc: any, company: Company) => {
    const companyRatio = ratios.find((r: FinancialRatio) => r.company_id === company.id && r.period === latestPeriod);
    if (companyRatio) {
      acc.revenue += companyRatio.revenue;
      acc.net_profit += companyRatio.net_profit;
      acc.total_assets += companyRatio.revenue * 4;
      acc.total_equity += companyRatio.revenue * 2.5;
      acc.total_liabilities += companyRatio.revenue * 1.5;
      acc.operating_cash_flow += companyRatio.operating_cash_flow;
    }
    return acc;
  }, { revenue: 0, net_profit: 0, total_assets: 0, total_equity: 0, total_liabilities: 0, operating_cash_flow: 0 });

  const consolidatedRatios = {
    roa: consolidated.total_assets > 0 ? (consolidated.net_profit / consolidated.total_assets) * 100 : 0,
    roe: consolidated.total_equity > 0 ? (consolidated.net_profit / consolidated.total_equity) * 100 : 0,
    npm: consolidated.revenue > 0 ? (consolidated.net_profit / consolidated.revenue) * 100 : 0,
    der: consolidated.total_equity > 0 ? consolidated.total_liabilities / consolidated.total_equity : 0,
  };

  return (
    <div className="space-y-8">
      <Card title="Consolidated Financial Overview" subtitle="Aggregated performance across all subsidiaries" icon={Layers}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Total Revenue</p>
              <Wallet className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-3xl font-black text-slate-900">{formatRupiah(consolidated.revenue)}</h3>
            <p className="text-xs text-slate-500 mt-2">Across {activeCompanies.length} entities</p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Net Profit</p>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-3xl font-black text-slate-900">{formatRupiah(consolidated.net_profit)}</h3>
            <p className="text-xs text-slate-500 mt-2">Group profitability</p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Assets</p>
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-3xl font-black text-slate-900">{formatRupiah(consolidated.total_assets)}</h3>
            <p className="text-xs text-slate-500 mt-2">Consolidated balance</p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-violet-50 to-white rounded-2xl border border-violet-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">Group ROE</p>
              <Activity className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="text-3xl font-black text-slate-900">{consolidatedRatios.roe.toFixed(1)}%</h3>
            <p className="text-xs text-slate-500 mt-2">Return on equity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-50 rounded-2xl">
            <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Subsidiary Contribution</h4>
            <div className="space-y-3">
              {activeCompanies.map((company: Company) => {
                const companyRatio = ratios.find((r: FinancialRatio) => r.company_id === company.id && r.period === latestPeriod);
                const contribution = companyRatio ? (companyRatio.revenue / consolidated.revenue) * 100 : 0;
                return (
                  <div key={company.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: company.color }} />
                        <span className="text-sm font-bold text-slate-700">{company.name}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{contribution.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${contribution}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: company.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl">
            <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Consolidated Ratios</h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'ROA', value: consolidatedRatios.roa, unit: '%', color: 'indigo' },
                { label: 'ROE', value: consolidatedRatios.roe, unit: '%', color: 'emerald' },
                { label: 'NPM', value: consolidatedRatios.npm, unit: '%', color: 'blue' },
                { label: 'DER', value: consolidatedRatios.der, unit: 'x', color: 'violet' },
              ].map((ratio) => (
                <div key={ratio.label} className="p-4 bg-white rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{ratio.label}</p>
                  <p className="text-2xl font-black text-slate-900">{ratio.value.toFixed(2)}{ratio.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ThresholdConfiguration = ({ companies, onSave }: any) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [thresholds, setThresholds] = useState<any>({});

  useEffect(() => {
    if (selectedCompany) {
      setThresholds(selectedCompany.ideal_ratios || {
        current_ratio: 1.5,
        quick_ratio: 1,
        der: 2,
        npm: 10,
        roa: 5,
        roe: 15,
      });
    }
  }, [selectedCompany]);

  const handleSave = async () => {
    if (!selectedCompany) return;
    await onSave({ ...selectedCompany, ideal_ratios: thresholds });
    alert('Thresholds updated successfully!');
  };

  return (
    <div className="space-y-8">
      <Card title="Threshold Configuration" subtitle="Customize financial ratio targets per subsidiary" icon={Settings}>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Company</label>
            <select
              value={selectedCompany?.id || ''}
              onChange={(e) => setSelectedCompany(companies.find((c: Company) => c.id === e.target.value) || null)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Choose a company...</option>
              {companies.map((c: Company) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedCompany && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCompany.color }} />
                  <h3 className="text-lg font-bold text-slate-900">{selectedCompany.name}</h3>
                </div>
                <p className="text-sm text-slate-600">Industry: {selectedCompany.industry || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { key: 'current_ratio', label: 'Current Ratio', unit: 'x', description: 'Minimum liquidity target' },
                  { key: 'quick_ratio', label: 'Quick Ratio', unit: 'x', description: 'Acid test threshold' },
                  { key: 'der', label: 'Max DER', unit: 'x', description: 'Maximum debt-to-equity' },
                  { key: 'npm', label: 'Min NPM', unit: '%', description: 'Minimum profit margin' },
                  { key: 'roa', label: 'Min ROA', unit: '%', description: 'Minimum asset return' },
                  { key: 'roe', label: 'Min ROE', unit: '%', description: 'Minimum equity return' },
                ].map((field) => (
                  <div key={field.key} className="p-5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{field.label}</label>
                    <p className="text-[10px] text-slate-400 mb-3">{field.description}</p>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={thresholds[field.key] || 0}
                        onChange={(e) => setThresholds({ ...thresholds, [field.key]: parseFloat(e.target.value) })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setThresholds(selectedCompany.ideal_ratios || {})}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Reset to Default
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
};

const AuditTrailViewer = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const res = await fetch('/api/audit-logs');
        if (res.ok) {
          setAuditLogs(await res.json());
        }
      } catch (e) {
        console.error('Failed to fetch audit logs', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLogs();
  }, []);

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType !== 'all' && log.entity_type !== filterType) return false;
    if (filterCompany !== 'all' && log.company_id !== filterCompany) return false;
    return true;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      <Card title="Audit Trail" subtitle="Complete history of system changes and data modifications" icon={Activity}>
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">All Types</option>
                <option value="financial_data">Financial Data</option>
                <option value="company">Company</option>
                <option value="user">User</option>
                <option value="threshold">Threshold</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Filter by Company</label>
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="all">All Companies</option>
                <option value="ASI">ASI</option>
                <option value="TSI">TSI</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Activity className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-4 font-semibold text-slate-500">Timestamp</th>
                    <th className="pb-4 font-semibold text-slate-500">User</th>
                    <th className="pb-4 font-semibold text-slate-500">Action</th>
                    <th className="pb-4 font-semibold text-slate-500">Entity Type</th>
                    <th className="pb-4 font-semibold text-slate-500">Company</th>
                    <th className="pb-4 font-semibold text-slate-500">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No audit logs found
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-mono text-xs text-slate-600">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </td>
                        <td className="py-4 font-medium text-slate-900">{log.username}</td>
                        <td className="py-4">
                          <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold uppercase border", getActionColor(log.action))}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 text-slate-600">{log.entity_type.replace('_', ' ')}</td>
                        <td className="py-4 text-slate-600">{log.company_id || '-'}</td>
                        <td className="py-4">
                          <button className="text-indigo-600 hover:text-indigo-700 font-medium text-xs">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Showing {filteredLogs.length} of {auditLogs.length} records</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                Previous
              </button>
              <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                Next
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const QuickDatePresets = ({ onSelect }: { onSelect: (start: string, end: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const presets = [
    { label: 'Last 3 Months', months: 3 },
    { label: 'Last 6 Months', months: 6 },
    { label: 'Last 1 Year', months: 12 },
    { label: 'Last 2 Years', months: 24 },
    { label: 'Last 3 Years', months: 36 },
    { label: 'Year to Date', ytd: true },
  ];

  const handlePresetClick = (preset: any) => {
    const end = new Date();
    let start = new Date();
    
    if (preset.ytd) {
      start = new Date(end.getFullYear(), 0, 1);
    } else {
      start.setMonth(start.getMonth() - preset.months);
    }
    
    onSelect(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
      >
        <Calendar className="w-3.5 h-3.5" />
        Quick Select
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 min-w-[180px]"
          >
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset)}
                className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <Card className="p-12 text-center">
    <div className="max-w-md mx-auto">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">No Data Found</h3>
      <p className="text-sm text-slate-500 mb-6">
        No financial data available for the selected date range and filters. Try adjusting your filters or selecting a different time period.
      </p>
      <button
        onClick={onReset}
        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
      >
        Reset Filters
      </button>
    </div>
  </Card>
);

const ManualDataInput = ({ companies }: any) => {
  const [activeTab, setActiveTab] = useState<'income' | 'balance' | 'cashflow'>('income');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [incomeData, setIncomeData] = useState({
    revenue: 0,
    cogs: 0,
    gross_profit: 0,
    operating_expenses: 0,
    ebit: 0,
    interest_expense: 0,
    tax: 0,
    net_profit: 0
  });

  const [balanceData, setBalanceData] = useState({
    // Aset Lancar
    kas: 0,
    deposito: 0,
    piutang_usaha: 0,
    piutang_lainnya: 0,
    uang_muka: 0,
    pekerjaan_dalam_proses: 0,
    pajak_dibayar_dimuka: 0,
    beban_dibayar_dimuka: 0,
    aset_lancar: 0,
    // Aset Tidak Lancar
    aset_tetap: 0,
    aset_tak_berwujud: 0,
    aset_lain: 0,
    aset_tak_lancar: 0,
    // Total Aset
    total_aset: 0,
    // Kewajiban Jangka Pendek
    utang_usaha: 0,
    utang_pajak: 0,
    utang_pembiayaan_pendek: 0,
    beban_ymhd_pendek: 0,
    utang_bank_pendek: 0,
    jumlah_kewajiban_pendek: 0,
    // Kewajiban Jangka Panjang
    utang_pemg_saham: 0,
    beban_ymhd_panjang: 0,
    utang_bank_panjang: 0,
    utang_pembiayaan_panjang: 0,
    utang_lainnya: 0,
    jumlah_kewajiban_panjang: 0,
    // Total Kewajiban
    jumlah_kewajiban: 0,
    // Ekuitas
    modal_saham: 0,
    laba_ditahan_ditentukan: 0,
    laba_ditahan_belum_ditentukan: 0,
    lr_tahun_berjalan: 0,
    jumlah_ekuitas: 0,
    // Total Kewajiban & Ekuitas
    jumlah_kewajiban_ekuitas: 0
  });

  const [cashflowData, setCashflowData] = useState({
    operating_cash_flow: 0,
    investing_cash_flow: 0,
    financing_cash_flow: 0,
    net_cash_flow: 0
  });

  const handleSubmit = async () => {
    if (!selectedCompany) {
      alert('Pilih perusahaan terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      const period = `${year}-${String(month).padStart(2, '0')}`;
      
      // Combine all data
      const payload = {
        company_id: selectedCompany,
        period,
        revenue: incomeData.revenue,
        net_profit: incomeData.net_profit,
        total_assets: balanceData.total_aset,
        total_equity: balanceData.jumlah_ekuitas,
        total_liabilities: balanceData.jumlah_kewajiban,
        current_assets: balanceData.aset_lancar,
        current_liabilities: balanceData.jumlah_kewajiban_pendek,
        quick_assets: balanceData.aset_lancar - balanceData.pekerjaan_dalam_proses,
        cash: balanceData.kas,
        operating_cash_flow: cashflowData.operating_cash_flow,
        ar_aging_90_plus: 0,
        interest_expense: incomeData.interest_expense,
        short_term_debt: balanceData.utang_bank_pendek,
        long_term_debt: balanceData.utang_bank_panjang
      };

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Data berhasil disimpan!');
        // Reset form
        setIncomeData({ revenue: 0, cogs: 0, gross_profit: 0, operating_expenses: 0, ebit: 0, interest_expense: 0, tax: 0, net_profit: 0 });
        setBalanceData({ 
          kas: 0, deposito: 0, piutang_usaha: 0, piutang_lainnya: 0, uang_muka: 0, 
          pekerjaan_dalam_proses: 0, pajak_dibayar_dimuka: 0, beban_dibayar_dimuka: 0, aset_lancar: 0,
          aset_tetap: 0, aset_tak_berwujud: 0, aset_lain: 0, aset_tak_lancar: 0, total_aset: 0,
          utang_usaha: 0, utang_pajak: 0, utang_pembiayaan_pendek: 0, beban_ymhd_pendek: 0, 
          utang_bank_pendek: 0, jumlah_kewajiban_pendek: 0, utang_pemg_saham: 0, beban_ymhd_panjang: 0,
          utang_bank_panjang: 0, utang_pembiayaan_panjang: 0, utang_lainnya: 0, jumlah_kewajiban_panjang: 0,
          jumlah_kewajiban: 0, modal_saham: 0, laba_ditahan_ditentukan: 0, laba_ditahan_belum_ditentukan: 0,
          lr_tahun_berjalan: 0, jumlah_ekuitas: 0, jumlah_kewajiban_ekuitas: 0
        });
        setCashflowData({ operating_cash_flow: 0, investing_cash_flow: 0, financing_cash_flow: 0, net_cash_flow: 0 });
        window.location.reload();
      } else {
        alert('Gagal menyimpan data');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // TODO: Implement file parsing logic
      alert('Fitur upload file akan segera tersedia');
    }
  };

  const tabs = [
    { id: 'income', label: 'Laba/Rugi', icon: TrendingUp },
    { id: 'balance', label: 'Neraca', icon: Scale },
    { id: 'cashflow', label: 'Arus Kas', icon: DollarSign }
  ];

  return (
    <div className="space-y-6">
      <Card title="Input Data Manual" subtitle="Masukkan data laporan keuangan secara manual" icon={FileText}>
        {/* Company & Period Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Perusahaan</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Pilih Perusahaan</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tahun</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              min="2020"
              max="2030"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bulan</label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2",
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Income Statement Form */}
        {activeTab === 'income' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pendapatan (Revenue)</label>
                <input
                  type="number"
                  value={incomeData.revenue}
                  onChange={(e) => setIncomeData({ ...incomeData, revenue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Harga Pokok Penjualan (COGS)</label>
                <input
                  type="number"
                  value={incomeData.cogs}
                  onChange={(e) => setIncomeData({ ...incomeData, cogs: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Laba Kotor (Gross Profit)</label>
                <input
                  type="number"
                  value={incomeData.gross_profit}
                  onChange={(e) => setIncomeData({ ...incomeData, gross_profit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Biaya Operasional</label>
                <input
                  type="number"
                  value={incomeData.operating_expenses}
                  onChange={(e) => setIncomeData({ ...incomeData, operating_expenses: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">EBIT</label>
                <input
                  type="number"
                  value={incomeData.ebit}
                  onChange={(e) => setIncomeData({ ...incomeData, ebit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Beban Bunga</label>
                <input
                  type="number"
                  value={incomeData.interest_expense}
                  onChange={(e) => setIncomeData({ ...incomeData, interest_expense: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pajak</label>
                <input
                  type="number"
                  value={incomeData.tax}
                  onChange={(e) => setIncomeData({ ...incomeData, tax: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Laba Bersih (Net Profit)</label>
                <input
                  type="number"
                  value={incomeData.net_profit}
                  onChange={(e) => setIncomeData({ ...incomeData, net_profit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Balance Sheet Form */}
        {activeTab === 'balance' && (
          <div className="space-y-6">
            {/* ASET LANCAR */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-600" />
                ASET LANCAR
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Kas</label>
                  <input type="number" value={balanceData.kas} onChange={(e) => setBalanceData({ ...balanceData, kas: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Deposito</label>
                  <input type="number" value={balanceData.deposito} onChange={(e) => setBalanceData({ ...balanceData, deposito: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Piutang Usaha</label>
                  <input type="number" value={balanceData.piutang_usaha} onChange={(e) => setBalanceData({ ...balanceData, piutang_usaha: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Piutang Lainnya</label>
                  <input type="number" value={balanceData.piutang_lainnya} onChange={(e) => setBalanceData({ ...balanceData, piutang_lainnya: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Uang Muka</label>
                  <input type="number" value={balanceData.uang_muka} onChange={(e) => setBalanceData({ ...balanceData, uang_muka: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Pekerjaan dlm Proses</label>
                  <input type="number" value={balanceData.pekerjaan_dalam_proses} onChange={(e) => setBalanceData({ ...balanceData, pekerjaan_dalam_proses: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Pjk Dibyr Dimuka</label>
                  <input type="number" value={balanceData.pajak_dibayar_dimuka} onChange={(e) => setBalanceData({ ...balanceData, pajak_dibayar_dimuka: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Beban Dibyr Dimuka</label>
                  <input type="number" value={balanceData.beban_dibayar_dimuka} onChange={(e) => setBalanceData({ ...balanceData, beban_dibayar_dimuka: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-300">
                <label className="block text-sm font-bold text-slate-900 mb-1">Aset Lancar</label>
                <input type="number" value={balanceData.aset_lancar} onChange={(e) => setBalanceData({ ...balanceData, aset_lancar: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold bg-white" placeholder="0" />
              </div>
            </div>

            {/* ASET TIDAK LANCAR */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                ASET TIDAK LANCAR
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Aset Tetap</label>
                  <input type="number" value={balanceData.aset_tetap} onChange={(e) => setBalanceData({ ...balanceData, aset_tetap: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Aset Tak Berwujud</label>
                  <input type="number" value={balanceData.aset_tak_berwujud} onChange={(e) => setBalanceData({ ...balanceData, aset_tak_berwujud: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Aset Lain</label>
                  <input type="number" value={balanceData.aset_lain} onChange={(e) => setBalanceData({ ...balanceData, aset_lain: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-300">
                <label className="block text-sm font-bold text-slate-900 mb-1">Aset Tak Lancar</label>
                <input type="number" value={balanceData.aset_tak_lancar} onChange={(e) => setBalanceData({ ...balanceData, aset_tak_lancar: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold bg-white" placeholder="0" />
              </div>
            </div>

            {/* TOTAL ASET */}
            <div className="border-2 border-indigo-500 rounded-lg p-4 bg-indigo-50">
              <label className="block text-base font-bold text-indigo-900 mb-2">TOTAL ASET</label>
              <input type="number" value={balanceData.total_aset} onChange={(e) => setBalanceData({ ...balanceData, total_aset: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border-2 border-indigo-400 rounded-lg focus:ring-2 focus:ring-indigo-600 text-base font-bold bg-white" placeholder="0" />
            </div>

            {/* KEWAJIBAN JANGKA PENDEK */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                KEWAJIBAN JANGKA PENDEK
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Utang Usaha</label>
                  <input type="number" value={balanceData.utang_usaha} onChange={(e) => setBalanceData({ ...balanceData, utang_usaha: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Utang Pajak</label>
                  <input type="number" value={balanceData.utang_pajak} onChange={(e) => setBalanceData({ ...balanceData, utang_pajak: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Utang Pembiayaan</label>
                  <input type="number" value={balanceData.utang_pembiayaan_pendek} onChange={(e) => setBalanceData({ ...balanceData, utang_pembiayaan_pendek: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Beban YMHD</label>
                  <input type="number" value={balanceData.beban_ymhd_pendek} onChange={(e) => setBalanceData({ ...balanceData, beban_ymhd_pendek: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Utang Bank (&lt; 1thn)</label>
                  <input type="number" value={balanceData.utang_bank_pendek} onChange={(e) => setBalanceData({ ...balanceData, utang_bank_pendek: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-300">
                <label className="block text-sm font-bold text-slate-900 mb-1">Jumlah Kwjbn J.Pendek</label>
                <input type="number" value={balanceData.jumlah_kewajiban_pendek} onChange={(e) => setBalanceData({ ...balanceData, jumlah_kewajiban_pendek: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold bg-white" placeholder="0" />
              </div>
            </div>

            {/* KEWAJIBAN JANGKA PANJANG */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                KEWAJIBAN JANGKA PANJANG
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Utang Pmg Saham</label>
                  <input type="number" value={balanceData.utang_pemg_saham} onChange={(e) => setBalanceData({ ...balanceData, utang_pemg_saham: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Beban YMHD</label>
                  <input type="number" value={balanceData.beban_ymhd_panjang} onChange={(e) => setBalanceData({ ...balanceData, beban_ymhd_panjang: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Utang Bank J.Pnjang</label>
                  <input type="number" value={balanceData.utang_bank_panjang} onChange={(e) => setBalanceData({ ...balanceData, utang_bank_panjang: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Utang Pembiayaan</label>
                  <input type="number" value={balanceData.utang_pembiayaan_panjang} onChange={(e) => setBalanceData({ ...balanceData, utang_pembiayaan_panjang: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Utang Lainnya</label>
                  <input type="number" value={balanceData.utang_lainnya} onChange={(e) => setBalanceData({ ...balanceData, utang_lainnya: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-300">
                <label className="block text-sm font-bold text-slate-900 mb-1">Jumlah Kwjbn J. Panjang</label>
                <input type="number" value={balanceData.jumlah_kewajiban_panjang} onChange={(e) => setBalanceData({ ...balanceData, jumlah_kewajiban_panjang: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold bg-white" placeholder="0" />
              </div>
            </div>

            {/* TOTAL KEWAJIBAN */}
            <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
              <label className="block text-base font-bold text-red-900 mb-2">JUMLAH KEWAJIBAN</label>
              <input type="number" value={balanceData.jumlah_kewajiban} onChange={(e) => setBalanceData({ ...balanceData, jumlah_kewajiban: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-600 text-base font-bold bg-white" placeholder="0" />
            </div>

            {/* EKUITAS */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                EKUITAS
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Modal Saham</label>
                  <input type="number" value={balanceData.modal_saham} onChange={(e) => setBalanceData({ ...balanceData, modal_saham: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Laba Ditahan Ditentukan</label>
                  <input type="number" value={balanceData.laba_ditahan_ditentukan} onChange={(e) => setBalanceData({ ...balanceData, laba_ditahan_ditentukan: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Laba Ditahan Blm Ditentukan</label>
                  <input type="number" value={balanceData.laba_ditahan_belum_ditentukan} onChange={(e) => setBalanceData({ ...balanceData, laba_ditahan_belum_ditentukan: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">L/R Tahun Berjalan</label>
                  <input type="number" value={balanceData.lr_tahun_berjalan} onChange={(e) => setBalanceData({ ...balanceData, lr_tahun_berjalan: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="0" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-300">
                <label className="block text-sm font-bold text-slate-900 mb-1">Jumlah Ekuitas</label>
                <input type="number" value={balanceData.jumlah_ekuitas} onChange={(e) => setBalanceData({ ...balanceData, jumlah_ekuitas: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold bg-white" placeholder="0" />
              </div>
            </div>

            {/* TOTAL KEWAJIBAN & EKUITAS */}
            <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-50">
              <label className="block text-base font-bold text-purple-900 mb-2">JUMLAH KEWAJIBAN & EKUITAS</label>
              <input type="number" value={balanceData.jumlah_kewajiban_ekuitas} onChange={(e) => setBalanceData({ ...balanceData, jumlah_kewajiban_ekuitas: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border-2 border-purple-400 rounded-lg focus:ring-2 focus:ring-purple-600 text-base font-bold bg-white" placeholder="0" />
            </div>

            {/* Balance Check */}
            {balanceData.total_aset > 0 && (
              <div className={cn("p-4 rounded-lg border-2", Math.abs(balanceData.total_aset - balanceData.jumlah_kewajiban_ekuitas) < 0.01 ? "bg-green-50 border-green-500" : "bg-red-50 border-red-500")}>
                <p className="text-sm font-bold flex items-center gap-2">
                  {Math.abs(balanceData.total_aset - balanceData.jumlah_kewajiban_ekuitas) < 0.01 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-green-900">Neraca seimbang! Total Aset = Jumlah Kewajiban & Ekuitas</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-red-900">Neraca tidak seimbang! Total Aset harus sama dengan Jumlah Kewajiban & Ekuitas</span>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cash Flow Form */}
        {activeTab === 'cashflow' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Arus Kas Operasi</label>
                <input
                  type="number"
                  value={cashflowData.operating_cash_flow}
                  onChange={(e) => setCashflowData({ ...cashflowData, operating_cash_flow: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Arus Kas Investasi</label>
                <input
                  type="number"
                  value={cashflowData.investing_cash_flow}
                  onChange={(e) => setCashflowData({ ...cashflowData, investing_cash_flow: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Arus Kas Pendanaan</label>
                <input
                  type="number"
                  value={cashflowData.financing_cash_flow}
                  onChange={(e) => setCashflowData({ ...cashflowData, financing_cash_flow: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Arus Kas Bersih</label>
                <input
                  type="number"
                  value={cashflowData.net_cash_flow}
                  onChange={(e) => setCashflowData({ ...cashflowData, net_cash_flow: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Upload File Option */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">Atau Upload File Excel/CSV</label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedCompany}
            className={cn(
              "px-6 py-3 rounded-xl font-bold transition-all shadow-lg",
              isSubmitting || !selectedCompany
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
            )}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </button>
        </div>
      </Card>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const CompanyModal = ({ isOpen, onClose, onSave, company }: any) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (company) {
      setFormData({
        id: company.id || '',
        name: company.name || '',
        industry: company.industry || '',
        currency: company.currency || 'USD',
        tax_rate: company.tax_rate || 0,
        status: company.status || 'Active',
        thresholds: company.thresholds || { liquidity_drop: 20, der_rise: 15, margin_drop_months: 3 },
        ideal_ratios: company.ideal_ratios || { current_ratio: 1.5, quick_ratio: 1, der: 2, npm: 10 }
      });
    } else {
      setFormData({
        id: '',
        name: '',
        industry: '',
        currency: 'USD',
        tax_rate: 0,
        status: 'Active',
        thresholds: { liquidity_drop: 20, der_rise: 15, margin_drop_months: 3 },
        ideal_ratios: { current_ratio: 1.5, quick_ratio: 1, der: 2, npm: 10 }
      });
    }
  }, [company]);

  const updateThreshold = (key: string, val: number) => {
    setFormData({ ...formData, thresholds: { ...formData.thresholds, [key]: val } });
  };

  const updateIdeal = (key: string, val: number) => {
    setFormData({ ...formData, ideal_ratios: { ...formData.ideal_ratios, [key]: val } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={company?.id ? "Edit Company Profile" : "Create New Company"}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Company Name</label>
            <input 
              type="text" 
              value={formData.name || ''} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          {!company?.id && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID (Short Code)</label>
              <input 
                type="text" 
                value={formData.id || ''} 
                onChange={e => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                placeholder="e.g. ASI"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}
          <div className={company?.id ? "col-span-2" : ""}>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Industry</label>
            <input 
              type="text" 
              value={formData.industry || ''} 
              onChange={e => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Currency</label>
            <input 
              type="text" 
              value={formData.currency || 'USD'} 
              onChange={e => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tax Rate (%)</label>
            <input 
              type="number" 
              value={formData.tax_rate || 0} 
              onChange={e => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
            <select 
              value={formData.status || 'Active'} 
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-indigo-500" />
            Custom Risk Thresholds
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Liquidity Drop (%)</label>
              <input 
                type="number" 
                value={formData.thresholds?.liquidity_drop || 0} 
                onChange={e => updateThreshold('liquidity_drop', parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">DER Rise (%)</label>
              <input 
                type="number" 
                value={formData.thresholds?.der_rise || 0} 
                onChange={e => updateThreshold('der_rise', parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Ideal Financial Ratios
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Current Ratio</label>
              <input 
                type="number" 
                step="0.1"
                value={formData.ideal_ratios?.current_ratio || 0} 
                onChange={e => updateIdeal('current_ratio', parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Quick Ratio</label>
              <input 
                type="number" 
                step="0.1"
                value={formData.ideal_ratios?.quick_ratio || 0} 
                onChange={e => updateIdeal('quick_ratio', parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Max DER</label>
              <input 
                type="number" 
                step="0.1"
                value={formData.ideal_ratios?.der || 0} 
                onChange={e => updateIdeal('der', parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Min NPM (%)</label>
              <input 
                type="number" 
                value={formData.ideal_ratios?.npm || 0} 
                onChange={e => updateIdeal('npm', parseFloat(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSave(formData)}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4"
        >
          {company?.id ? "Update Company" : "Create Company"}
        </button>
      </div>
    </Modal>
  );
};

const UserModal = ({ isOpen, onClose, onSave, user, roles, companies }: any) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id || '',
        username: user.username || '',
        password: '',
        role_id: user.role_id || '',
        status: user.status || 'Active',
        company_ids: user.company_ids || []
      });
    } else {
      setFormData({
        id: '',
        username: '',
        password: '',
        role_id: '',
        status: 'Active',
        company_ids: []
      });
    }
  }, [user]);

  const toggleCompany = (id: string) => {
    const current = formData.company_ids || [];
    if (current.includes(id)) {
      setFormData({ ...formData, company_ids: current.filter((c: string) => c !== id) });
    } else {
      setFormData({ ...formData, company_ids: [...current, id] });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user?.id ? "Edit User Account" : "Create New User"}>
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Username</label>
          <input 
            type="text" 
            value={formData.username || ''} 
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        {!user?.id && (
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Password</label>
            <input 
              type="password" 
              value={formData.password || ''} 
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</label>
            <select 
              value={formData.role_id || ''} 
              onChange={e => setFormData({ ...formData, role_id: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Select Role</option>
              {roles.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</label>
            <select 
              value={formData.status || 'Active'} 
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Locked">Locked</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            Company Access Assignment
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {companies.map((c: any) => (
              <label key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-xs font-bold text-slate-700">{c.name}</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.company_ids?.includes(c.id)}
                  onChange={() => toggleCompany(c.id)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={() => onSave(formData)}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4"
        >
          {user?.id ? "Update User" : "Create User"}
        </button>
      </div>
    </Modal>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'consolidated' | 'thresholds' | 'audit' | 'input' | 'parameters' | 'companies' | 'users' | 'upload'>('dashboard');
  const [showWarnings, setShowWarnings] = useState(true);
  const [parameters, setParameters] = useState<{key: string, value: string}[]>([]);
  const [newParam, setNewParam] = useState({ key: '', value: '' });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('both');
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '2025-01-01', // Start from 2025
    end: '2026-02-28'    // Current month
  });
  const [ratios, setRatios] = useState<FinancialRatio[]>([]);
  const [allRatios, setAllRatios] = useState<FinancialRatio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);

  // Management State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  useEffect(() => {
    const fetchManagementData = async () => {
      try {
        if (activeTab === 'parameters') {
          const res = await fetch('/api/parameters');
          if (res.ok) setParameters(await res.json());
        }
        if (activeTab === 'companies') {
          const res = await fetch('/api/companies');
          if (res.ok) setCompanies(await res.json());
        }
        if (activeTab === 'users') {
          const [uRes, rRes] = await Promise.all([fetch('/api/users'), fetch('/api/roles')]);
          if (uRes.ok) setUsers(await uRes.json());
          if (rRes.ok) setRoles(await rRes.json());
        }
      } catch (e) {
        console.error("Management data fetch failed", e);
      }
    };
    fetchManagementData();
  }, [activeTab]);

  const handleSaveParam = async () => {
    if (!newParam.key || !newParam.value) return;
    await fetch('/api/parameters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newParam)
    });
    setNewParam({ key: '', value: '' });
    fetch('/api/parameters').then(res => res.json()).then(setParameters);
  };

  const handleSaveCompany = async (company: Partial<Company>) => {
    const method = company.id ? 'PUT' : 'POST';
    const url = company.id ? `/api/companies/${company.id}` : '/api/companies';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(company)
    });
    
    setIsCompanyModalOpen(false);
    setEditingCompany(null);
    fetch('/api/companies').then(res => res.json()).then(setCompanies);
  };

  const handleSaveUser = async (user: Partial<User>) => {
    const method = user.id ? 'PUT' : 'POST';
    const url = user.id ? `/api/users/${user.id}` : '/api/users';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    
    setIsUserModalOpen(false);
    setEditingUser(null);
    const [uRes, rRes] = await Promise.all([fetch('/api/users'), fetch('/api/roles')]);
    setUsers(await uRes.json());
    setRoles(await rRes.json());
  };

  const handleTogglePermission = async (roleId: string, permissionId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const newPermissions = role.permissions.includes(permissionId)
      ? role.permissions.filter(p => p !== permissionId)
      : [...role.permissions, permissionId];

    await fetch(`/api/roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: newPermissions })
    });

    const rRes = await fetch('/api/roles');
    setRoles(await rRes.json());
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, ratioRes] = await Promise.all([
          fetch('/api/companies'),
          fetch(`/api/ratios?companyId=${selectedCompany}`)
        ]);
        
        if (!compRes.ok || !ratioRes.ok) {
          throw new Error(`HTTP error! status: ${compRes.status} / ${ratioRes.status}`);
        }

        const compData = await compRes.json();
        const ratioData = await ratioRes.json();
        console.log("Fetched ratios:", ratioData);
        setCompanies(compData);
        setAllRatios(ratioData);
        setRatios(ratioData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCompany]);

  // Filter ratios based on date range and period type
  useEffect(() => {
    if (allRatios.length === 0) return;

    setFiltering(true);
    
    // Simulate filtering delay for better UX
    const timer = setTimeout(() => {
      const filtered = allRatios.filter((ratio) => {
        const ratioPeriod = new Date(ratio.period + '-01');
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        return ratioPeriod >= startDate && ratioPeriod <= endDate;
      });

      setRatios(filtered);
      setFiltering(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [dateRange, allRatios]);

  const getHealthStatus = (key: string, value: number) => {
    const t = HEALTH_THRESHOLDS[key as keyof typeof HEALTH_THRESHOLDS];
    if (!t) return 'Moderate';
    
    if (key === 'der') {
      if (value <= t.healthy) return 'Healthy';
      if (value <= t.moderate) return 'Moderate';
      return 'Risky';
    } else {
      if (value >= t.healthy) return 'Healthy';
      if (value >= t.moderate) return 'Moderate';
      return 'Risky';
    }
  };

  const getLatestRatios = (companyId: string) => {
    return ratios.find(r => r.company_id === companyId);
  };

  const getYoYGrowth = (companyId: string, key: string): string => {
    const companyRatios = ratios.filter(r => r.company_id === companyId);
    if (companyRatios.length < 13) return "0";
    const current = companyRatios[0][key as keyof FinancialRatio] as number;
    const lastYear = companyRatios[12][key as keyof FinancialRatio] as number;
    if (!lastYear) return "0";
    return (((current - lastYear) / lastYear) * 100).toFixed(1);
  };

  // Get company color dynamically
  const getCompanyColor = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company?.color || '#6366f1';
  };

  const asiLatest = getLatestRatios('ASI');
  const tsiLatest = getLatestRatios('TSI');

  const chartData = ratios.reduce((acc: any[], curr) => {
    const existing = acc.find(a => a.period === curr.period);
    if (existing) {
      existing[`${curr.company_id}_revenue`] = curr.revenue;
      existing[`${curr.company_id}_profit`] = curr.net_profit;
      existing[`${curr.company_id}_roe`] = curr.roe;
      existing[`${curr.company_id}_roa`] = curr.roa;
      existing[`${curr.company_id}_npm`] = curr.npm;
      existing[`${curr.company_id}_der`] = curr.der;
      existing[`${curr.company_id}_current`] = curr.current_ratio;
    } else {
      acc.push({
        period: curr.period,
        [`${curr.company_id}_revenue`]: curr.revenue,
        [`${curr.company_id}_profit`]: curr.net_profit,
        [`${curr.company_id}_roe`]: curr.roe,
        [`${curr.company_id}_roa`]: curr.roa,
        [`${curr.company_id}_npm`]: curr.npm,
        [`${curr.company_id}_der`]: curr.der,
        [`${curr.company_id}_current`]: curr.current_ratio,
      });
    }
    return acc;
  }, []).sort((a, b) => a.period.localeCompare(b.period));

  const performanceData = [
    { subject: 'Profitability', ASI: 85, TSI: 70, fullMark: 100 },
    { subject: 'Liquidity', ASI: 65, TSI: 80, fullMark: 100 },
    { subject: 'Solvency', ASI: 90, TSI: 75, fullMark: 100 },
    { subject: 'Efficiency', ASI: 70, TSI: 85, fullMark: 100 },
    { subject: 'Growth', ASI: 80, TSI: 90, fullMark: 100 },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <Activity className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-600">Loading financial data...</p>
      </div>
    </div>
  );

  const hasFilteredData = ratios.length > 0;

  const handleResetFilters = () => {
    setDateRange({
      start: '2025-01-01',
      end: '2026-02-28'
    });
    setSelectedCompany('both');
    setPeriodType('monthly');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">FinScope</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'consolidated', label: 'Consolidated Report', icon: Layers },
            { id: 'thresholds', label: 'Thresholds', icon: Settings },
            { id: 'audit', label: 'Audit Trail', icon: Shield },
            { id: 'input', label: 'Input Data', icon: FileText },
            { id: 'companies', label: 'Companies', icon: Building2 },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'upload', label: 'Data Upload', icon: Upload },
            { id: 'parameters', label: 'System Config', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === item.id 
                  ? "text-slate-900 bg-slate-100" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Nav */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900">Financial Analysis</h1>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Building2 className="w-3.5 h-3.5" />
              Multi-Company View
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search metrics..." 
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-slate-200 rounded-lg text-sm w-64 transition-all"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Calendar className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300" />
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {activeTab === 'dashboard' && (
            <>
              {/* Early Warning Summary - Top Placement */}
              <EarlyWarningSummary 
                ratios={ratios} 
                companies={companies}
                companyId={selectedCompany} 
                isVisible={showWarnings} 
                onToggle={() => setShowWarnings(!showWarnings)} 
              />

              {/* Filter Bar - Moved to top */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex bg-slate-100 rounded-xl p-1">
                    {['ASI', 'TSI', 'SUB3', 'SUB4', 'SUB5', 'both'].map((c) => (
                      <button 
                        key={c}
                        onClick={() => setSelectedCompany(c)}
                        className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider", selectedCompany === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                      >
                        {c === 'both' ? 'ALL' : c}
                      </button>
                    ))}
                  </div>

                  <div className="flex bg-slate-100 rounded-xl p-1">
                    {(['monthly', 'quarterly', 'yearly'] as PeriodType[]).map((p) => (
                      <button 
                        key={p}
                        onClick={() => setPeriodType(p)}
                        className={cn("px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all tracking-wider", periodType === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400">to</span>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <QuickDatePresets 
                    onSelect={(start, end) => setDateRange({ start, end })} 
                  />

                  {(dateRange.start !== '2025-01-01' || dateRange.end !== '2026-02-28') && (
                    <button
                      onClick={handleResetFilters}
                      className="flex items-center gap-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all border border-rose-100"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                    {filtering ? (
                      <Activity className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <span className="text-xs font-bold text-indigo-700">
                      {filtering ? 'Filtering...' : `${ratios.length} records`}
                    </span>
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                    <Filter className="w-3.5 h-3.5" />
                    Filters
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
              </div>

              {!hasFilteredData ? (
                <EmptyState onReset={handleResetFilters} />
              ) : (
                <>
                  {/* Section 1: Strategic Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  {selectedCompany !== 'both' ? (
                    <CompanyOverview 
                      company={companies.find(c => c.id === selectedCompany) || { name: selectedCompany }}
                      latest={selectedCompany === 'ASI' ? asiLatest : tsiLatest}
                      otherLatest={selectedCompany === 'ASI' ? tsiLatest : asiLatest}
                      yoyRevenue={getYoYGrowth(selectedCompany, 'revenue')}
                      yoyProfit={getYoYGrowth(selectedCompany, 'net_profit')}
                    />
                  ) : (
                    <Card className="h-full flex flex-col justify-center items-center text-center p-12 bg-slate-900 text-white border-none">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6">
                        <Layers className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h2 className="text-3xl font-black tracking-tight mb-2">Consolidated Enterprise View</h2>
                      <p className="text-slate-400 max-w-md mx-auto">Aggregate performance monitoring across all corporate entities. Select a specific company for deep-dive analytics.</p>
                    </Card>
                  )}
                </div>
                <div className="lg:col-span-1">
                  <HealthScoreGauge score={selectedCompany === 'TSI' ? 72 : 84} />
                </div>
              </div>

              {/* Section 2: Risk & Governance */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  {selectedCompany === 'both' ? (
                    <PerformanceRanking asi={asiLatest} tsi={tsiLatest} />
                  ) : (
                    <RiskAlertWidget score={selectedCompany === 'TSI' ? 72 : 84} />
                  )}
                </div>
                <div className="lg:col-span-1">
                  {selectedCompany === 'both' ? (
                    <RiskAlertWidget score={84} />
                  ) : (
                    <Card className="h-full flex flex-col justify-center items-center text-center p-8 bg-slate-50 border-dashed border-2 border-slate-200">
                      <Info className="w-8 h-8 text-slate-300 mb-4" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contextual Risk Data</p>
                      <p className="text-[10px] text-slate-400 mt-2">Select 'Both' to enable comparative performance ranking.</p>
                    </Card>
                  )}
                </div>
              </div>

              {/* Section 3: KPI Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {['roa', 'roe', 'npm', 'der', 'current_ratio'].map((kpi) => (
                  <Card key={kpi} className="p-0 hover:border-indigo-200 transition-colors">
                    <div className="p-6 space-y-6">
                      {companies.filter(c => c.status === 'Active' && (selectedCompany === 'both' || c.id === selectedCompany)).map((company, idx) => {
                        const latest = getLatestRatios(company.id);
                        if (!latest) return null;
                        return (
                          <div key={company.id} className={cn(idx > 0 && "pt-6 border-t border-slate-100")}>
                            <KPICard 
                              label={kpi.toUpperCase().replace('_', ' ')}
                              value={latest[kpi as keyof FinancialRatio]}
                              unit={kpi === 'der' || kpi === 'current_ratio' ? 'x' : '%'}
                              trend={parseFloat(getYoYGrowth(company.id, kpi)) >= 0 ? 'up' : 'down'}
                              yoy={getYoYGrowth(company.id, kpi)}
                              status={getHealthStatus(kpi, latest[kpi as keyof FinancialRatio] as number)}
                              companyName={company.name}
                              companyColor={company.color}
                              metricKey={kpi}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Section 4: Growth & Profitability Dynamics */}
              <GrowthTrends data={chartData} companyId={selectedCompany} />

              {/* Section 5: Sustainability & Efficiency */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <WaterfallChart latest={selectedCompany === 'TSI' ? tsiLatest : asiLatest} />
                <CashFlowPanel data={chartData} companyId={selectedCompany} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TrendAnalytics data={chartData} companyId={selectedCompany} />
                <FinancialBreakdown latest={selectedCompany === 'TSI' ? tsiLatest : asiLatest} />
              </div>

              {/* Section 6: Operational Deep-Dive */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card title="Multi-Dimensional Efficiency Radar" subtitle="Strategic performance mapping" className="lg:col-span-1">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={8} />
                        <Radar name="ASI" dataKey="ASI" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                        <Radar name="TSI" dataKey="TSI" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.5} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="Executive Ratio Audit" subtitle="Full operational status breakdown" className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['roa', 'roe', 'npm', 'der', 'current_ratio', 'quick_ratio', 'cash_ratio', 'ocf_ratio'].map((kpi) => {
                      const val = (selectedCompany === 'TSI' ? tsiLatest : asiLatest)?.[kpi as keyof FinancialRatio] as number;
                      const status = getHealthStatus(kpi, val);
                      return (
                        <div key={kpi} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                          <div className="flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl", 
                              status === 'Healthy' ? "bg-emerald-100 text-emerald-600" : 
                              status === 'Risky' ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                            )}>
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{kpi.replace('_', ' ')}</p>
                              <p className="text-[10px] text-slate-500 font-medium">Target: {HEALTH_THRESHOLDS[kpi as keyof typeof HEALTH_THRESHOLDS].healthy}{kpi === 'der' || kpi === 'current_ratio' ? 'x' : '%'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-slate-900 tracking-tighter">{val?.toFixed(2)}{kpi === 'der' || kpi === 'current_ratio' ? 'x' : '%'}</p>
                            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider",
                              status === 'Healthy' ? "bg-emerald-500 text-white" : 
                              status === 'Risky' ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                            )}>
                              {status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Historical Financial Table */}
              <Card title="Historical Financial Data" subtitle="Detailed period-over-period breakdown">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-4 font-semibold text-slate-500">Period</th>
                        <th className="pb-4 font-semibold text-slate-500">Company</th>
                        <th className="pb-4 font-semibold text-slate-500 text-right">Revenue</th>
                        <th className="pb-4 font-semibold text-slate-500 text-right">Net Profit</th>
                        <th className="pb-4 font-semibold text-slate-500 text-right">ROE</th>
                        <th className="pb-4 font-semibold text-slate-500 text-right">DER</th>
                        <th className="pb-4 font-semibold text-slate-500 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {ratios.slice(0, 10).map((row, i) => (
                        <tr key={i} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4 font-medium text-slate-900">{row.period}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: row.company_id === 'ASI' ? '#0f172a' : '#94a3b8' }} />
                              <span className="text-xs font-semibold text-slate-600">{row.company_id}</span>
                            </div>
                          </td>
                          <td className="py-4 text-right font-mono text-xs">{formatRupiah(row.revenue, false)}</td>
                          <td className="py-4 text-right font-mono text-xs">{formatRupiah(row.net_profit, false)}</td>
                          <td className="py-4 text-right font-mono text-xs">{row.roe.toFixed(2)}%</td>
                          <td className="py-4 text-right font-mono text-xs">{row.der.toFixed(2)}x</td>
                          <td className="py-4 text-right">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                              getHealthStatus('roe', row.roe) === 'Healthy' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            )}>
                              {getHealthStatus('roe', row.roe)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xs text-slate-400">Showing top 10 historical records</p>
                  <button className="text-xs font-bold text-slate-900 hover:underline">View All Records</button>
                </div>
              </Card>
                </>
              )}
            </>
          )}

          {activeTab === 'consolidated' && (
            <ConsolidatedReport companies={companies} ratios={ratios} />
          )}

          {activeTab === 'thresholds' && (
            <ThresholdConfiguration companies={companies} onSave={handleSaveCompany} />
          )}

          {activeTab === 'audit' && (
            <AuditTrailViewer />
          )}

          {activeTab === 'input' && (
            <ManualDataInput companies={companies} />
          )}

          {activeTab === 'companies' && (
            <CompanyManagement 
              companies={companies} 
              onCreate={() => { setEditingCompany({}); setIsCompanyModalOpen(true); }}
              onEdit={(c: any) => { setEditingCompany(c); setIsCompanyModalOpen(true); }}
            />
          )}

          {activeTab === 'users' && (
            <UserManagement 
              users={users} 
              roles={roles}
              onCreate={() => { setEditingUser({}); setIsUserModalOpen(true); }}
              onEdit={(u: any) => { setEditingUser(u); setIsUserModalOpen(true); }}
              onTogglePermission={handleTogglePermission}
            />
          )}

          {activeTab === 'upload' && <DataUpload companies={companies} />}

          {activeTab === 'parameters' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">System Parameters</h2>
                  <p className="text-slate-500 text-sm">Manage global settings and thresholds</p>
                </div>
                <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold">
                  Export Settings
                </button>
              </div>

              <Card title="Add New Parameter">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Key</label>
                    <input 
                      type="text" 
                      value={newParam.key}
                      onChange={(e) => setNewParam({ ...newParam, key: e.target.value })}
                      placeholder="e.g. ROA_HEALTHY_THRESHOLD"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Value</label>
                    <input 
                      type="text" 
                      value={newParam.value}
                      onChange={(e) => setNewParam({ ...newParam, value: e.target.value })}
                      placeholder="e.g. 5.0"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={handleSaveParam}
                      className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold h-[38px]"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </Card>

              <Card title="Active Parameters">
                <div className="divide-y divide-slate-100">
                  {parameters.length === 0 ? (
                    <p className="py-8 text-center text-slate-400 text-sm italic">No parameters defined yet.</p>
                  ) : (
                    parameters.map((p) => (
                      <div key={p.key} className="py-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-mono font-bold text-slate-700">{p.key}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Last updated: {format(new Date(), 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-slate-100 rounded-md text-sm font-mono font-semibold text-slate-900">
                            {p.value}
                          </span>
                          <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
      <CompanyModal 
        isOpen={isCompanyModalOpen} 
        onClose={() => setIsCompanyModalOpen(false)} 
        onSave={handleSaveCompany} 
        company={editingCompany} 
      />
      <UserModal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        onSave={handleSaveUser} 
        user={editingUser} 
        roles={roles} 
        companies={companies}
      />
    </div>
  );
}



