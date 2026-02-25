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
  AlertTriangle
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

import { Company, FinancialRatio, PeriodType, User, Role } from './types';
import { HEALTH_THRESHOLDS } from './constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Card = ({ children, className, title, subtitle, icon: Icon }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden", className)}
  >
    {(title || Icon) && (
      <div className="px-6 py-4 border-bottom border-slate-100 flex items-center justify-between">
        <div>
          {title && <h3 className="text-sm font-semibold text-slate-900">{title}</h3>}
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Assets</p>
                <p className="text-lg font-bold text-slate-900">${(latest.total_assets / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Equity</p>
                <p className="text-lg font-bold text-slate-900">${(latest.total_equity / 1000000).toFixed(1)}M</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Liabilities</p>
                <p className="text-lg font-bold text-slate-900">${(latest.total_liabilities / 1000000).toFixed(1)}M</p>
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
            <h3 className="text-sm font-bold opacity-70">Annual Growth</h3>
            <TrendingUp className="w-4 h-4 opacity-50" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm font-medium">Revenue Growth</span>
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
                <span className="text-sm font-medium">Profit Growth</span>
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
    <Card title="Strategic Performance Index" subtitle="Aggregate corporate health metric" icon={ShieldCheck}>
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
            { label: 'Profitability', val: 85, color: 'bg-indigo-500' },
            { label: 'Liquidity', val: 70, color: 'bg-emerald-500' },
            { label: 'Solvency', val: 90, color: 'bg-blue-500' },
            { label: 'Efficiency', val: 75, color: 'bg-violet-500' },
          ].map((dim) => (
            <div key={dim.label} className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                <span>{dim.label}</span>
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

const KPICard = ({ label, value, unit = "%", trend, yoy, delta, status, companyName, companyColor }: any) => {
  const isHealthy = status === 'Healthy';
  const isRisky = status === 'Risky';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: companyColor }} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{companyName}</span>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
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
        </div>
        {delta !== undefined && (
          <div className="text-[10px] text-slate-400 font-medium">
            Δ vs Other: <span className={cn(delta >= 0 ? "text-emerald-600" : "text-rose-600")}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
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
      <Card title="Revenue & Profitability Dynamics" subtitle="Strategic growth trajectories" icon={TrendingUp}>
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
                <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
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
      
      <Card title="Operational Efficiency Ratios" subtitle="NPM & ROE performance" icon={Activity}>
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
    <Card title="Value Creation Waterfall" subtitle="Revenue to Net Income bridge" icon={BarChart3}>
      <div className="h-[300px] w-full flex items-center justify-center">
        {latest ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(v: any) => `$${Math.abs(v).toLocaleString()}`} 
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
      <Card title="Asset Composition" subtitle="Current vs Non-current assets" icon={PieChartIcon}>
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
                <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-sm font-medium">No asset data available</div>
          )}
        </div>
      </Card>
      
      <Card title="Capital Structure" subtitle="Equity vs Debt ratio" icon={Wallet}>
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
                <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
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
    <Card title="Performance Leaderboard" subtitle="Comparative entity ranking by core metrics" icon={TrendingUp}>
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
    <Card title="Liquidity & Cash Sustainability" subtitle="Operational cash flow dynamics" icon={Wallet}>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={cfData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="period" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
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
    <Card title="Governance Risk Matrix" subtitle="Strategic risk exposure assessment" icon={ShieldCheck}>
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
    <Card title="Strategic Trend Forecasting" subtitle="Revenue trajectory analysis" icon={TrendingUp}>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="period" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'parameters' | 'companies' | 'users' | 'upload'>('dashboard');
  const [showWarnings, setShowWarnings] = useState(true);
  const [parameters, setParameters] = useState<{key: string, value: string}[]>([]);
  const [newParam, setNewParam] = useState({ key: '', value: '' });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('both');
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [ratios, setRatios] = useState<FinancialRatio[]>([]);
  const [loading, setLoading] = useState(true);

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
        setRatios(ratioData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCompany]);

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
    if (companyRatios.length < 13) return "0"; // Need at least 13 months for YoY
    const current = companyRatios[0][key as keyof FinancialRatio] as number;
    const lastYear = companyRatios[12][key as keyof FinancialRatio] as number;
    if (!lastYear) return "0";
    return (((current - lastYear) / lastYear) * 100).toFixed(1);
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

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

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

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-xl p-4 text-white">
            <p className="text-xs font-medium opacity-70 mb-1">Current Plan</p>
            <p className="text-sm font-bold mb-3">Enterprise Suite</p>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors">
              View Billing
            </button>
          </div>
        </div>
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

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-100 rounded-xl p-1">
                    {['ASI', 'TSI', 'both'].map((c) => (
                      <button 
                        key={c}
                        onClick={() => setSelectedCompany(c)}
                        className={cn("px-6 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-wider", selectedCompany === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  <div className="flex bg-slate-100 rounded-xl p-1">
                    {(['monthly', 'quarterly', 'yearly'] as PeriodType[]).map((p) => (
                      <button 
                        key={p}
                        onClick={() => setPeriodType(p)}
                        className={cn("px-6 py-2 text-xs font-bold rounded-lg capitalize transition-all tracking-wider", periodType === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                    <Filter className="w-3.5 h-3.5" />
                    Strategic Filters
                  </button>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    <Download className="w-3.5 h-3.5" />
                    Executive Report
                  </button>
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
                      {asiLatest && (selectedCompany === 'ASI' || selectedCompany === 'both') && (
                        <KPICard 
                          label={kpi.toUpperCase().replace('_', ' ')}
                          value={asiLatest[kpi as keyof FinancialRatio]}
                          unit={kpi === 'der' || kpi === 'current_ratio' ? 'x' : '%'}
                          trend={parseFloat(getYoYGrowth('ASI', kpi)) >= 0 ? 'up' : 'down'}
                          yoy={getYoYGrowth('ASI', kpi)}
                          status={getHealthStatus(kpi, asiLatest[kpi as keyof FinancialRatio] as number)}
                          companyName="ASI"
                          companyColor="#6366f1"
                          delta={selectedCompany === 'both' && tsiLatest ? (asiLatest[kpi as keyof FinancialRatio] as number) - (tsiLatest[kpi as keyof FinancialRatio] as number) : undefined}
                        />
                      )}
                      {(selectedCompany === 'TSI' || selectedCompany === 'both') && tsiLatest && (
                        <div className={cn("pt-6", selectedCompany === 'both' ? "border-t border-slate-100" : "")}>
                          <KPICard 
                            label={kpi.toUpperCase().replace('_', ' ')}
                            value={tsiLatest[kpi as keyof FinancialRatio]}
                            unit={kpi === 'der' || kpi === 'current_ratio' ? 'x' : '%'}
                            trend={parseFloat(getYoYGrowth('TSI', kpi)) >= 0 ? 'up' : 'down'}
                            yoy={getYoYGrowth('TSI', kpi)}
                            status={getHealthStatus(kpi, tsiLatest[kpi as keyof FinancialRatio] as number)}
                            companyName="TSI"
                            companyColor="#94a3b8"
                          />
                        </div>
                      )}
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
                          <td className="py-4 text-right font-mono text-xs">${row.revenue.toLocaleString()}</td>
                          <td className="py-4 text-right font-mono text-xs">${row.net_profit.toLocaleString()}</td>
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
