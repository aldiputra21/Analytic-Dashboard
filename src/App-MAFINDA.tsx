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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

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

// Card Component
const Card = ({ children, className, title, subtitle, icon: Icon }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}
  >
    {(title || Icon) && (
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
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

// Dashboard 1: Cash Position Component
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
        console.error('Error fetching cash position:', err);
        setLoading(false);
      });
  }, [companyId]);

  if (loading) {
    return <Card title="Posisi Kas" subtitle="Cash position overview"><div className="text-center py-8">Loading...</div></Card>;
  }

  return (
    <Card title="Posisi Kas Akhir" subtitle="Cash position overview" icon={Wallet}>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-6 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Total Cash Position</p>
            <h2 className="text-4xl font-black text-slate-900">{formatRupiah(data?.cashPosition || 0)}</h2>
            <p className="text-xs text-slate-500 mt-2">
              Last Updated: {data?.lastUpdated ? format(new Date(data.lastUpdated), 'dd MMM yyyy HH:mm') : 'N/A'}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        {data?.weeklyBreakdown && data.weeklyBreakdown.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Weekly Breakdown</h4>
            {data.weeklyBreakdown.slice(0, 5).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">{item.week}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.project_name}</p>
                    <p className="text-xs text-slate-500">{item.division_name} • {item.period}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">+{formatRupiah(item.cash_in, false)}</p>
                  <p className="text-sm font-bold text-rose-600">-{formatRupiah(item.cash_out, false)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// Dashboard 4: Achievement Gauge Component
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
        console.error('Error fetching achievement:', err);
        setLoading(false);
      });
  }, [companyId, period]);

  if (loading) {
    return <Card title="Achievement Gauge"><div className="text-center py-8">Loading...</div></Card>;
  }

  const achievement = data?.overallAchievement || 0;
  const colorZone = data?.colorZone || 'red';

  return (
    <Card title="Overall Achievement" subtitle="Aggregate performance across divisions" icon={Target}>
      <div className="space-y-6">
        {/* Speedometer Gauge */}
        <div className="relative h-48 flex items-center justify-center">
          <div className="relative w-64 h-32 overflow-hidden">
            <div className="absolute inset-0 border-8 border-slate-100 rounded-t-full"></div>
            <motion.div
              initial={{ rotate: -90 }}
              animate={{ rotate: -90 + (achievement * 1.8) }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute bottom-0 left-1/2 w-1 h-32 origin-bottom"
              style={{ transformOrigin: 'bottom center' }}
            >
              <div className="w-2 h-full bg-slate-900 rounded-full"></div>
            </motion.div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rounded-full"></div>
          </div>
          <div className="absolute bottom-4 text-center">
            <p className="text-5xl font-black text-slate-900">{achievement.toFixed(0)}%</p>
            <p className={cn(
              "text-xs font-bold uppercase tracking-wider mt-1",
              colorZone === 'green' ? 'text-emerald-600' : colorZone === 'yellow' ? 'text-amber-600' : 'text-rose-600'
            )}>
              {colorZone === 'green' ? 'Excellent' : colorZone === 'yellow' ? 'Good' : 'Needs Improvement'}
            </p>
          </div>
        </div>

        {/* Division Breakdown */}
        {data?.divisionBreakdown && data.divisionBreakdown.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Division Performance</h4>
            {data.divisionBreakdown.map((div: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{div.divisionName}</span>
                  <span className="text-sm font-bold text-slate-900">{div.achievement.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(div.achievement, 100)}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className={cn(
                      "h-full rounded-full",
                      div.achievement > 75 ? "bg-emerald-500" : div.achievement > 25 ? "bg-amber-500" : "bg-rose-500"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// Dashboard 3: Department Performance Component
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
        console.error('Error fetching dept performance:', err);
        setLoading(false);
      });
  }, [companyId, period]);

  if (loading) {
    return <Card title="Department Performance"><div className="text-center py-8">Loading...</div></Card>;
  }

  return (
    <Card title="Department Performance Ranking" subtitle="Best and lowest performing divisions" icon={TrendingUp}>
      <div className="space-y-6">
        {data?.highest && (
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Top Performer</p>
                <h4 className="text-lg font-bold text-slate-900">{data.highest.divisionName}</h4>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-500">Target</p>
                <p className="text-sm font-bold text-slate-900">{formatRupiah(data.highest.target)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Actual</p>
                <p className="text-sm font-bold text-emerald-600">{formatRupiah(data.highest.actual)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Achievement</p>
                <p className="text-2xl font-black text-emerald-600">{data.highest.achievement.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        )}

        {data?.lowest && (
          <div className="p-6 bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-rose-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Needs Attention</p>
                <h4 className="text-lg font-bold text-slate-900">{data.lowest.divisionName}</h4>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-500">Target</p>
                <p className="text-sm font-bold text-slate-900">{formatRupiah(data.lowest.target)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Actual</p>
                <p className="text-sm font-bold text-rose-600">{formatRupiah(data.lowest.actual)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Achievement</p>
                <p className="text-2xl font-black text-rose-600">{data.lowest.achievement.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Weekly Cash Flow Input Form
const WeeklyCashFlowForm = ({ projects, onSubmit }: { projects: Project[]; onSubmit: () => void }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          submittedBy: 1 // Default user ID for demo
        })
      });

      if (response.ok) {
        alert('Cash flow data submitted for approval!');
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
        alert('Failed to submit cash flow data');
      }
    } catch (error) {
      console.error('Error submitting cash flow:', error);
      alert('Error submitting cash flow data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="Input Cash Flow Mingguan" subtitle="Banking Officer - Weekly cash flow entry" icon={DollarSign}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Project</label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">Select Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Period</label>
            <input
              type="month"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Week</label>
            <select
              value={formData.week}
              onChange={(e) => setFormData({ ...formData, week: e.target.value as any })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="W1">Week 1</option>
              <option value="W2">Week 2</option>
              <option value="W3">Week 3</option>
              <option value="W4">Week 4</option>
              <option value="W5">Week 5</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Revenue</label>
            <input
              type="number"
              value={formData.revenue}
              onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cash In</label>
            <input
              type="number"
              value={formData.cashIn}
              onChange={(e) => setFormData({ ...formData, cashIn: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cash Out</label>
            <input
              type="number"
              value={formData.cashOut}
              onChange={(e) => setFormData({ ...formData, cashOut: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={3}
            placeholder="Additional notes..."
          />
        </div>

        <div className="flex justify-end gap-3">
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
            className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors",
              submitting && "opacity-50 cursor-not-allowed"
            )}
          >
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </form>
    </Card>
  );
};

// Approval Center Component
const ApprovalCenter = ({ onApprovalChange }: { onApprovalChange: () => void }) => {
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/approvals/pending');
      const data = await response.json();
      setPendingApprovals(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
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
          approvedBy: 2, // Finance Analyst user ID for demo
          notes: 'Approved via dashboard'
        })
      });

      if (response.ok) {
        alert('Data approved successfully!');
        fetchPendingApprovals();
        onApprovalChange();
      } else {
        alert('Failed to approve data');
      }
    } catch (error) {
      console.error('Error approving:', error);
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
          rejectedBy: 2, // Finance Analyst user ID for demo
          reason
        })
      });

      if (response.ok) {
        alert('Data rejected successfully!');
        fetchPendingApprovals();
        onApprovalChange();
      } else {
        alert('Failed to reject data');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Error rejecting data');
    }
  };

  if (loading) {
    return <Card title="Approval Center"><div className="text-center py-8">Loading...</div></Card>;
  }

  return (
    <Card title="Approval Center" subtitle="Finance Analyst - Pending approvals" icon={CheckCircle2}>
      <div className="space-y-4">
        {pendingApprovals.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-slate-500">No pending approvals</p>
          </div>
        ) : (
          pendingApprovals.map((approval) => (
            <div key={approval.id} className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-bold uppercase",
                      approval.type === 'cash_flow' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    )}>
                      {approval.type === 'cash_flow' ? 'Cash Flow' : 'Target'}
                    </span>
                    <span className="text-xs text-slate-500">
                      {approval.submitted_by_name} • {format(new Date(approval.submitted_at), 'dd MMM yyyy HH:mm')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{approval.project_name}</h4>
                  <p className="text-xs text-slate-500">{approval.division_name} • {approval.period} {approval.week || ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
                {approval.type === 'cash_flow' ? (
                  <>
                    <div>
                      <p className="text-xs text-slate-500">Revenue</p>
                      <p className="text-sm font-bold text-slate-900">{formatRupiah(approval.revenue, false)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Cash In</p>
                      <p className="text-sm font-bold text-emerald-600">{formatRupiah(approval.cash_in, false)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Cash Out</p>
                      <p className="text-sm font-bold text-rose-600">{formatRupiah(approval.cash_out, false)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-slate-500">Revenue Target</p>
                      <p className="text-sm font-bold text-slate-900">{formatRupiah(approval.revenue_target, false)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Cash In Target</p>
                      <p className="text-sm font-bold text-emerald-600">{formatRupiah(approval.cash_in_target, false)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Cash Out Target</p>
                      <p className="text-sm font-bold text-rose-600">{formatRupiah(approval.cash_out_target, false)}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(approval.id, approval.type)}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(approval.id, approval.type)}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

// Main MAFINDA App Component
export default function MafindaApp() {
  const [activeView, setActiveView] = useState<'dashboard' | 'input' | 'approval'>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [refreshKey, setRefreshKey] = useState(0);

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
      .catch(err => console.error('Error fetching companies:', err));

    // Fetch divisions
    fetch('/api/divisions')
      .then(res => res.json())
      .then(data => setDivisions(data))
      .catch(err => console.error('Error fetching divisions:', err));

    // Fetch projects
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error('Error fetching projects:', err));
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">MAFINDA</h1>
                <p className="text-xs text-slate-500 font-medium">Management Finance Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveView('dashboard')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeView === 'dashboard' 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <LayoutDashboard className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('input')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeView === 'input' 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Input Data
            </button>
            <button
              onClick={() => setActiveView('approval')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeView === 'approval' 
                  ? "bg-indigo-600 text-white" 
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              Approval Center
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeView === 'dashboard' && (
          <div className="space-y-8" key={refreshKey}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Dashboard1CashPosition companyId={selectedCompany} />
              <Dashboard4AchievementGauge companyId={selectedCompany} period={selectedPeriod} />
            </div>
            
            <Dashboard3DeptPerformance companyId={selectedCompany} period={selectedPeriod} />
          </div>
        )}

        {activeView === 'input' && (
          <div className="space-y-8">
            <WeeklyCashFlowForm projects={projects} onSubmit={handleRefresh} />
          </div>
        )}

        {activeView === 'approval' && (
          <div className="space-y-8">
            <ApprovalCenter onApprovalChange={handleRefresh} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              © 2024 MAFINDA - Management Finance Dashboard
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Demo Mode</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
