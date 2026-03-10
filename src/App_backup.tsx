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
  DollarSign,
  Target
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
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
      <Card className="p-0 h-full">
        <div className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 truncate">{company.name}</h2>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-full border border-indigo-100 uppercase tracking-wider shrink-0">
                  Strategic
                </span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100 shrink-0">
                Active
              </span>
            </div>
            <p className="text-slate-500 text-xs mb-4">Industrial Services â€¢ Est. 2010 â€¢ Jakarta, ID</p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Assets</p>
                    <InfoTooltip title={METRIC_DESCRIPTIONS.total_assets.title} description={METRIC_DESCRIPTIONS.total_assets.description} />
                  </div>
                  <p className="text-base font-bold text-slate-900">{formatRupiah(latest.total_assets || 0)}</p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider">Current</p>
                    <InfoTooltip title={METRIC_DESCRIPTIONS.current_assets.title} description={METRIC_DESCRIPTIONS.current_assets.description} />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">{formatRupiah(latest.current_assets || 0)}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Equity</p>
                    <InfoTooltip title={METRIC_DESCRIPTIONS.total_equity.title} description={METRIC_DESCRIPTIONS.total_equity.description} />
                  </div>
