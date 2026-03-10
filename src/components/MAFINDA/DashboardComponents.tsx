import React, { useState, useEffect } from 'react';
import { 
  Wallet, Target, TrendingUp, AlertCircle, CheckCircle2, 
  ArrowUpRight, ArrowDownRight, Activity, PieChart as PieChartIcon,
  BarChart3, DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadialBarChart, RadialBar
} from 'recharts';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import { formatRupiah } from '../../utils/format';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: any;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, subtitle, icon: Icon, action }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden", className)}
  >
    {(title || Icon) && (
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            {title && <h3 className="text-sm font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
    )}
    <div className="p-6">{children}</div>
  </motion.div>
);

// Dashboard 1: Cash Position with Enhanced Visuals
export const Dashboard1CashPosition = ({ companyId }: { companyId: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/cash-position?companyId=${companyId}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, [companyId]);

  if (loading) {
    return (
      <Card title="Posisi Kas Akhir" subtitle="Real-time cash position monitoring" icon={Wallet}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Card>
    );
  }

  const cashPosition = data?.cashPosition || 0;
  const isPositive = cashPosition >= 0;

  return (
    <Card 
      title="Posisi Kas Akhir" 
      subtitle="Real-time cash position monitoring" 
      icon={Wallet}
      action={
        <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Live
        </button>
      }
    >
      <div className="space-y-6">
        {/* Main Cash Position Display */}
        <div className="relative p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
          <div className="relative">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Cash Position</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl font-black text-white tracking-tight">{formatRupiah(Math.abs(cashPosition))}</h2>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                isPositive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              )}>
                {isPositive ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3" />
              Last Updated: {data?.lastUpdated ? format(new Date(data.lastUpdated), 'dd MMM yyyy HH:mm') : 'N/A'}
            </p>
          </div>
        </div>

        {/* Weekly Breakdown */}
        {data?.weeklyBreakdown && data.weeklyBreakdown.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Weekly Cash Flow</h4>
              <span className="text-xs text-slate-500">{data.weeklyBreakdown.length} entries</span>
            </div>
            
            <div className="grid gap-3">
              {data.weeklyBreakdown.slice(0, 5).map((item: any, idx: number) => {
                const netFlow = item.cash_in - item.cash_out;
                const isPositiveFlow = netFlow >= 0;
                
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center group-hover:border-indigo-300 transition-colors">
                          <span className="text-sm font-black text-slate-700">{item.week}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.project_name}</p>
                          <p className="text-xs text-slate-500">{item.division_name} • {item.period}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        isPositiveFlow ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {isPositiveFlow ? '+' : ''}{formatRupiah(netFlow, false)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Revenue</p>
                        <p className="text-sm font-bold text-slate-900">{formatRupiah(item.revenue, false)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600 mb-1">Cash In</p>
                        <p className="text-sm font-bold text-emerald-600">{formatRupiah(item.cash_in, false)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-rose-600 mb-1">Cash Out</p>
                        <p className="text-sm font-bold text-rose-600">{formatRupiah(item.cash_out, false)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
