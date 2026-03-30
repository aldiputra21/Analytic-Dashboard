// FRSApp.tsx - Main entry point for the Financial Ratio Monitoring System
// Requirements: 4.2, 9.1, 12.1, 12.2

import React, { useState, Suspense, lazy } from 'react';
import { DashboardLayout, FRSPage } from './dashboard/DashboardLayout';
import { ProtectedRoute } from './shared/ProtectedRoute';
import { QueryProvider } from './shared/QueryProvider';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { ToastProvider } from './shared/Toast';
import { useAuth } from '../../hooks/financial/useAuth';
import { useAlerts } from '../../hooks/financial/useAlerts';
import { useSubsidiaries } from '../../hooks/financial/useSubsidiaries';

// Lazy-loaded route components for code splitting (Req 12.2)
const FRSDashboard = lazy(() => import('./dashboard/FRSDashboard').then((m) => ({ default: m.FRSDashboard })));
const ThresholdConfig = lazy(() => import('./admin/ThresholdConfig').then((m) => ({ default: m.ThresholdConfig })));
const AuditLog = lazy(() => import('./admin/AuditLog').then((m) => ({ default: m.AuditLog })));
const SubsidiaryManager = lazy(() => import('./admin/SubsidiaryManager').then((m) => ({ default: m.SubsidiaryManager })));
const UserManager = lazy(() => import('./admin/UserManager').then((m) => ({ default: m.UserManager })));
const FinancialDataForm = lazy(() => import('./data-entry/FinancialDataForm').then((m) => ({ default: m.FinancialDataForm })));
const BulkImport = lazy(() => import('./data-entry/BulkImport').then((m) => ({ default: m.BulkImport })));
const BenchmarkingTable = lazy(() => import('./reports/BenchmarkingTable').then((m) => ({ default: m.BenchmarkingTable })));
const ConsolidatedReport = lazy(() => import('./reports/ConsolidatedReport').then((m) => ({ default: m.ConsolidatedReport })));
const TrendAnalysis = lazy(() => import('./reports/TrendAnalysis').then((m) => ({ default: m.TrendAnalysis })));

// MAFINDA lazy-loaded components
const ManagementPage = lazy(() => import('../MAFINDA/management/ManagementPage').then((m) => ({ default: m.ManagementPage })));
const DataEntryPage = lazy(() => import('../MAFINDA/data-entry/DataEntryPage').then((m) => ({ default: m.DataEntryPage })));
const CRMPage = lazy(() => import('../MAFINDA/crm/CRMPage').then((m) => ({ default: m.CRMPage })));

// Skeleton screen for loading states (Req 12.1)
const PageSkeleton: React.FC = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="h-6 bg-slate-200 rounded w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-slate-200 rounded-xl" />
      ))}
    </div>
    <div className="h-64 bg-slate-200 rounded-xl" />
  </div>
);

// Login form
interface LoginFormProps {
  onLogin: (input: { username: string; password: string }) => Promise<boolean>;
  error: string | null;
  isLoading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, error, isLoading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin({ username, password });
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1a0a0a 40%, #2d0a0a 70%, #0f0c29 100%)' }}>

      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">

        {/* Radial glow behind logo */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '70%', height: '70%', background: 'radial-gradient(circle, rgba(220,38,38,0.35) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '10%', right: '5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', filter: 'blur(30px)' }} />
        </div>

        {/* Decorative grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Diagonal accent line */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="url(#lineGrad)" strokeWidth="1.5" />
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0" />
              <stop offset="50%" stopColor="#dc2626" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Logo — bottom-left */}
        <div className="relative z-10 mt-auto">
          <div className="mb-5">
            <div className="relative inline-block">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.5) 0%, transparent 70%)', filter: 'blur(20px)', transform: 'scale(1.4)' }} />
              <img src="/src/img/logo-titian.png" alt="Titian Logo" className="relative w-60 object-contain drop-shadow-2xl" />
            </div>
          </div>

          {/* Tagline */}
          <div className="border-l-2 border-red-500 pl-5 mb-8">
            <p className="text-white/90 text-xl font-light leading-snug italic">
              "Your Trusted Partner<br />in Energy Solutions"
            </p>
          </div>

          {/* Decorative dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? '#dc2626' : i === 1 ? '#f87171' : 'rgba(255,255,255,0.3)' }} />
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <p className="relative z-10 text-white/30 text-xs mt-6">© {new Date().getFullYear()} PT Titian Servis Indonesia. All rights reserved.</p>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">

        {/* Subtle right-side glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        </div>

        <div className="relative z-10 w-full max-w-md">

          {/* Mobile logo (shown only on small screens) */}
          <div className="flex lg:hidden justify-center mb-8">
            <img src="/src/img/logo-titian.png" alt="Titian Logo" className="w-16 h-16 object-contain drop-shadow-lg" />
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

            <div className="mb-8">
              <h2 className="text-white text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-white/40 text-sm mt-1">Sign in Corporate Finance Dashboard & CRM</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2 tracking-wider uppercase">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/60 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2 tracking-wider uppercase">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/60 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs text-red-300" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)', boxShadow: '0 4px 20px rgba(220,38,38,0.4)' }}
              >
                <span className="relative z-10">{isLoading ? 'Authenticating...' : 'Sign In'}</span>
                {/* Shimmer on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-center text-white/20 text-xs">Titian Corporate Finance System · v2.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder for pages not yet implemented
const ComingSoon: React.FC<{ page: string }> = ({ page }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <p className="text-slate-500 font-medium capitalize">{page}</p>
    <p className="text-sm text-slate-400 mt-1">This section is coming soon</p>
  </div>
);

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<FRSPage>('dashboard');
  const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState<string | undefined>();
  const { alerts } = useAlerts({ status: 'active' });
  const { subsidiaries } = useSubsidiaries();
  const alertCount = React.useMemo(() => alerts.filter((a) => a.status === 'active').length, [alerts]);

  // Pick first subsidiary for threshold config if none selected
  const thresholdSubsidiaryId = selectedSubsidiaryId ?? subsidiaries[0]?.id;
  const thresholdSubsidiaryName = React.useMemo(
    () => subsidiaries.find((s) => s.id === thresholdSubsidiaryId)?.name ?? '',
    [subsidiaries, thresholdSubsidiaryId]
  );

  const handleNavigate = React.useCallback((page: FRSPage) => setCurrentPage(page), []);
  const handleSubsidiaryChange = React.useCallback((id: string) => setSelectedSubsidiaryId(id), []);

  const renderPage = React.useCallback(() => {
    switch (currentPage) {
      case 'dashboard': return <FRSDashboard />;
      case 'benchmarking': return (
        <div className="space-y-6">
          <BenchmarkingTable />
        </div>
      );
      case 'trends': return (
        <div className="space-y-6">
          <TrendAnalysis />
        </div>
      );
      case 'reports': return (
        <div className="space-y-6">
          <ConsolidatedReport />
        </div>
      );
      case 'thresholds':
        return thresholdSubsidiaryId ? (
          <div className="p-6 space-y-4">
            {subsidiaries.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Subsidiary:</label>
                <select
                  value={thresholdSubsidiaryId}
                  onChange={(e) => handleSubsidiaryChange(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {subsidiaries.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            <ThresholdConfig subsidiaryId={thresholdSubsidiaryId} subsidiaryName={thresholdSubsidiaryName} />
          </div>
        ) : (
          <ComingSoon page="thresholds" />
        );
      case 'subsidiaries':
        return (
          <div className="p-6">
            <SubsidiaryManager />
          </div>
        );
      case 'users':
        return (
          <div className="p-6">
            <UserManager />
          </div>
        );
      case 'audit-log':
        return (
          <div className="p-6">
            <AuditLog />
          </div>
        );
      case 'data-entry':
        return (
          <div className="p-6 max-w-3xl">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900">Manual Data Entry</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter financial data for a subsidiary period</p>
            </div>
            <FinancialDataForm />
          </div>
        );
      case 'bulk-import':
        return (
          <div className="p-6 max-w-2xl">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-slate-900">Bulk Import</h2>
              <p className="text-xs text-slate-500 mt-0.5">Import financial data from CSV or Excel file</p>
            </div>
            <BulkImport />
          </div>
        );
      // MAFINDA pages
      case 'mafinda-management':
        return (
          <div className="p-4">
            <ManagementPage />
          </div>
        );
      case 'mafinda-data-entry':
        return (
          <div className="p-4">
            <DataEntryPage />
          </div>
        );
      case 'mafinda-crm':
        return <CRMPage activeTab="dashboard" />;
      case 'crm-dashboard':
        return <CRMPage activeTab="dashboard" />;
      case 'crm-opportunities':
        return <CRMPage activeTab="opportunities" />;
      case 'crm-customers':
        return <CRMPage activeTab="customers" />;
      case 'crm-proposals':
        return <CRMPage activeTab="proposals" />;
      case 'crm-contracts':
        return <CRMPage activeTab="contracts" />;
      case 'crm-approvals':
        return <CRMPage activeTab="approvals" />;
      case 'crm-reimburse':
        return <CRMPage activeTab="reimburse" />;
      default: return <ComingSoon page={currentPage} />;
    }
  }, [currentPage, thresholdSubsidiaryId, thresholdSubsidiaryName, subsidiaries, handleSubsidiaryChange]);

  return (
    <DashboardLayout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      alertCount={alertCount}
    >
      <Suspense fallback={<PageSkeleton />}>
        {renderPage()}
      </Suspense>
    </DashboardLayout>
  );
};

export const FRSApp: React.FC = () => {
  const { user, isLoading, login, error } = useAuth();

  if (isLoading) return null;
  if (!user) return <LoginForm onLogin={login} error={error} isLoading={isLoading} />;

  return (
    <ProtectedRoute>
      <AppContent />
    </ProtectedRoute>
  );
};

// Wrap with QueryProvider so all child hooks share the SWR cache
const FRSAppWithProviders: React.FC = () => (
  <ErrorBoundary>
    <ToastProvider>
      <QueryProvider>
        <FRSApp />
      </QueryProvider>
    </ToastProvider>
  </ErrorBoundary>
);

export default FRSAppWithProviders;
