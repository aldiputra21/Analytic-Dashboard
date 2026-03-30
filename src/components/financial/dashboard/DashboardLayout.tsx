// DashboardLayout.tsx - Main layout with sidebar navigation and header
// Requirements: 4.2, 9.1

import React, { useState } from 'react';
import {
  LayoutDashboard, BarChart3, TrendingUp, FileText, Settings,
  Users, Upload, Bell, LogOut, Building2, ChevronLeft, ChevronRight,
  Shield, Menu, Target, Database, UserSquare2, FolderKanban,
  CheckCircle, Receipt, ChevronDown,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { UserRole } from '../../../types/financial/user';

export type FRSPage =
  | 'dashboard' | 'benchmarking' | 'trends' | 'reports' | 'alerts'
  | 'data-entry' | 'bulk-import'
  | 'subsidiaries' | 'users' | 'thresholds' | 'audit-log'
  | 'mafinda-management' | 'mafinda-data-entry'
  // CRM sub-pages
  | 'crm-dashboard' | 'crm-opportunities' | 'crm-customers'
  | 'crm-proposals' | 'crm-contracts' | 'crm-approvals' | 'crm-reimburse';

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
  group: 'main' | 'data' | 'mafinda' | 'crm' | 'admin';
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
  { id: 'data-entry', label: 'Data Entry', icon: Upload, allowedRoles: ['owner', 'bod'], group: 'data' },
  { id: 'mafinda-data-entry', label: 'Input Keuangan', icon: Database, allowedRoles: ['owner', 'bod'], group: 'data' },
  // MAFINDA
  { id: 'mafinda-management', label: 'Manajemen', icon: Target, allowedRoles: ['owner', 'bod'], group: 'mafinda' },
  // CRM — tree with children
  {
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
  },
  // Admin
  { id: 'subsidiaries', label: 'Subsidiaries', icon: Building2, allowedRoles: ['owner'], group: 'admin' },
  { id: 'users', label: 'Users', icon: Users, allowedRoles: ['owner'], group: 'admin' },
  { id: 'thresholds', label: 'Thresholds', icon: Settings, allowedRoles: ['owner'], group: 'admin' },
  { id: 'audit-log', label: 'Audit Log', icon: Shield, allowedRoles: ['owner'], group: 'admin' },
];

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
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // CRM tree open by default if on a CRM page
  const [crmOpen, setCrmOpen] = useState(() => CRM_PAGES.includes(currentPage));

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
  );

  const groups: { key: NavItem['group']; label: string }[] = [
    { key: 'main', label: 'Analitik' },
    { key: 'data', label: 'Input Data' },
    { key: 'mafinda', label: 'MAFINDA' },
    { key: 'crm', label: 'CRM' },
    { key: 'admin', label: 'Admin' },
  ];

  const roleLabel: Record<UserRole, string> = {
    owner: 'Owner',
    bod: 'Board of Directors',
    subsidiary_manager: 'Subsidiary Manager',
  };

  // Find label for header
  const getPageLabel = (): string => {
    if (CRM_PAGES.includes(currentPage)) {
      const crmItem = NAV_ITEMS.find(n => n.id === 'crm-dashboard');
      const child = crmItem?.children?.find(c => c.id === currentPage);
      return child ? `CRM › ${child.label}` : 'CRM';
    }
    return NAV_ITEMS.find(n => n.id === currentPage)?.label ?? 'Dashboard';
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
            <p className="text-white font-bold text-sm leading-tight">MAFINDA</p>
            <p className="text-slate-400 text-[10px]">Financial Dashboard System</p>
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
            <p className="text-slate-400 text-[10px] truncate">{roleLabel[user.role]}</p>
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
