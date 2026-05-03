// DashboardLayout.tsx - Main layout with sidebar navigation and header
// Requirements: 4.2, 9.1

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, BarChart3, TrendingUp, FileText, Settings,
  Users, Upload, Bell, LogOut, Building2, ChevronLeft, ChevronRight,
  Shield, Menu, Target, Database, UserSquare2, FolderKanban,
  CheckCircle, Receipt, ChevronDown, Scale, FileBarChart, ArrowLeftRight,
  ClipboardList, Landmark, DollarSign, Layers, Languages,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { UserRole } from '../../../types/financial/user';
import { UserMenu } from '../UserMenu';
import { balanceSheetI18n } from '../../../i18n/balance-sheet';
import { incomeStatementI18n } from '../../../i18n/income-statement';
import { weeklyCashFlowI18n } from '../../../i18n/weekly-cash-flow';
import { navigationI18n } from '../../../i18n/navigation';
import { useNetworkResilience } from '../../../hooks/financial/useNetworkResilience';

export type FRSPage =
  | 'dashboard' | 'benchmarking' | 'trends' | 'reports' | 'alerts'
  | 'corporates' | 'cost-centers' | 'departments' | 'projects' | 'targets'
  | 'users' | 'roles' | 'permissions' | 'thresholds' | 'audit-logs' | 'profile'
  | 'cfd-balance-sheets' | 'cfd-income-statements' | 'cfd-weekly-cash-flows'
  | 'cfd-realizations' | 'cfd-bank-loans' | 'cfd-cash-flow-projections'
  | 'weekly-cashflow-manager' | 'realization-manager' | 'bank-loan-manager'
  | 'bank-manager' | 'corporate-sectors-manager' | 'currencies-manager'
  | 'cost-center-categories-manager' | 'notification-configs-manager'
  | 'consolidated' | 'trend-analysis' | 'mafinda-management' | 'mafinda-data-entry'
  | 'balance-sheet-manager' | 'income-statement-manager' | 'system-configs'
  // CRM sub-pages
  | 'crm-dashboard' | 'crm-opportunities' | 'crm-customers'
  | 'crm-proposals' | 'crm-contracts' | 'crm-approvals' | 'crm-reimburse';

interface NavChild {
  id: FRSPage;
  label: string;
  icon: React.ElementType;
  requiredPermissions: string[];
}

interface NavItem {
  id: FRSPage;
  label: string;
  icon: React.ElementType;
  requiredPermissions: string[];
  badge?: number;
  group: 'main' | 'financial-statements' | 'cash-flow' | 'corporate-management' | 'business-management' | 'crm' | 'user-management' | 'system-admin';
  children?: NavChild[];
}

const CRM_PAGES: FRSPage[] = ['crm-dashboard', 'crm-opportunities', 'crm-customers', 'crm-proposals', 'crm-contracts', 'crm-approvals', 'crm-reimburse'];

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: FRSPage;
  onNavigate: (page: FRSPage) => void;
  alertCount?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children, currentPage, onNavigate, alertCount = 0,
}) => {
  const { user, logout, hasPermission, language, setLanguage } = useAuth();
  useNetworkResilience();
  
  const navItems = useMemo(() => {
    const t = navigationI18n[language];
    const items: NavItem[] = [
      // Main
      { id: 'dashboard', label: t.menus.dashboard, icon: LayoutDashboard, group: 'main', requiredPermissions: ['cfd.dashboard.read'] },
      { id: 'benchmarking', label: t.menus.benchmarking, icon: BarChart3, group: 'main', requiredPermissions: ['cfd.benchmarking.read'] },
      { id: 'trends', label: t.menus.trends, icon: TrendingUp, group: 'main', requiredPermissions: ['cfd.trends.read'] },
      { id: 'reports', label: t.menus.reports, icon: FileText, group: 'main', requiredPermissions: ['cfd.reports.read'] },
      { id: 'alerts', label: t.menus.alerts, icon: Bell, group: 'main', requiredPermissions: ['cfd.alerts.read'] },

      // 1. Financial Statements (Laporan Keuangan)
      { id: 'cfd-balance-sheets', label: balanceSheetI18n[language].title, icon: Scale, requiredPermissions: ['cfd.balance_sheets.read'], group: 'financial-statements' },
      { id: 'cfd-income-statements', label: incomeStatementI18n[language].title, icon: FileBarChart, requiredPermissions: ['cfd.income_statements.read'], group: 'financial-statements' },
      { id: 'targets', label: t.menus.targets, icon: Target, requiredPermissions: ['public.targets.read'], group: 'financial-statements' },

      // 2. Cash Flow (Arus Kas)
      { id: 'cfd-weekly-cash-flows', label: weeklyCashFlowI18n[language].title, icon: ArrowLeftRight, requiredPermissions: ['cfd.weekly_cash_flows.read'], group: 'cash-flow' },
      { id: 'cfd-realizations', label: t.menus.realizations, icon: ClipboardList, requiredPermissions: ['cfd.realizations.read'], group: 'cash-flow' },
      { id: 'cfd-cash-flow-projections', label: t.menus.cashFlowProjections, icon: TrendingUp, requiredPermissions: ['cfd.cash_flow_projections.read'], group: 'cash-flow' },
      { id: 'cfd-bank-loans', label: t.menus.bankLoans, icon: Landmark, requiredPermissions: ['cfd.bank_loans.read'], group: 'cash-flow' },

      // 3. Corporate Management (Pengelolaan Perusahaan)
      { id: 'corporates', label: t.menus.corporates, icon: Building2, requiredPermissions: ['cfd.corporates.read'], group: 'corporate-management' },
      { id: 'departments', label: t.menus.departments, icon: Building2, requiredPermissions: ['public.departments.read'], group: 'corporate-management' },
      { id: 'cost-centers', label: t.menus.costCenters, icon: Target, requiredPermissions: ['cfd.cost_centers.read'], group: 'corporate-management' },
      { id: 'projects', label: t.menus.projects, icon: FolderKanban, requiredPermissions: ['public.projects.read'], group: 'corporate-management' },

      // CRM
      {
        id: 'crm-dashboard',
        label: t.menus.crm.dashboard,
        icon: UserSquare2,
        requiredPermissions: ['crm.dashboard.read'],
        group: 'crm',
        children: [
          { id: 'crm-dashboard', label: t.menus.crm.dashboard, icon: LayoutDashboard, requiredPermissions: ['crm.dashboard.read'] },
          { id: 'crm-opportunities', label: t.menus.crm.opportunities, icon: FolderKanban, requiredPermissions: ['crm.opportunities.read'] },
          { id: 'crm-customers', label: t.menus.crm.customers, icon: Users, requiredPermissions: ['crm.customers.read'] },
          { id: 'crm-proposals', label: t.menus.crm.proposals, icon: FileText, requiredPermissions: ['crm.proposals.read'] },
          { id: 'crm-contracts', label: t.menus.crm.contracts, icon: TrendingUp, requiredPermissions: ['crm.contracts.read'] },
          { id: 'crm-approvals', label: t.menus.crm.approvals, icon: CheckCircle, requiredPermissions: ['approvals.read'] },
          { id: 'crm-reimburse', label: t.menus.crm.reimburse, icon: Receipt, requiredPermissions: ['crm.reimburse.read'] },
        ],
      },

      // 4. Business Management (Pengelolaan Bisnis)
      { id: 'corporate-sectors-manager', label: t.menus.corporateSectors, icon: Building2, requiredPermissions: ['public.corporate_sectors.read'], group: 'business-management' },
      { id: 'currencies-manager', label: t.menus.currencies, icon: DollarSign, requiredPermissions: ['public.currencies.read'], group: 'business-management' },
      { id: 'bank-manager', label: t.menus.masterBank, icon: Building2, requiredPermissions: ['public.banks.read'], group: 'business-management' },
      { id: 'cost-center-categories-manager', label: t.menus.costCenterCategories, icon: Layers, requiredPermissions: ['public.cost_center_categories.read'], group: 'business-management' },

      // 5. User Management (Pengelolaan Pengguna)
      { id: 'users', label: t.menus.users, icon: Users, requiredPermissions: ['cfd.users.read'], group: 'user-management' },
      { id: 'roles', label: t.menus.roles, icon: Shield, requiredPermissions: ['cfd.roles.read'], group: 'user-management' },
      { id: 'permissions', label: t.menus.permissions, icon: Shield, requiredPermissions: ['cfd.permissions.read'], group: 'user-management' },

      // 6. System Management (Pengelolaan & Monitoring Sistem)
      { id: 'thresholds', label: t.menus.thresholds, icon: Settings, requiredPermissions: ['cfd.thresholds.read'], group: 'system-admin' },
      { id: 'notification-configs-manager', label: t.menus.notificationConfigs, icon: Bell, requiredPermissions: ['public.notification_configs.read'], group: 'system-admin' },
      { id: 'system-configs', label: t.menus.systemConfigs, icon: Settings, requiredPermissions: ['public.system_configs.read'], group: 'system-admin' },
      { id: 'audit-logs', label: t.menus.auditLog, icon: Shield, requiredPermissions: ['cfd.audit_log.read'], group: 'system-admin' },
    ];
    return items;
  }, [language]);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // CRM tree open by default if on a CRM page
  const [crmOpen, setCrmOpen] = useState(() => CRM_PAGES.includes(currentPage));

  const canAccessItem = (item: Pick<NavItem, 'requiredPermissions'>) => {
    if (!user) return false;

    return item.requiredPermissions.some((permission) => hasPermission(permission));
  };

  const visibleItems = useMemo(() => navItems.filter((item) => {
    if (!canAccessItem(item)) return false;
    if (!item.children?.length) return true;
    return item.children.some((child) => canAccessItem(child));
  }), [navItems, user?.id, user?.permissions]);

  const groups: { key: NavItem['group']; label: string }[] = useMemo(() => {
    const t = navigationI18n[language];
    return [
      { key: 'main', label: t.groups.main },
      { key: 'financial-statements', label: t.groups.financialStatements },
      { key: 'cash-flow', label: t.groups.cashFlow },
      { key: 'corporate-management', label: t.groups.corporateManagement },
      { key: 'crm', label: t.groups.crm },
      { key: 'business-management', label: t.groups.businessManagement },
      { key: 'user-management', label: t.groups.userManagement },
      { key: 'system-admin', label: t.groups.systemAdmin },
    ];
  }, [language]);

  // User role label from database
  // User role label from database
  const userRoleLabel = user?.roleDescription || (user?.role ? user.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'User');

  // Find label for header
  const getPageLabel = (): string => {
    const t = navigationI18n[language];
    if (CRM_PAGES.includes(currentPage)) {
      const crmItem = navItems.find(n => n.id === 'crm-dashboard');
      const child = crmItem?.children?.find(c => c.id === currentPage);
      return child ? t.user.breadcrumbCrm.replace('{page}', child.label) : 'CRM';
    }
    return navItems.find(n => n.id === currentPage)?.label ?? 'Dashboard';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 py-5 border-b border-slate-800', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
          <img src="/logo-titian.png" alt="Titian Logo" className="w-6 h-6 object-contain" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">CFD</p>
            <p className="text-slate-400 text-[10px]">Corporate Finance Dashboard</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {groups.map(({ key, label }) => {
          const items = visibleItems.filter(i => i.group === key);
          if (items.length === 0) return null;
          return (
            <div key={key} className="mb-1">
              {!collapsed && (
                <p className="px-3 pt-3 pb-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {label}
                </p>
              )}
              {collapsed && <div className="border-t border-slate-700 mx-2 my-2" />}
              {items.map((item) => {
                const Icon = item.icon;
                const isCrmParent = item.children && item.children.length > 0;
                const isCrmActive = isCrmParent && CRM_PAGES.includes(currentPage);
                const isActive = !isCrmParent && currentPage === item.id;
                const badge = item.id === 'alerts' && alertCount > 0 ? alertCount : undefined;

                if (isCrmParent) {
                  return (
                    <div key={item.id}>
                      {/* CRM parent button */}
                      <button
                        onClick={() => {
                          if (collapsed) {
                            setCollapsed(false);
                            setCrmOpen(true);
                          } else {
                            setCrmOpen(o => !o);
                          }
                          if (!crmOpen) onNavigate('crm-dashboard');
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative',
                          isCrmActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                          collapsed && 'justify-center px-2'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', crmOpen && 'rotate-180')} />
                          </>
                        )}
                      </button>
                      {/* CRM children */}
                      {!collapsed && crmOpen && (
                        <div className="ml-3 mt-0.5 pl-3 border-l border-slate-700 space-y-0.5">
                          {item.children!.filter((child) => canAccessItem(child)).map(child => {
                            const ChildIcon = child.icon;
                            const isChildActive = currentPage === child.id;
                            return (
                              <button
                                key={child.id}
                                onClick={() => { onNavigate(child.id); setMobileOpen(false); }}
                                className={cn(
                                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors',
                                  isChildActive
                                    ? 'bg-indigo-500 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                )}
                              >
                                <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>{child.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative',
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {badge !== undefined && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && badge !== undefined && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Logout Only (User Info moved to Header) */}
      <div className={cn('border-t border-slate-800 p-3', collapsed && 'px-2')}>
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? navigationI18n[language].user.logout : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{navigationI18n[language].user.logout}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn('hidden md:flex flex-col bg-slate-900 transition-all duration-200 shrink-0 relative', collapsed ? 'w-14' : 'w-56')}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-16 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-slate-900 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-900">{getPageLabel()}</h1>
          </div>
          
          {/* Language Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl items-center gap-0.5">
            <div className="flex items-center justify-center w-6 h-6 text-slate-400 ml-1">
              <Languages size={14} />
            </div>
            <button 
              onClick={() => setLanguage('id')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                language === 'id' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              ID
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer",
                language === 'en' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              EN
            </button>
          </div>

          {alertCount > 0 && (
            <button onClick={() => onNavigate('alerts')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
              <Bell className="w-3.5 h-3.5" />
              {navigationI18n[language].user.alertsHeader.replace('{count}', String(alertCount))}
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />
          
          <UserMenu onNavigate={onNavigate} />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
