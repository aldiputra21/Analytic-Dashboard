// DashboardLayout.tsx - Main layout with sidebar navigation and header
// Requirements: 4.2, 9.1

import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  FileText,
  Settings,
  Users,
  Upload,
  Bell,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  Target,
  Database,
  UserSquare2,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { UserRole } from '../../../types/financial/user';

export type FRSPage =
  | 'dashboard'
  | 'benchmarking'
  | 'trends'
  | 'reports'
  | 'alerts'
  | 'data-entry'
  | 'bulk-import'
  | 'subsidiaries'
  | 'users'
  | 'thresholds'
  | 'audit-log'
  // MAFINDA pages
  | 'mafinda-management'
  | 'mafinda-data-entry'
  | 'mafinda-crm';

interface NavItem {
  id: FRSPage;
  label: string;
  icon: React.ElementType;
  allowedRoles?: UserRole[];
  badge?: number;
  group?: 'main' | 'data' | 'admin' | 'mafinda';
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
  { id: 'mafinda-crm', label: 'CRM', icon: UserSquare2, allowedRoles: ['owner', 'bod', 'subsidiary_manager'], group: 'mafinda' },
  // Admin
  { id: 'subsidiaries', label: 'Subsidiaries', icon: Building2, allowedRoles: ['owner'], group: 'admin' },
  { id: 'users', label: 'Users', icon: Users, allowedRoles: ['owner'], group: 'admin' },
  { id: 'thresholds', label: 'Thresholds', icon: Settings, allowedRoles: ['owner'], group: 'admin' },
  { id: 'audit-log', label: 'Audit Log', icon: Shield, allowedRoles: ['owner'], group: 'admin' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: FRSPage;
  onNavigate: (page: FRSPage) => void;
  alertCount?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentPage,
  onNavigate,
  alertCount = 0,
}) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
  );

  const mainItems = visibleItems.filter((i) => i.group === 'main');
  const dataItems = visibleItems.filter((i) => i.group === 'data');
  const mafindaItems = visibleItems.filter((i) => i.group === 'mafinda');
  const adminItems = visibleItems.filter((i) => i.group === 'admin');

  const roleLabel: Record<UserRole, string> = {
    owner: 'Owner',
    bod: 'Board of Directors',
    subsidiary_manager: 'Subsidiary Manager',
  };

  const SidebarContent = () => {
    const NavGroup = ({ label, items }: { label: string; items: NavItem[] }) => (
      <div className="mb-1">
        {!collapsed && (
          <p className="px-3 pt-3 pb-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {label}
          </p>
        )}
        {collapsed && <div className="border-t border-slate-700 mx-2 my-2" />}
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const badge = item.id === 'alerts' && alertCount > 0 ? alertCount : undefined;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white',
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
      </div>
    );

    return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 py-5 border-b border-slate-800', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <BarChart3 className="w-4.5 h-4.5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">FRS Monitor</p>
            <p className="text-slate-400 text-[10px]">Financial Ratio System</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {/* Main group */}
        <NavGroup label="Analitik" items={mainItems} />
        {/* Data group */}
        {dataItems.length > 0 && <NavGroup label="Input Data" items={dataItems} />}
        {/* MAFINDA group */}
        {mafindaItems.length > 0 && <NavGroup label="MAFINDA" items={mafindaItems} />}
        {/* Admin group */}
        {adminItems.length > 0 && <NavGroup label="Admin" items={adminItems} />}
      </nav>

      {/* User Info + Logout */}
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
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-slate-900 transition-all duration-200 shrink-0 relative',
          collapsed ? 'w-14' : 'w-56'
        )}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-16 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
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
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-900 capitalize">
              {NAV_ITEMS.find((n) => n.id === currentPage)?.label ?? 'Dashboard'}
            </h1>
          </div>
          {alertCount > 0 && (
            <button
              onClick={() => onNavigate('alerts')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              {alertCount} Alert{alertCount !== 1 ? 's' : ''}
            </button>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
