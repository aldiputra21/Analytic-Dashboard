// DashboardLayout.tsx - Main layout with sidebar navigation and header
// Requirements: 4.2, 9.1

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, BarChart3, TrendingUp, FileText, Settings,
  Users, Upload, Bell, LogOut, Building2, ChevronLeft, ChevronRight,
  Shield, Menu, Target, Database, UserSquare2, FolderKanban,
  CheckCircle, Receipt, ChevronDown, Scale, FileBarChart, ArrowLeftRight,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { UserRole } from '../../../types/financial/user';
import { balanceSheetI18n } from '../../../i18n/balance-sheet';
import { incomeStatementI18n } from '../../../i18n/income-statement';
import { weeklyCashFlowI18n } from '../../../i18n/weekly-cash-flow';

export type FRSPage =
  | 'dashboard' | 'benchmarking' | 'trends' | 'reports' | 'alerts'
  | 'corporates' | 'cost-centers' | 'departments' | 'projects' | 'targets'
  | 'users' | 'thresholds' | 'audit-log'
  | 'cfd-balance-sheets' | 'cfd-income-statements' | 'cfd-weekly-cash-flows'
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
  group: 'main' | 'data' | 'corporate-management' | 'crm' | 'admin';
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
  
  const navItems = useMemo(() => {
    const items: NavItem[] = [
      // Main
      { id: 'dashboard', label: language === 'id' ? 'Dashboard' : 'Dashboard', icon: LayoutDashboard, group: 'main', requiredPermissions: ['cfd.dashboard.read'] },
      { id: 'benchmarking', label: language === 'id' ? 'Benchmarking' : 'Benchmarking', icon: BarChart3, group: 'main', requiredPermissions: ['cfd.benchmarking.read'] },
      { id: 'trends', label: language === 'id' ? 'Analisis Tren' : 'Trend Analysis', icon: TrendingUp, group: 'main', requiredPermissions: ['cfd.trends.read'] },
      { id: 'reports', label: language === 'id' ? 'Laporan' : 'Reports', icon: FileText, group: 'main', requiredPermissions: ['cfd.reports.read'] },
      { id: 'alerts', label: language === 'id' ? 'Pemberitahuan' : 'Alerts', icon: Bell, group: 'main', requiredPermissions: ['cfd.alerts.read'] },
      // Data
      { id: 'cfd-balance-sheets', label: balanceSheetI18n[language].title, icon: Scale, requiredPermissions: ['cfd.balance_sheets.read'], group: 'data' },
      { id: 'cfd-income-statements', label: incomeStatementI18n[language].title, icon: FileBarChart, requiredPermissions: ['cfd.income_statements.read'], group: 'data' },
      { id: 'cfd-weekly-cash-flows', label: weeklyCashFlowI18n[language].title, icon: ArrowLeftRight, requiredPermissions: ['cfd.weekly_cash_flows.read'], group: 'data' },
      // Corporate Management
      { id: 'corporates', label: language === 'id' ? 'Perusahaan' : 'Corporates', icon: Building2, requiredPermissions: ['cfd.corporates.read'], group: 'corporate-management' },
      { id: 'cost-centers', label: language === 'id' ? 'Cost Center' : 'Cost Center', icon: Target, requiredPermissions: ['cfd.cost_centers.read'], group: 'corporate-management' },
      { id: 'departments', label: language === 'id' ? 'Departemen' : 'Departments', icon: Building2, requiredPermissions: ['public.departments.read'], group: 'corporate-management' },
      { id: 'projects', label: language === 'id' ? 'Proyek' : 'Projects', icon: FolderKanban, requiredPermissions: ['public.projects.read'], group: 'corporate-management' },
      { id: 'targets', label: language === 'id' ? 'Target' : 'Targets', icon: Target, requiredPermissions: ['public.targets.read'], group: 'corporate-management' },
      // CRM — tree with children
      {
        id: 'crm-dashboard',
        label: 'CRM',
        icon: UserSquare2,
        requiredPermissions: ['crm.dashboard.read'],
        group: 'crm',
        children: [
          { id: 'crm-dashboard', label: language === 'id' ? 'Dashboard' : 'Dashboard', icon: LayoutDashboard, requiredPermissions: ['crm.dashboard.read'] },
          { id: 'crm-opportunities', label: language === 'id' ? 'Peluang' : 'Opportunities', icon: FolderKanban, requiredPermissions: ['crm.opportunities.read'] },
          { id: 'crm-customers', label: language === 'id' ? 'Pelanggan' : 'Customers', icon: Users, requiredPermissions: ['crm.customers.read'] },
          { id: 'crm-proposals', label: language === 'id' ? 'Proposal' : 'Proposals', icon: FileText, requiredPermissions: ['crm.proposals.read'] },
          { id: 'crm-contracts', label: language === 'id' ? 'Kontrak' : 'Contracts', icon: TrendingUp, requiredPermissions: ['crm.contracts.read'] },
          { id: 'crm-approvals', label: language === 'id' ? 'Persetujuan' : 'Approvals', icon: CheckCircle, requiredPermissions: ['approvals.read'] },
          { id: 'crm-reimburse', label: language === 'id' ? 'Reimburse' : 'Reimburse', icon: Receipt, requiredPermissions: ['crm.reimburse.read'] },
        ],
      },
      // Admin
      { id: 'users', label: language === 'id' ? 'Pengguna' : 'Users', icon: Users, requiredPermissions: ['cfd.users.read'], group: 'admin' },
      { id: 'thresholds', label: language === 'id' ? 'Ambang Batas' : 'Thresholds', icon: Settings, requiredPermissions: ['cfd.thresholds.read'], group: 'admin' },
      { id: 'audit-log', label: language === 'id' ? 'Log Audit' : 'Audit Log', icon: Shield, requiredPermissions: ['cfd.audit_log.read'], group: 'admin' },
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
    return language === 'id' ? [
      { key: 'main', label: 'Analitik' },
      { key: 'data', label: 'Input Data' },
      { key: 'corporate-management', label: 'Pengelolaan Perusahaan' },
      { key: 'crm', label: 'CRM' },
      { key: 'admin', label: 'Admin' },
    ] : [
      { key: 'main', label: 'Analytics' },
      { key: 'data', label: 'Data Entry' },
      { key: 'corporate-management', label: 'Corporate Management' },
      { key: 'crm', label: 'CRM' },
      { key: 'admin', label: 'Admin' },
    ];
  }, [language]);

  // User role label from database
  const userRoleLabel = user?.roleDescription || (user?.role === 'owner' ? 'Owner' : user?.role === 'bod' ? 'Board of Directors' : 'Subsidiary Manager');

  // Find label for header
  const getPageLabel = (): string => {
    if (CRM_PAGES.includes(currentPage)) {
      const crmItem = navItems.find(n => n.id === 'crm-dashboard');
      const child = crmItem?.children?.find(c => c.id === currentPage);
      return child ? `CRM › ${child.label}` : 'CRM';
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

      {/* User + Logout */}
      <div className={cn('border-t border-slate-800 p-3', collapsed && 'px-2')}>
        {!collapsed && user && (
          <div className="mb-2 px-2">
            <p className="text-white text-xs font-semibold truncate">{user.fullName}</p>
            <p className="text-slate-400 text-[10px] truncate">{userRoleLabel}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
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
          <div className="flex bg-slate-100 p-1 rounded-xl items-center">
            <button 
              onClick={() => setLanguage('id')}
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                language === 'id' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              ID
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
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
              {alertCount} Alert{alertCount !== 1 ? 's' : ''}
            </button>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
