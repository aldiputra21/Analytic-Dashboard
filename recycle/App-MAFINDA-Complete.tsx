import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText,
  Activity,
  CheckCircle2,
  Building2,
  Settings,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Target as TargetIcon,
  PieChart as PieChartIcon,
  BarChart3,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import all dashboard components
import Dashboard2KeyMetrics from './components/MAFINDA/Dashboard2KeyMetrics';
import Dashboard6FinancialRatios from './components/MAFINDA/Dashboard6FinancialRatios';
import Dashboard8AssetComposition from './components/MAFINDA/Dashboard8AssetComposition';
import Dashboard9EquityComposition from './components/MAFINDA/Dashboard9EquityComposition';
import ExecutiveDashboard from './components/MAFINDA/ExecutiveDashboard';

// Import form components
import BalanceSheetForm from './components/MAFINDA/BalanceSheetForm';
import IncomeStatementForm from './components/MAFINDA/IncomeStatementForm';

// Import monitoring components
import CostControlMonitoring from './components/MAFINDA/CostControlMonitoring';

// Import management components
import DivisionProjectManagement from './components/MAFINDA/DivisionProjectManagement';

// Types
interface Company {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface User {
  id: number;
  username: string;
  role: string;
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

// Helper function
function formatRupiah(value: number): string {
  if (Math.abs(value) >= 1000000000) {
    return `Rp ${(value / 1000000000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}M`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function MafindaCompleteApp() {
  // State Management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('ASI');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    Promise.all([
      fetch('/api/companies').then(r => r.json()),
      fetch('/api/auth/profile').then(r => r.json()).catch(() => null)
    ])
      .then(([companiesData, userData]) => {
        setCompanies(companiesData);
        setCurrentUser(userData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setError('Failed to load initial data');
        setLoading(false);
      });
  }, []);

  // Fetch divisions and projects when company changes
  useEffect(() => {
    if (selectedCompany) {
      Promise.all([
        fetch(`/api/divisions?companyId=${selectedCompany}`).then(r => r.json()),
        fetch(`/api/projects?companyId=${selectedCompany}`).then(r => r.json())
      ])
        .then(([divisionsData, projectsData]) => {
          setDivisions(divisionsData);
          setProjects(projectsData);
        })
        .catch(err => console.error('Error loading divisions/projects:', err));
    }
  }, [selectedCompany]);

  // Navigation Items
  const navigationItems = [
    {
      id: 'executive',
      label: 'Executive View',
      icon: LayoutDashboard,
      badge: undefined
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      subItems: [
        { id: 'overview', label: 'Overview' },
        { id: 'financial-metrics', label: 'Financial Metrics' },
        { id: 'ratios', label: 'Financial Ratios' },
        { id: 'composition', label: 'Asset & Equity' }
      ]
    },
    {
      id: 'input',
      label: 'Input Data',
      icon: FileText,
      subItems: [
        { id: 'cash-flow', label: 'Weekly Cash Flow' },
        { id: 'balance-sheet', label: 'Balance Sheet' },
        { id: 'income-statement', label: 'Income Statement' },
        { id: 'targets', label: 'Targets' }
      ]
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: Activity,
      subItems: [
        { id: 'cost-control', label: 'Cost Control' },
        { id: 'projections', label: 'Projections' }
      ]
    },
    {
      id: 'approval',
      label: 'Approval Center',
      icon: CheckCircle2,
      badge: 0 // Will be updated with pending count
    },
    {
      id: 'management',
      label: 'Management',
      icon: Building2,
      subItems: [
        { id: 'divisions-projects', label: 'Divisions & Projects' },
        { id: 'users', label: 'Users' }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading MAFINDA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-700 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 sticky top-0 z-50 shadow-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">MAFINDA</h1>
                  <p className="text-xs text-slate-400">Management Finance Dashboard</p>
                </div>
              </div>
            </div>

            {/* Company Selector and User Menu */}
            <div className="flex items-center gap-4">
              {/* Company Selector */}
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.code} - {company.name}
                  </option>
                ))}
              </select>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Bell className="w-6 h-6 text-white" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-700 rounded-lg">
                <User className="w-5 h-5 text-white" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{currentUser?.username || 'Guest'}</p>
                  <p className="text-xs text-slate-400">{currentUser?.role || 'User'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-72 bg-white border-r border-slate-200 min-h-[calc(100vh-73px)] shadow-lg"
            >
              <nav className="p-4 space-y-2">
                {navigationItems.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        if (item.subItems && item.subItems.length > 0) {
                          setActiveSubTab(item.subItems[0].id);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.subItems && (
                        <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? 'rotate-90' : ''}`} />
                      )}
                    </button>

                    {/* Sub Items */}
                    {item.subItems && activeTab === item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-4 mt-2 space-y-1"
                      >
                        {item.subItems.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => setActiveSubTab(subItem.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                              activeSubTab === subItem.id
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Executive Dashboard Tab */}
            {activeTab === 'executive' && (
              <ExecutiveDashboard companyId={selectedCompany} />
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <DashboardContent 
                subTab={activeSubTab} 
                companyId={selectedCompany}
              />
            )}

            {/* Input Data Tab */}
            {activeTab === 'input' && (
              <InputDataContent 
                subTab={activeSubTab} 
                companyId={selectedCompany}
                projects={projects}
              />
            )}

            {/* Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <MonitoringContent 
                subTab={activeSubTab} 
                companyId={selectedCompany}
              />
            )}

            {/* Approval Tab */}
            {activeTab === 'approval' && (
              <ApprovalContent companyId={selectedCompany} />
            )}

            {/* Management Tab */}
            {activeTab === 'management' && (
              <ManagementContent 
                subTab={activeSubTab} 
                companyId={selectedCompany}
                divisions={divisions}
                projects={projects}
                setDivisions={setDivisions}
                setProjects={setProjects}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent({ subTab, companyId }: { subTab: string; companyId: string }) {
  const [keyMetricsData, setKeyMetricsData] = useState(null);
  const [ratiosData, setRatiosData] = useState(null);
  const [assetData, setAssetData] = useState(null);
  const [equityData, setEquityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    
    Promise.all([
      fetch(`/api/dashboard/key-metrics?companyId=${companyId}&period=${currentPeriod}`).then(r => r.json()).catch(() => null),
      fetch(`/api/dashboard/financial-ratios?companyId=${companyId}&period=${currentPeriod}`).then(r => r.json()).catch(() => null),
      fetch(`/api/dashboard/asset-composition?companyId=${companyId}&period=${currentPeriod}`).then(r => r.json()).catch(() => null),
      fetch(`/api/dashboard/equity-composition?companyId=${companyId}&period=${currentPeriod}`).then(r => r.json()).catch(() => null)
    ])
      .then(([metrics, ratios, assets, equity]) => {
        setKeyMetricsData(metrics);
        setRatiosData(ratios);
        setAssetData(assets);
        setEquityData(equity);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading dashboard data:', err);
        setLoading(false);
      });
  }, [companyId]);

  if (subTab === 'overview') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Dashboard Overview</h2>
          <p className="text-slate-600">Complete financial overview and key metrics</p>
        </div>

        {/* All dashboards in overview */}
        <Dashboard2KeyMetrics data={keyMetricsData} loading={loading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Dashboard8AssetComposition data={assetData} loading={loading} />
          <Dashboard9EquityComposition data={equityData} loading={loading} />
        </div>
      </div>
    );
  }

  if (subTab === 'financial-metrics') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Financial Metrics</h2>
          <p className="text-slate-600">Key financial indicators and ratios</p>
        </div>
        <Dashboard2KeyMetrics data={keyMetricsData} loading={loading} />
      </div>
    );
  }

  if (subTab === 'ratios') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Financial Ratios</h2>
          <p className="text-slate-600">Liquidity, Profitability, and Leverage ratios</p>
        </div>
        <Dashboard6FinancialRatios data={ratiosData} loading={loading} />
      </div>
    );
  }

  if (subTab === 'composition') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Asset & Equity Composition</h2>
          <p className="text-slate-600">Breakdown of assets and equity</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Dashboard8AssetComposition data={assetData} loading={loading} />
          <Dashboard9EquityComposition data={equityData} loading={loading} />
        </div>
      </div>
    );
  }

  return null;
}

// Input Data Content Component
function InputDataContent({ subTab, companyId, projects }: any) {
  const handleBalanceSheetSubmit = async (data: any) => {
    const response = await fetch('/api/financial/balance-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to submit balance sheet');
  };

  const handleIncomeStatementSubmit = async (data: any) => {
    const response = await fetch('/api/financial/income-statement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to submit income statement');
  };

  if (subTab === 'balance-sheet') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Balance Sheet</h2>
          <p className="text-slate-600">Input balance sheet data (Neraca)</p>
        </div>
        <BalanceSheetForm 
          companyId={companyId} 
          onSubmit={handleBalanceSheetSubmit}
        />
      </div>
    );
  }

  if (subTab === 'income-statement') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Income Statement</h2>
          <p className="text-slate-600">Input income statement data (Laba Rugi)</p>
        </div>
        <IncomeStatementForm 
          companyId={companyId} 
          onSubmit={handleIncomeStatementSubmit}
        />
      </div>
    );
  }

  // Add other input forms here (cash-flow, targets)
  return (
    <div className="bg-white rounded-xl p-12 shadow-lg text-center">
      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">Select a form from the sidebar</p>
    </div>
  );
}

// Monitoring Content Component
function MonitoringContent({ subTab, companyId }: any) {
  const [costControlData, setCostControlData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    
    fetch(`/api/cost-control?companyId=${companyId}&period=${currentPeriod}`)
      .then(r => r.json())
      .then(data => {
        setCostControlData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading cost control data:', err);
        setLoading(false);
      });
  }, [companyId]);

  if (subTab === 'cost-control') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Cost Control Monitoring</h2>
          <p className="text-slate-600">Track and monitor 7 cost control categories</p>
        </div>
        <CostControlMonitoring data={costControlData} loading={loading} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-12 shadow-lg text-center">
      <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">Select a monitoring view from the sidebar</p>
    </div>
  );
}

// Approval Content Component
function ApprovalContent({ companyId }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Approval Center</h2>
        <p className="text-slate-600">Review and approve pending submissions</p>
      </div>
      <div className="bg-white rounded-xl p-12 shadow-lg text-center">
        <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Approval center coming soon</p>
      </div>
    </div>
  );
}

// Management Content Component
function ManagementContent({ subTab, companyId, divisions, projects, setDivisions, setProjects }: any) {
  const handleAddDivision = async (name: string) => {
    const response = await fetch('/api/divisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, name })
    });
    const newDivision = await response.json();
    setDivisions([...divisions, newDivision]);
  };

  const handleEditDivision = async (id: string, name: string) => {
    await fetch(`/api/divisions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    setDivisions(divisions.map((d: Division) => d.id === id ? { ...d, name } : d));
  };

  const handleDeleteDivision = async (id: string) => {
    await fetch(`/api/divisions/${id}`, { method: 'DELETE' });
    setDivisions(divisions.filter((d: Division) => d.id !== id));
    setProjects(projects.filter((p: Project) => p.division_id !== id));
  };

  const handleAddProject = async (divisionId: string, name: string, description: string) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ divisionId, name, description })
    });
    const newProject = await response.json();
    setProjects([...projects, newProject]);
  };

  const handleEditProject = async (id: string, name: string, description: string) => {
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    setProjects(projects.map((p: Project) => p.id === id ? { ...p, name, description } : p));
  };

  const handleDeleteProject = async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(projects.filter((p: Project) => p.id !== id));
  };

  if (subTab === 'divisions-projects') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Divisions & Projects</h2>
          <p className="text-slate-600">Manage organizational structure</p>
        </div>
        <DivisionProjectManagement
          divisions={divisions}
          projects={projects}
          companyId={companyId}
          onAddDivision={handleAddDivision}
          onEditDivision={handleEditDivision}
          onDeleteDivision={handleDeleteDivision}
          onAddProject={handleAddProject}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-12 shadow-lg text-center">
      <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">Select a management view from the sidebar</p>
    </div>
  );
}
