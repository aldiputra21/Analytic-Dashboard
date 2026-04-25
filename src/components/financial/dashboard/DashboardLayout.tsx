// DashboardLayout.tsx - Main layout with sidebar navigation and header
// Requirements: 4.2, 9.1

import React, { useState } from 'react';
import {
  LayoutDashboard, BarChart3, TrendingUp, FileText, Settings,
  Users, Upload, Bell, LogOut, Building2, ChevronLeft, ChevronRight,
  Shield, Menu, Target, Database, UserSquare2, FolderKanban,
  CheckCircle, Receipt, ChevronDown, TrendingDown,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { UserRole } from '../../../types/financial/user';
import { useLanguage } from '../shared/LanguageContext';

export type FRSPage =
  | 'dashboard' | 'benchmarking' | 'trends' | 'reports' | 'alerts'
  | 'data-entry' | 'bulk-import'
  | 'subsidiaries' | 'users' | 'thresholds' | 'audit-log'
  | 'mafinda-management' | 'mafinda-data-entry'
  // CRM sub-pages
  | 'crm-dashboard' | 'crm-opportunities' | 'crm-customers'
  | 'crm-proposals' | 'crm-contracts' | 'crm-approvals' | 'crm-reimburse'
  // Cost Control sub-pages
  | 'cost-control-dashboard' | 'cost-control-master' | 'cost-control-budget'
  | 'cost-control-revenue' | 'cost-control-cost';

interface NavChild {
  id: FRSPage;
  label: string;
  icon: React.ElementType;
  allowedRoles?: UserRole[];
}

interface NavItem {
  id: FRSPage;
  label: string;
  icon: React.ElementType;
  allowedRoles?: UserRole[];
  badge?: number;
  group: 'main' | 'data' | 'mafinda' | 'crm' | 'admin' | 'cost-control';
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  // Main
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'benchmarking', label: 'Benchmarking', icon: BarChart3, group: 'main' },
  { id: 'trends', label: 'Trend Analysis', icon: TrendingUp, group: 'main' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'main' },
  { id: 'alerts', label: 'Alerts', icon: Bell, group: 'main' },
  // Data
  //{ id: 'data-entry', label: 'Data Entry', icon: Upload, allowedRoles: ['owner', 'bod'], group: 'data' },
  { id: 'mafinda-data-entry', label: 'Data Entry', icon: Database, allowedRoles: ['owner', 'bod'], group: 'data' },
  // MAFINDA
  { id: 'mafinda-management', label: 'Manajemen', icon: Target, allowedRoles: ['owner', 'bod'], group: 'mafinda' },
  // CRM — tree with children (Temporarily hidden per request)
  /* {
    id: 'crm-dashboard',
    label: 'CRM',
    icon: UserSquare2,
    allowedRoles: ['owner', 'bod', 'subsidiary_manager'],
    group: 'crm',
    children: [
      { id: 'crm-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'crm-opportunities', label: 'Opportunities', icon: FolderKanban },
      { id: 'crm-customers', label: 'Customers', icon: Users },
      { id: 'crm-proposals', label: 'Proposals', icon: FileText },
      { id: 'crm-contracts', label: 'Contracts', icon: TrendingUp },
      { id: 'crm-approvals', label: 'Approvals', icon: CheckCircle },
      { id: 'crm-reimburse', label: 'Reimburse', icon: Receipt },
    ],
  }, */
  // Cost Control
  {
    id: 'cost-control-dashboard',
    label: 'Cost Control',
    icon: Database,
    allowedRoles: ['owner', 'bod', 'subsidiary_manager'],
    group: 'cost-control',
    children: [
      { id: 'cost-control-dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'cost-control-master', label: 'Master Cost Center', icon: Settings },
      { id: 'cost-control-budget', label: 'Input Target Budget', icon: Upload },
      { id: 'cost-control-revenue', label: 'Realisasi Revenue', icon: TrendingUp },
      { id: 'cost-control-cost', label: 'Realisasi Biaya', icon: TrendingDown },
    ],
  },
  // Admin
  { id: 'subsidiaries', label: 'Subsidiaries', icon: Building2, allowedRoles: ['owner'], group: 'admin' },
  { id: 'users', label: 'Users', icon: Users, allowedRoles: ['owner'], group: 'admin' },
  { id: 'thresholds', label: 'Thresholds', icon: Settings, allowedRoles: ['owner'], group: 'admin' },
  { id: 'audit-log', label: 'Audit Log', icon: Shield, allowedRoles: ['owner'], group: 'admin' },
];

const CRM_PAGES: FRSPage[] = ['crm-dashboard', 'crm-opportunities', 'crm-customers', 'crm-proposals', 'crm-contracts', 'crm-approvals', 'crm-reimburse'];
const COST_CONTROL_PAGES: FRSPage[] = ['cost-control-dashboard', 'cost-control-master', 'cost-control-budget', 'cost-control-revenue', 'cost-control-cost'];

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: FRSPage;
  onNavigate: (page: FRSPage) => void;
  alertCount?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children, currentPage, onNavigate, alertCount = 0,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Tree logic
  const [crmOpen, setCrmOpen] = useState(() => CRM_PAGES.includes(currentPage));
  const [costControlOpen, setCostControlOpen] = useState(() => COST_CONTROL_PAGES.includes(currentPage));

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
  );

  const groups: { key: NavItem['group']; label: string }[] = [
    { key: 'main', label: t('group.main') },
    { key: 'data', label: t('group.data') },
    { key: 'mafinda', label: t('group.mafinda') },
    { key: 'crm', label: t('group.crm') },
    { key: 'cost-control', label: t('group.cost-control') },
    { key: 'admin', label: t('group.admin') },
  ];

  const roleLabel: Record<UserRole, string> = {
    owner: t('role.owner'),
    bod: t('role.bod'),
    subsidiary_manager: t('role.subsidiary_manager'),
  };

  // Find label for header
  const getPageLabel = (): string => {
    if (CRM_PAGES.includes(currentPage)) {
      const crmItem = NAV_ITEMS.find(n => n.id === 'crm-dashboard');
      const child = crmItem?.children?.find(c => c.id === currentPage);
      return child ? `${t('nav.crm-dashboard')} › ${t(`nav.${child.id}`, child.label)}` : t('nav.crm-dashboard');
    }
    if (COST_CONTROL_PAGES.includes(currentPage)) {
      const costItem = NAV_ITEMS.find(n => n.id === 'cost-control-dashboard');
      const child = costItem?.children?.find(c => c.id === currentPage);
      return child ? `${t('nav.cost-control-dashboard')} › ${t(`nav.${child.id}`, child.label)}` : t('nav.cost-control-dashboard');
    }
    const baseLabel = NAV_ITEMS.find(n => n.id === currentPage)?.label ?? 'Dashboard';
    return t(`nav.${currentPage}`, baseLabel);
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
            <p className="text-slate-400 text-[10px]">{t('sidebar.subtitle')}</p>
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
                const isParent = item.children && item.children.length > 0;
                
                const activePages = item.id === 'crm-dashboard' ? CRM_PAGES : item.id === 'cost-control-dashboard' ? COST_CONTROL_PAGES : [];
                const isParentActive = isParent && activePages.includes(currentPage);
                const isOpen = item.id === 'crm-dashboard' ? crmOpen : item.id === 'cost-control-dashboard' ? costControlOpen : false;
                
                const isActive = !isParent && currentPage === item.id;
                const badge = item.id === 'alerts' && alertCount > 0 ? alertCount : undefined;

                if (isParent) {
                  return (
                    <div key={item.id}>
                      {/* Parent button */}
                      <button
                        onClick={() => {
                          if (collapsed) {
                            setCollapsed(false);
                            if (item.id === 'crm-dashboard') setCrmOpen(true);
                            if (item.id === 'cost-control-dashboard') setCostControlOpen(true);
                          } else {
                            if (item.id === 'crm-dashboard') setCrmOpen(o => !o);
                            if (item.id === 'cost-control-dashboard') setCostControlOpen(o => !o);
                          }
                          if (!isOpen) onNavigate(item.id);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative',
                          isParentActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                          collapsed && 'justify-center px-2'
                        )}
                        title={collapsed ? t(`nav.${item.id}`, item.label) : undefined}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left">{t(`nav.${item.id}`, item.label)}</span>
                            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
                          </>
                        )}
                      </button>
                      {/* Children */}
                      {!collapsed && isOpen && (
                        <div className="ml-3 mt-0.5 pl-3 border-l border-slate-700 space-y-0.5">
                          {item.children!.map(child => {
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
                                <span>{t(`nav.${child.id}`, child.label)}</span>
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
                    title={collapsed ? t(`nav.${item.id}`, item.label) : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{t(`nav.${item.id}`, item.label)}</span>
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
            <p className="text-slate-400 text-[10px] truncate">{roleLabel[user.role]}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? t('sidebar.logout') : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>{t('sidebar.logout')}</span>}
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
          
          <button
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase shrink-0 bg-white"
            title="Toggle Language"
          >
            {language}
          </button>

          {alertCount > 0 && (
            <button onClick={() => onNavigate('alerts')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
              <Bell className="w-3.5 h-3.5" />
              {alertCount} {alertCount !== 1 ? t('header.alertPlural') : t('header.alertSingular')}
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
