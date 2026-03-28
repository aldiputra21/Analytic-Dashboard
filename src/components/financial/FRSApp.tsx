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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">FRS Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">Financial Ratio Monitoring System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
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
        return (
          <div className="p-4">
            <CRMPage />
          </div>
        );
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
