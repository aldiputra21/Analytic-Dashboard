import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { commonsI18n } from '../../i18n/commons';
import { DashboardLayout, FRSPage } from './dashboard/DashboardLayout';
import { ProtectedRoute } from './shared/ProtectedRoute';
import { QueryProvider } from './shared/QueryProvider';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { ToastProvider } from './shared/Toast';
import { useAuth } from '../../hooks/financial/useAuth';
import { Toaster, toast } from 'sonner';
import { useNotifications } from '../../hooks/financial/useNotifications';
import { useCorporates } from '../../hooks/financial/useCorporates';

// Pages
import { LoginPage } from '../../pages/LoginPage';
import { ActivateAccountPage } from '../../pages/ActivateAccountPage';
import { ResetPasswordPage } from '../../pages/ResetPasswordPage';
import { UserProfilePage } from '../../pages/UserProfilePage';

// Lazy-loaded route components for code splitting (Req 12.2)
const FRSDashboard = lazy(() => import('./dashboard/FRSDashboard').then((m) => ({ default: m.FRSDashboard })));
const ThresholdConfig = lazy(() => import('./admin/ThresholdConfig').then((m) => ({ default: m.ThresholdConfig })));
const AuditLog = lazy(() => import('./admin/AuditLog').then((m) => ({ default: m.AuditLog })));
const CorporateManager = lazy(() => import('./admin/CorporateManager').then((m) => ({ default: m.CorporateManager })));
const CostCenterManager = lazy(() => import('./admin/CostCenterManager').then((m) => ({ default: m.CostCenterManager })));
const DepartmentManager = lazy(() => import('./admin/DepartmentManager').then((m) => ({ default: m.DepartmentManager })));
const ProjectManager = lazy(() => import('./admin/ProjectManager').then((m) => ({ default: m.ProjectManager })));
const TargetManager = lazy(() => import('./admin/TargetManager').then((m) => ({ default: m.TargetManager })));
const UserManager = lazy(() => import('./admin/UserManager').then((m) => ({ default: m.UserManager })));
const PermissionManager = lazy(() => import('./admin/PermissionManager').then((m) => ({ default: m.PermissionManager })));
const RoleManager = lazy(() => import('./admin/RoleManager').then((m) => ({ default: m.RoleManager })));
const BenchmarkingTable = lazy(() => import('./reports/BenchmarkingTable').then((m) => ({ default: m.BenchmarkingTable })));
const ConsolidatedReport = lazy(() => import('./reports/ConsolidatedReport').then((m) => ({ default: m.ConsolidatedReport })));
const TrendAnalysis = lazy(() => import('./reports/TrendAnalysis').then((m) => ({ default: m.TrendAnalysis })));
const AlertsInbox = lazy(() => import('./dashboard/AlertsInbox').then((m) => ({ default: m.AlertsInbox })));

// MAFINDA lazy-loaded components
const ManagementPage = lazy(() => import('../MAFINDA/management/ManagementPage').then((m) => ({ default: m.ManagementPage })));
const DataEntryPage = lazy(() => import('../MAFINDA/data-entry/DataEntryPage').then((m) => ({ default: m.DataEntryPage })));
const CRMPage = lazy(() => import('../MAFINDA/crm/CRMPage').then((m) => ({ default: m.CRMPage })));

// Financial Data Refinement Managers
const BalanceSheetManager = lazy(() => import('./data-entry/BalanceSheetManager').then((m) => ({ default: m.BalanceSheetManager })));
const IncomeStatementManager = lazy(() => import('./data-entry/IncomeStatementManager').then((m) => ({ default: m.IncomeStatementManager })));
const WeeklyCashFlowManager = lazy(() => import('./data-entry/WeeklyCashFlowManager').then((m) => ({ default: m.WeeklyCashFlowManager })));

// CFD Financial Enhancements Components
const RealizationManager = lazy(() => import('./cfd/RealizationManager').then((m) => ({ default: m.RealizationManager })));
const BankLoanManager = lazy(() => import('./cfd/BankLoanManager').then((m) => ({ default: m.BankLoanManager })));
const BankManager = lazy(() => import('./admin/BankManager').then((m) => ({ default: m.BankManager })));
const CorporateSectorManager = lazy(() => import('./admin/CorporateSectorManager').then((m) => ({ default: m.CorporateSectorManager })));
const CurrencyManager = lazy(() => import('./admin/CurrencyManager').then((m) => ({ default: m.CurrencyManager })));
const CostCenterCategoryManager = lazy(() => import('./admin/CostCenterCategoryManager').then((m) => ({ default: m.CostCenterCategoryManager })));
const NotificationConfigManager = lazy(() => import('./admin/NotificationConfigManager').then((m) => ({ default: m.NotificationConfigManager })));
const SystemConfigManager = lazy(() => import('./admin/SystemConfigManager').then((m) => ({ default: m.SystemConfigManager })));

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

// Placeholder for pages not yet implemented
const ComingSoon: React.FC<{ page: string }> = ({ page }) => {
  const { language } = useAuth();
  const common = commonsI18n[language];
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-slate-500 font-medium capitalize">{page}</p>
      <p className="text-sm text-slate-400 mt-1">{common.comingSoonDesc}</p>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<FRSPage>('dashboard');
  const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState<string | undefined>();
  const { user, token } = useAuth();
  
  const notificationOptions = React.useMemo(
    () => ({ status: 'unread' as const, enabled: Boolean(user), token }),
    [user, token]
  );
  const { unreadCount } = useNotifications(notificationOptions);
  const { corporates: subsidiaries } = useCorporates();
  const alertCount = React.useMemo(
    () => unreadCount || 0,
    [unreadCount],
  );

  const thresholdSubsidiaryId = selectedSubsidiaryId ?? subsidiaries[0]?.id;
  const thresholdSubsidiaryName = React.useMemo(
    () => subsidiaries.find((s) => s.id === thresholdSubsidiaryId)?.name ?? '',
    [subsidiaries, thresholdSubsidiaryId]
  );

  const handleNavigate = (page: FRSPage) => {
    setCurrentPage(page);
  };

  const handleSubsidiaryChange = (id: string) => {
    setSelectedSubsidiaryId(id);
  };

  const renderPage = React.useCallback(() => {
    switch (currentPage) {
      case 'dashboard': return (
        <FRSDashboard 
          selectedSubsidiaryId={selectedSubsidiaryId} 
          onSubsidiaryChange={handleSubsidiaryChange} 
        />
      );
      case 'alerts': return <AlertsInbox />;
      case 'targets': return <TargetManager />;
      case 'thresholds': return (
        <ThresholdConfig 
          subsidiaryId={thresholdSubsidiaryId} 
          subsidiaryName={thresholdSubsidiaryName} 
          subsidiaries={subsidiaries}
          onSubsidiaryChange={handleSubsidiaryChange}
        />
      );
      case 'audit-logs': return (
        <AuditLog 
          subsidiaryId={thresholdSubsidiaryId} 
          subsidiaries={subsidiaries}
          onSubsidiaryChange={handleSubsidiaryChange}
        />
      );
      case 'corporates': return <CorporateManager />;
      case 'cost-centers': return <CostCenterManager />;
      case 'departments': return <DepartmentManager />;
      case 'projects': return <ProjectManager />;
      case 'users': return <UserManager />;
      case 'permissions': return <PermissionManager />;
      case 'roles': return <RoleManager />;
      case 'benchmarking': return <BenchmarkingTable />;
      case 'consolidated':
      case 'reports':
        return <ConsolidatedReport />;
      case 'trend-analysis':
      case 'trends':
        return <TrendAnalysis />;
      case 'mafinda-management': return <ManagementPage />;
      case 'mafinda-data-entry': return <DataEntryPage />;
      case 'balance-sheet-manager':
      case 'cfd-balance-sheets':
        return (
          <div className="p-6">
            <BalanceSheetManager />
          </div>
        );
      case 'income-statement-manager':
      case 'cfd-income-statements':
        return (
          <div className="p-6">
            <IncomeStatementManager />
          </div>
        );
      case 'weekly-cashflow-manager':
      case 'cfd-weekly-cash-flows':
        return (
          <div className="p-6">
            <WeeklyCashFlowManager />
          </div>
        );
      case 'realization-manager':
      case 'cfd-realizations':
        return (
          <div className="p-6">
            <RealizationManager />
          </div>
        );
      case 'bank-loan-manager':
      case 'cfd-bank-loans':
        return (
          <div className="p-6">
            <BankLoanManager />
          </div>
        );
      case 'bank-manager':
        return (
          <div className="p-6">
            <BankManager />
          </div>
        );
      case 'corporate-sectors-manager':
        return (
          <div className="p-6">
            <CorporateSectorManager />
          </div>
        );
      case 'currencies-manager':
        return (
          <div className="p-6">
            <CurrencyManager />
          </div>
        );
      case 'cost-center-categories-manager':
        return (
          <div className="p-6">
            <CostCenterCategoryManager />
          </div>
        );
      case 'notification-configs-manager':
        return (
          <div className="p-6">
            <NotificationConfigManager />
          </div>
        );
      case 'system-configs':
        return (
          <div className="p-6">
            <SystemConfigManager />
          </div>
        );
      case 'crm-dashboard': return <CRMPage activeTab="dashboard" />;
      case 'crm-opportunities': return <CRMPage activeTab="opportunities" />;
      case 'crm-customers': return <CRMPage activeTab="customers" />;
      case 'crm-proposals': return <CRMPage activeTab="proposals" />;
      case 'crm-contracts': return <CRMPage activeTab="contracts" />;
      case 'crm-approvals': return <CRMPage activeTab="approvals" />;
      case 'crm-reimburse': return <CRMPage activeTab="reimburse" />;
      case 'profile': return <UserProfilePage />;
      default: return <ComingSoon page={currentPage} />;
    }
  }, [currentPage, thresholdSubsidiaryId, thresholdSubsidiaryName, subsidiaries]);

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
  const { language, user, isLoading } = useAuth();
  const common = commonsI18n[language];

  useEffect(() => {
    const handleOnline = () => toast.success(common.networkOnline, { id: 'network-status' });
    const handleOffline = () => toast.error(common.networkOffline, { id: 'network-status', duration: Infinity });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [common.networkOnline, common.networkOffline]);

  useEffect(() => {
    const handleRateLimited = (e: any) => {
      const { retryAfter } = e.detail;
      toast.error(
        common.rateLimit.replace('{retryAfter}', String(retryAfter || '—')),
        { id: 'rate-limit' }
      );
    };

    window.addEventListener('frs:rate-limited', handleRateLimited as EventListener);

    return () => {
      window.removeEventListener('frs:rate-limited', handleRateLimited as EventListener);
    };
  }, [common.rateLimit]);

  useEffect(() => {
    const handleMaintenance = () => {
      toast.error(common.errors.MAINTENANCE_MODE, { 
        id: 'maintenance-mode',
        duration: 10000 
      });
      // Redirect to login is handled automatically because user is cleared in apiFetch
    };

    window.addEventListener('frs:maintenance', handleMaintenance);
    return () => {
      window.removeEventListener('frs:maintenance', handleMaintenance);
    };
  }, [common.errors.MAINTENANCE_MODE]);

  if (isLoading) return null;

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/activate-account" element={<ActivateAccountPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const FRSAppWithProviders: React.FC = () => (
  <ErrorBoundary>
    <ToastProvider>
      <Toaster 
        position="bottom-right" 
        closeButton 
        duration={5000} 
        richColors 
        expand={true}
        toastOptions={{
          style: {
            padding: '16px 24px',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
      <QueryProvider>
        <BrowserRouter>
          <FRSApp />
        </BrowserRouter>
      </QueryProvider>
    </ToastProvider>
  </ErrorBoundary>
);

export default FRSAppWithProviders;
