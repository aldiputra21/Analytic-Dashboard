import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  TrendingUp, 
  Building2,
  Calendar,
  Users,
  Settings,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Wallet,
  Target,
  FileText,
  Clock,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart as PieChartIcon,
  TrendingDown,
  Filter,
  Download,
  RefreshCw,
  Bell,
  Search,
  Menu,
  LogOut,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, subMonths } from 'date-fns';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to format currency in Rupiah
function formatRupiah(value: number, showMillion: boolean = true): string {
  if (showMillion && Math.abs(value) >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}M`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}

// Types
interface Company {
  id: string;
  name: string;
  code: string;
  color: string;
  industry: string;
}

interface Division {
  id: string;
  company_id: string;
  name: string;
}

interface Project {
  id: string;
  division_id: string;
  name: string;
  description: string;
}

interface WeeklyCashFlow {
  id: string;
  project_id: string;
  period: string;
  week: 'W1' | 'W2' | 'W3' | 'W4' | 'W5';
  revenue: number;
  cash_in: number;
  cash_out: number;
  status: 'pending_approval' | 'approved' | 'rejected';
  submitted_by_name?: string;
  approved_by_name?: string;
}

interface Target {
  id: string;
  project_id: string;
  period: string;
  revenue_target: number;
  cash_in_target: number;
  cash_out_target: number;
  status: 'pending_approval' | 'approved' | 'rejected';
}

// Enhanced Card Component
const Card = ({ children, className, title, subtitle, icon: Icon, action }: any) => (
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

// Stat Card Component
const StatCard = ({ label, value, change, trend, icon: Icon, color = 'indigo' }: any) => {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
    rose: 'from-rose-500 to-rose-600 shadow-rose-200',
    amber: 'from-amber-500 to-amber-600 shadow-amber-200',
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    violet: 'from-violet-500 to-violet-600 shadow-violet-200'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", colorClasses[color])}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
            trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
    </motion.div>
  );
};

// Dashboard 1: Enhanced Cash Position
const Dashboard1CashPosition = ({ companyId }: { companyId: string }) => {
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
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-slate-500 font-medium">Live</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Main Cash Position Display */}
        <div className="relative p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500 rounded-full blur-3xl opacity-10"></div>
          <div className="relative">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Cash Position</p>
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="text-5xl font-black text-white tracking-tight">{formatRupiah(Math.abs(cashPosition))}</h2>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                isPositive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              )}>
                {isPositive ? 'Surplus' : 'Deficit'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" />
                <span>Last Updated: {data?.lastUpdated ? format(new Date(data.lastUpdated), 'dd MMM yyyy HH:mm') : 'N/A'}</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3" />
                <span>{data?.weeklyBreakdown?.length || 0} Transactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Breakdown */}
        {data?.weeklyBreakdown && data.weeklyBreakdown.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Weekly Cash Flow Breakdown
              </h4>
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-medium">
                {data.weeklyBreakdown.length} entries
              </span>
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
                    transition={{ delay: idx * 0.05 }}
                    className="group p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
                            <span className="text-lg font-black text-white">{item.week}</span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.project_name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {item.division_name} • {item.period}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Net Flow</p>
                        <div className={cn(
                          "px-4 py-2 rounded-xl text-sm font-black shadow-sm",
                          isPositiveFlow 
                            ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200" 
                            : "bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700 border border-rose-200"
                        )}>
                          {isPositiveFlow ? '+' : ''}{formatRupiah(netFlow, false)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Revenue
                        </p>
                        <p className="text-sm font-bold text-slate-900">{formatRupiah(item.revenue, false)}</p>
                      </div>
                      <div className="text-center border-x border-slate-100">
                        <p className="text-xs text-emerald-600 mb-1 flex items-center justify-center gap-1">
                          <ArrowDownRight className="w-3 h-3" />
                          Cash In
                        </p>
                        <p className="text-sm font-bold text-emerald-600">{formatRupiah(item.cash_in, false)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-rose-600 mb-1 flex items-center justify-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          Cash Out
                        </p>
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

// Dashboard 4: Achievement Gauge with Advanced Speedometer
const Dashboard4AchievementGauge = ({ companyId, period }: { companyId: string; period: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/achievement-gauge?companyId=${companyId}&period=${period}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, [companyId, period]);

  if (loading) {
    return (
      <Card title="Overall Achievement" icon={Target}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Card>
    );
  }

  const achievement = data?.overallAchievement || 0;
  const colorZone = data?.colorZone || 'red';

  const gaugeData = [
    { name: 'Achievement', value: achievement, fill: colorZone === 'green' ? '#10b981' : colorZone === 'yellow' ? '#f59e0b' : '#f43f5e' }
  ];

  return (
    <Card 
      title="Overall Achievement Gauge" 
      subtitle="Aggregate performance across all divisions" 
      icon={Target}
      action={
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-bold",
          colorZone === 'green' ? "bg-emerald-100 text-emerald-700" : colorZone === 'yellow' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
        )}>
          {colorZone === 'green' ? 'Excellent' : colorZone === 'yellow' ? 'Good' : 'Needs Attention'}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Radial Gauge Chart */}
        <div className="relative">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="90%" 
                barSize={20}
                data={gaugeData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Center Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <h2 className="text-6xl font-black text-slate-900 tracking-tighter">{achievement.toFixed(0)}<span className="text-3xl text-slate-400">%</span></h2>
              </motion.div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">Achievement Rate</p>
            </div>
          </div>
        </div>

        {/* Achievement Zones Legend */}
        <div className="grid grid-cols-3 gap-3">
          <div className={cn(
            "p-3 rounded-xl border-2 transition-all",
            colorZone === 'red' ? "bg-rose-50 border-rose-300" : "bg-slate-50 border-slate-200"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs font-bold text-slate-700">Critical</span>
            </div>
            <p className="text-xs text-slate-500">0-25%</p>
          </div>
          <div className={cn(
            "p-3 rounded-xl border-2 transition-all",
            colorZone === 'yellow' ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs font-bold text-slate-700">Moderate</span>
            </div>
            <p className="text-xs text-slate-500">25-75%</p>
          </div>
          <div className={cn(
            "p-3 rounded-xl border-2 transition-all",
            colorZone === 'green' ? "bg-emerald-50 border-emerald-300" : "bg-slate-50 border-slate-200"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-bold text-slate-700">Excellent</span>
            </div>
            <p className="text-xs text-slate-500">75-100%</p>
          </div>
        </div>

        {/* Division Breakdown */}
        {data?.divisionBreakdown && data.divisionBreakdown.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Division Performance Breakdown
            </h4>
            
            {data.divisionBreakdown.map((div: any, idx: number) => {
              const achievementPercent = div.achievement;
              const barColor = achievementPercent > 75 ? 'bg-emerald-500' : achievementPercent > 25 ? 'bg-amber-500' : 'bg-rose-500';
              const bgColor = achievementPercent > 75 ? 'bg-emerald-50' : achievementPercent > 25 ? 'bg-amber-50' : 'bg-rose-50';
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn("p-4 rounded-xl border", bgColor, "border-slate-200")}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{div.divisionName}</p>
                        <p className="text-xs text-slate-500">Weight: {div.weight.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900">{achievementPercent.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(achievementPercent, 100)}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                      className={cn("h-full rounded-full", barColor)}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

// Dashboard 3: Department Performance with Enhanced Visuals
const Dashboard3DeptPerformance = ({ companyId, period }: { companyId: string; period: string }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/dept-performance?companyId=${companyId}&period=${period}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, [companyId, period]);

  if (loading) {
    return (
      <Card title="Department Performance" icon={TrendingUp}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Department Performance Ranking" 
      subtitle="Best and lowest performing divisions" 
      icon={TrendingUp}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performer */}
        {data?.highest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative p-6 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl overflow-hidden shadow-xl shadow-emerald-200"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-10"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Top Performer</p>
                  <h4 className="text-xl font-black text-white">{data.highest.divisionName}</h4>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-emerald-100 mb-1">Target</p>
                  <p className="text-sm font-bold text-white">{formatRupiah(data.highest.target)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-100 mb-1">Actual</p>
                  <p className="text-sm font-bold text-white">{formatRupiah(data.highest.actual)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-100 mb-1">Achievement</p>
                  <p className="text-3xl font-black text-white">{data.highest.achievement.toFixed(0)}%</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span className="text-xs text-white font-medium">Exceeding expectations</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Lowest Performer */}
        {data?.lowest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative p-6 bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 rounded-2xl overflow-hidden shadow-xl shadow-rose-200"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-10"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-100 uppercase tracking-wider">Needs Attention</p>
                  <h4 className="text-xl font-black text-white">{data.lowest.divisionName}</h4>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-rose-100 mb-1">Target</p>
                  <p className="text-sm font-bold text-white">{formatRupiah(data.lowest.target)}</p>
                </div>
                <div>
                  <p className="text-xs text-rose-100 mb-1">Actual</p>
                  <p className="text-sm font-bold text-white">{formatRupiah(data.lowest.actual)}</p>
                </div>
                <div>
                  <p className="text-xs text-rose-100 mb-1">Achievement</p>
                  <p className="text-3xl font-black text-white">{data.lowest.achievement.toFixed(0)}%</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <AlertCircle className="w-4 h-4 text-white" />
                <span className="text-xs text-white font-medium">Requires improvement plan</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
};

// Dashboard 7: Historical Cash Flow with Advanced Charts
const Dashboard7HistoricalCashFlow = ({ companyId, divisionId, projectId }: { companyId: string; divisionId?: string; projectId?: string }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'area' | 'bar'>('area');

  useEffect(() => {
    let url = `/api/dashboard/historical-cash-flow?companyId=${companyId}&months=12`;
    if (divisionId) url += `&divisionId=${divisionId}`;
    if (projectId) url += `&projectId=${projectId}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, [companyId, divisionId, projectId]);

  if (loading) {
    return (
      <Card title="Historical Cash Flow" icon={BarChart3}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Historical Cash Flow Analysis" 
      subtitle="12-month cash in/out trends with net flow" 
      icon={BarChart3}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('area')}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              viewMode === 'area' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Area
          </button>
          <button
            onClick={() => setViewMode('bar')}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
              viewMode === 'bar' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Bar
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-emerald-600 uppercase">Total Cash In</p>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {formatRupiah(data.reduce((sum, d) => sum + d.cash_in, 0))}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-rose-50 to-white rounded-xl border border-rose-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-xs font-bold text-rose-600 uppercase">Total Cash Out</p>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {formatRupiah(data.reduce((sum, d) => sum + d.cash_out, 0))}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xs font-bold text-indigo-600 uppercase">Net Cash Flow</p>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {formatRupiah(data.reduce((sum, d) => sum + d.net_cash_flow, 0))}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'area' ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorCashIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCashOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="period" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    stroke="#94a3b8"
                  />
                  <YAxis 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => formatRupiah(v)}
                    stroke="#94a3b8"
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'white'
                    }}
                    formatter={(value: any) => formatRupiah(value, false)}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '20px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cash_in" 
                    name="Cash In" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCashIn)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cash_out" 
                    name="Cash Out" 
                    stroke="#f43f5e" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCashOut)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="net_cash_flow" 
                    name="Net Flow" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1' }}
                  />
                </AreaChart>
              ) : (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="period" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    stroke="#94a3b8"
                  />
                  <YAxis 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => formatRupiah(v)}
                    stroke="#94a3b8"
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'white'
                    }}
                    formatter={(value: any) => formatRupiah(value, false)}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '20px' }}
                  />
                  <Bar dataKey="cash_in" name="Cash In" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="cash_out" name="Cash Out" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No historical data available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Enhanced Weekly Cash Flow Input Form
const WeeklyCashFlowForm = ({ projects, divisions, onSubmit }: { projects: Project[]; divisions: Division[]; onSubmit: () => void }) => {
  const [formData, setFormData] = useState({
    projectId: '',
    period: format(new Date(), 'yyyy-MM'),
    week: 'W1' as 'W1' | 'W2' | 'W3' | 'W4' | 'W5',
    revenue: 0,
    cashIn: 0,
    cashOut: 0,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};
    if (!formData.projectId) newErrors.projectId = 'Project is required';
    if (formData.revenue < 0) newErrors.revenue = 'Revenue must be positive';
    if (formData.cashIn < 0) newErrors.cashIn = 'Cash In must be positive';
    if (formData.cashOut < 0) newErrors.cashOut = 'Cash Out must be positive';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/cash-flow/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `cf_${Date.now()}`,
          projectId: formData.projectId,
          period: formData.period,
          week: formData.week,
          revenue: formData.revenue,
          cashIn: formData.cashIn,
          cashOut: formData.cashOut,
          notes: formData.notes,
          submittedBy: 1
        })
      });

      if (response.ok) {
        // Success animation
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3';
        successDiv.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-medium">Cash flow submitted for approval!</span>';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);

        setFormData({
          projectId: '',
          period: format(new Date(), 'yyyy-MM'),
          week: 'W1',
          revenue: 0,
          cashIn: 0,
          cashOut: 0,
          notes: ''
        });
        onSubmit();
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting cash flow data');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProject = projects.find(p => p.id === formData.projectId);
  const selectedDivision = selectedProject ? divisions.find(d => d.id === selectedProject.division_id) : null;

  return (
    <Card 
      title="Input Cash Flow Mingguan" 
      subtitle="Banking Officer - Weekly cash flow data entry" 
      icon={DollarSign}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selection with Visual Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Project *</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className={cn(
                "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all",
                errors.projectId ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"
              )}
              required
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.projectId && <p className="text-xs text-rose-600 mt-1">{errors.projectId}</p>}
            {selectedDivision && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Division: {selectedDivision.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Period *</label>
            <input
              type="month"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>

        {/* Week Selection with Visual Cards */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Week *</label>
          <div className="grid grid-cols-5 gap-3">
            {(['W1', 'W2', 'W3', 'W4', 'W5'] as const).map((week) => (
              <button
                key={week}
                type="button"
                onClick={() => setFormData({ ...formData, week })}
                className={cn(
                  "p-4 rounded-xl border-2 font-bold transition-all",
                  formData.week === week
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md"
                )}
              >
                {week}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Inputs with Icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Revenue *
            </label>
            <input
              type="number"
              value={formData.revenue || ''}
              onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })}
              className={cn(
                "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all",
                errors.revenue ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white"
              )}
              placeholder="0"
              required
            />
            {errors.revenue && <p className="text-xs text-rose-600 mt-1">{errors.revenue}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              Cash In *
            </label>
            <input
              type="number"
              value={formData.cashIn || ''}
              onChange={(e) => setFormData({ ...formData, cashIn: parseFloat(e.target.value) || 0 })}
              className={cn(
                "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all",
                errors.cashIn ? "border-rose-300 bg-rose-50" : "border-emerald-200 bg-emerald-50"
              )}
              placeholder="0"
              required
            />
            {errors.cashIn && <p className="text-xs text-rose-600 mt-1">{errors.cashIn}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-rose-700 mb-2 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              Cash Out *
            </label>
            <input
              type="number"
              value={formData.cashOut || ''}
              onChange={(e) => setFormData({ ...formData, cashOut: parseFloat(e.target.value) || 0 })}
              className={cn(
                "w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all",
                errors.cashOut ? "border-rose-300 bg-rose-50" : "border-rose-200 bg-rose-50"
              )}
              placeholder="0"
              required
            />
            {errors.cashOut && <p className="text-xs text-rose-600 mt-1">{errors.cashOut}</p>}
          </div>
        </div>

        {/* Net Flow Preview */}
        {(formData.cashIn > 0 || formData.cashOut > 0) && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Net Cash Flow:</span>
              <span className={cn(
                "text-2xl font-black",
                (formData.cashIn - formData.cashOut) >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {formatRupiah(formData.cashIn - formData.cashOut, false)}
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            rows={3}
            placeholder="Additional notes or comments..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setFormData({
              projectId: '',
              period: format(new Date(), 'yyyy-MM'),
              week: 'W1',
              revenue: 0,
              cashIn: 0,
              cashOut: 0,
              notes: ''
            })}
            className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all font-bold flex items-center gap-2",
              submitting && "opacity-50 cursor-not-allowed"
            )}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit for Approval
              </>
            )}
          </button>
        </div>
      </form>
    </Card>
  );
};

// Enhanced Approval Center
const ApprovalCenter = ({ onApprovalChange }: { onApprovalChange: () => void }) => {
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'cash_flow' | 'target'>('all');

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/approvals/pending');
      const data = await response.json();
      setPendingApprovals(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleApprove = async (id: string, type: string) => {
    try {
      const response = await fetch(`/api/approvals/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          approvedBy: 2,
          notes: 'Approved via dashboard'
        })
      });

      if (response.ok) {
        // Success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide-in';
        successDiv.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-medium">Data approved successfully!</span>';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);

        fetchPendingApprovals();
        onApprovalChange();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error approving data');
    }
  };

  const handleReject = async (id: string, type: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          rejectedBy: 2,
          reason
        })
      });

      if (response.ok) {
        // Warning notification
        const warningDiv = document.createElement('div');
        warningDiv.className = 'fixed top-4 right-4 bg-rose-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3';
        warningDiv.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="font-medium">Data rejected</span>';
        document.body.appendChild(warningDiv);
        setTimeout(() => warningDiv.remove(), 3000);

        fetchPendingApprovals();
        onApprovalChange();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error rejecting data');
    }
  };

  const filteredApprovals = filter === 'all' 
    ? pendingApprovals 
    : pendingApprovals.filter(a => a.type === filter);

  if (loading) {
    return (
      <Card title="Approval Center" icon={CheckCircle2}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Approval Center" 
      subtitle="Finance Analyst - Review and approve pending submissions" 
      icon={CheckCircle2}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPendingApprovals}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
          <div className="w-px h-6 bg-slate-200"></div>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
            {filteredApprovals.length} pending
          </span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filter === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            All ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setFilter('cash_flow')}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filter === 'cash_flow' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Cash Flow ({pendingApprovals.filter(a => a.type === 'cash_flow').length})
          </button>
          <button
            onClick={() => setFilter('target')}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filter === 'target' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Targets ({pendingApprovals.filter(a => a.type === 'target').length})
          </button>
        </div>

        {/* Approval List */}
        <div className="space-y-4">
          {filteredApprovals.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">All Clear!</h3>
              <p className="text-slate-500">No pending approvals at the moment</p>
            </div>
          ) : (
            filteredApprovals.map((approval, idx) => (
              <motion.div
                key={approval.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group p-6 border-2 border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-xl transition-all bg-gradient-to-br from-white to-slate-50"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                        approval.type === 'cash_flow' 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-purple-100 text-purple-700"
                      )}>
                        {approval.type === 'cash_flow' ? 'Cash Flow' : 'Target'}
                      </span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{approval.project_name}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {approval.division_name} • {approval.period} {approval.week || ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Submitted by</p>
                    <p className="text-sm font-bold text-slate-900">{approval.submitted_by_name}</p>
                    <p className="text-xs text-slate-400">{format(new Date(approval.submitted_at), 'dd MMM yyyy HH:mm')}</p>
                  </div>
                </div>

                {/* Data Display */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-5 bg-white rounded-xl border border-slate-100">
                  {approval.type === 'cash_flow' ? (
                    <>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-2 flex items-center justify-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Revenue
                        </p>
                        <p className="text-xl font-black text-slate-900">{formatRupiah(approval.revenue, false)}</p>
                      </div>
                      <div className="text-center border-x border-slate-100">
                        <p className="text-xs text-emerald-600 mb-2 flex items-center justify-center gap-1">
                          <ArrowDownRight className="w-3 h-3" />
                          Cash In
                        </p>
                        <p className="text-xl font-black text-emerald-600">{formatRupiah(approval.cash_in, false)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-rose-600 mb-2 flex items-center justify-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          Cash Out
                        </p>
                        <p className="text-xl font-black text-rose-600">{formatRupiah(approval.cash_out, false)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-2">Revenue Target</p>
                        <p className="text-xl font-black text-slate-900">{formatRupiah(approval.revenue_target, false)}</p>
                      </div>
                      <div className="text-center border-x border-slate-100">
                        <p className="text-xs text-emerald-600 mb-2">Cash In Target</p>
                        <p className="text-xl font-black text-emerald-600">{formatRupiah(approval.cash_in_target, false)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-rose-600 mb-2">Cash Out Target</p>
                        <p className="text-xl font-black text-rose-600">{formatRupiah(approval.cash_out_target, false)}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(approval.id, approval.type)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200 transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(approval.id, approval.type)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-xl hover:shadow-lg hover:shadow-rose-200 transition-all font-bold flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};

// Main MAFINDA App Component
export default function MafindaApp() {
  const [activeView, setActiveView] = useState<'dashboard' | 'input' | 'approval' | 'analytics'>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Fetch companies
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        if (data.length > 0) {
          setSelectedCompany(data[0].id);
        }
      })
      .catch(err => console.error('Error:', err));

    // Fetch divisions
    fetch('/api/divisions')
      .then(res => res.json())
      .then(data => setDivisions(data))
      .catch(err => console.error('Error:', err));

    // Fetch projects
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error('Error:', err));
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Branding */}
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 flex items-center justify-center shadow-xl shadow-indigo-200"
              >
                <LayoutDashboard className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">MAFINDA</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide">Management Finance Dashboard</p>
              </div>
            </div>

            {/* Company and Period Selection */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <Building2 className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent border-none text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleRefresh}
                className="p-3 hover:bg-slate-100 rounded-xl transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5 text-slate-600" />
              </button>

              <div className="w-px h-8 bg-slate-200"></div>

              <button className="p-3 hover:bg-slate-100 rounded-xl transition-colors relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">FA</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Finance Analyst</p>
                  <p className="text-xs text-slate-500">finance@mafinda.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-2 mt-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'input', label: 'Input Data', icon: FileText },
              { id: 'approval', label: 'Approval Center', icon: CheckCircle2 },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as any)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                    activeView === item.id
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Total Cash Position"
                  value={formatRupiah(125000000)}
                  change={12.5}
                  trend="up"
                  icon={Wallet}
                  color="indigo"
                />
                <StatCard
                  label="Monthly Revenue"
                  value={formatRupiah(450000000)}
                  change={8.3}
                  trend="up"
                  icon={TrendingUp}
                  color="emerald"
                />
                <StatCard
                  label="Achievement Rate"
                  value="87%"
                  change={5.2}
                  trend="up"
                  icon={Target}
                  color="violet"
                />
                <StatCard
                  label="Pending Approvals"
                  value="3"
                  icon={Clock}
                  color="amber"
                />
              </div>

              {/* Main Dashboards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" key={refreshKey}>
                <Dashboard1CashPosition companyId={selectedCompany} />
                <Dashboard4AchievementGauge companyId={selectedCompany} period={selectedPeriod} />
              </div>
              
              <Dashboard3DeptPerformance companyId={selectedCompany} period={selectedPeriod} />
            </motion.div>
          )}

          {activeView === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <WeeklyCashFlowForm projects={projects} divisions={divisions} onSubmit={handleRefresh} />
            </motion.div>
          )}

          {activeView === 'approval' && (
            <motion.div
              key="approval"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <ApprovalCenter onApprovalChange={handleRefresh} />
            </motion.div>
          )}

          {activeView === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <Dashboard7HistoricalCashFlow companyId={selectedCompany} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">MAFINDA - Management Finance Dashboard</p>
              <p className="text-xs text-slate-500">© 2024 All rights reserved. Built with React & TypeScript</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                System Online
              </span>
              <span>•</span>
              <span>Version 2.0.0</span>
              <span>•</span>
              <span>Full Implementation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
