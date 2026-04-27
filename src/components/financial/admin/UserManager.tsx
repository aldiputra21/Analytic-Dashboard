import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Search, Edit2, Shield, X, AlertCircle, CheckCircle2,
  RefreshCw, Users, Info, FilterX, Key, User,
  Mail, ShieldAlert, Trash2, Check, Send, Filter,
  ChevronLeft, ChevronRight, Building2, ShieldCheck, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { useDepartments } from '../../../hooks/financial/useDepartments';
import { useRoles } from '../../../hooks/financial/useRoles';
import { toast } from 'sonner';
import { z } from 'zod';
import { userManagerI18n } from '../../../i18n/user-manager';
import { commonsI18n } from '../../../i18n/commons';
import { FRSUser, UserCorporateAccess } from '../../../types/financial/user';
import { SearchableSelect } from '../shared/SearchableSelect';

// --- Shared Components ---

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl';
}> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn("bg-white rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh]", sizeClasses[size])}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <User size={20} />
            </div>
            {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all cursor-pointer group">
            <X size={20} className="text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode; color?: string }> = ({ title, icon, color = 'border-indigo-500' }) => (
  <div className={cn("flex items-center gap-3 pb-2 border-b-2", color)}>
    {icon}
    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{title}</h4>
  </div>
);

const FormField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, error, required, children }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] ml-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-rose-500 font-bold ml-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-1">
      <AlertCircle size={10} /> {error}
    </p>}
  </div>
);

// --- Main Component ---

export const UserManager: React.FC = () => {
  const { hasPermission, language } = useAuth();
  const t = userManagerI18n[language];
  const common = commonsI18n[language];
  const { corporates } = useCorporates();
  const { departments } = useDepartments();
  const rolesFilters = useMemo(() => ({ isActive: true }), []);
  const { data: roles } = useRoles(rolesFilters);

  const canWrite = hasPermission('cfd.users.write');
  const canReset = hasPermission('cfd.users.reset_password');

  const roleOptions = useMemo(() => (roles || []).map(r => ({
    value: r.id,
    label: r.name,
    sublabel: r.scope.toUpperCase()
  })), [roles]);

  const scopeOptions = [
    { value: 'system', label: 'System' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'department', label: 'Department' }
  ];

  // Validation Schemas
  const accessSchema = z.object({
    roleId: z.string().optional(),
    corporateId: z.string().optional(),
    departmentId: z.string().optional(),
    scope: z.string().optional(),
  });

  const userSchema = z.object({
    fullName: z.string().min(3, t.validation.fullNameMin),
    username: z.string().min(3, t.validation.usernameMin),
    email: z.string().email(t.validation.emailInvalid),
    isActive: z.boolean(),
    accesses: z.array(accessSchema).optional()
  }).superRefine((data, ctx) => {
    if (!editingUser) {
      if (!data.accesses || data.accesses.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.validation.roleRequired, path: ['accesses'] });
      } else {
        data.accesses.forEach((access, idx) => {
          if (!access.roleId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.validation.roleRequired, path: ['accesses', idx, 'roleId'] });
          }
          if (access.scope !== 'system' && !access.corporateId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: t.validation.corporateRequired, path: ['accesses', idx, 'corporateId'] });
          }
        });
      }
    }
  });

  // State
  const [users, setUsers] = useState<FRSUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: 'all',
    verified: 'all'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<FRSUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Access Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessUser, setAccessUser] = useState<FRSUser | null>(null);
  const [userAccesses, setUserAccesses] = useState<UserCorporateAccess[]>([]);
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [isFetchingAccess, setIsFetchingAccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    isActive: true,
    accesses: [] as { roleId: string; corporateId: string; departmentId: string; scope: string }[]
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        search: appliedFilters.search,
        status: appliedFilters.status,
        verified: appliedFilters.verified
      });

      const res = await apiFetch(`/api/users?${params}`);
      if (!res.ok) throw new Error(common.errorLoadTable);

      const data = await res.json();
      setUsers(data.data || []);
      setTotalCount(data.totalCount || data.data?.length || 0);
    } catch (err: any) {
      setError(err.message || common.errorLoadTable);
      toast.error(err.message || common.errorLoadTable);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, appliedFilters, common.errorLoadTable]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleApplyFilter = () => {
    setAppliedFilters({
      search: filterSearch,
      status: filterStatus,
      verified: filterVerified
    });
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setFilterSearch('');
    setFilterStatus('all');
    setFilterVerified('all');
    setAppliedFilters({
      search: '',
      status: 'all',
      verified: 'all'
    });
    setCurrentPage(1);
  };

  const handleOpenModal = (mode: 'create' | 'edit', user?: FRSUser) => {
    setModalMode(mode);
    if (user) {
      setEditingUser(user);
      setFormData({
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
        accesses: []
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        username: '',
        email: '',
        isActive: true,
        accesses: [{ roleId: '', corporateId: '', departmentId: '', scope: 'corporate' }]
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const validation = userSchema.safeParse(formData);
    if (!validation.success) {
      validation.error.issues.forEach(err => toast.error(err.message));
      setIsSaving(false);
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(validation.data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || t.alerts.errorSave);
      }

      toast.success(editingUser ? t.alerts.successUpdate : t.alerts.successSave);
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user: FRSUser) => {
    try {
      const res = await apiFetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || t.alerts.errorStatus);
      }
      toast.success(t.alerts.successStatus);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResendActivation = async (user: FRSUser) => {
    try {
      const res = await apiFetch(`/api/users/${user.id}/resend-activation`, {
        method: 'POST'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || t.alerts.errorActivationSend);
      }

      toast.success(t.alerts.successActivationSent);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleForceResetPassword = async (user: FRSUser) => {
    try {
      const res = await apiFetch(`/api/users/${user.id}/force-reset-password`, {
        method: 'POST'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || t.alerts.errorResetSend);
      }

      toast.success(t.alerts.successResetSent);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleOpenAccessModal = async (user: FRSUser) => {
    setAccessUser(user);
    setIsFetchingAccess(true);
    setIsAccessModalOpen(true);
    try {
      const res = await apiFetch(`/api/users/${user.id}/corporate-access`);
      if (!res.ok) throw new Error(t.alerts.errorLoadAccess);

      const data = await res.json();
      setUserAccesses(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsFetchingAccess(false);
    }
  };

  const handleAddAccessEntry = () => {
    setUserAccesses(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        userId: accessUser?.id || '',
        roleId: roles?.[0]?.id || '',
        scope: 'corporate',
        corporateId: undefined,
        departmentId: undefined
      } as UserCorporateAccess
    ]);
  };

  const handleRemoveAccessEntry = (id: string) => {
    setUserAccesses(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdateAccessEntry = (id: string, updates: Partial<UserCorporateAccess>) => {
    setUserAccesses(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, ...updates };

      // Validation for scope constraints
      if (updates.scope === 'system') {
        updated.corporateId = undefined;
        updated.departmentId = undefined;
      } else if (updates.scope === 'corporate') {
        updated.departmentId = undefined;
      }

      return updated;
    }));
  };

  const handleSaveAccess = async () => {
    if (!accessUser) return;

    // Simple validation before saving
    const isValid = userAccesses.every(a => {
      if (a.scope === 'corporate') return !!a.corporateId;
      if (a.scope === 'department') return !!a.corporateId && !!a.departmentId;
      return true;
    });

    if (!isValid) {
      toast.error(common.errorRequired);
      return;
    }

    setIsSavingAccess(true);
    try {
      const res = await apiFetch(`/api/users/${accessUser.id}/corporate-access`, {
        method: 'PUT',
        body: JSON.stringify({ accesses: userAccesses })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || t.alerts.errorAccessUpdate);
      }

      toast.success(t.alerts.successAccessUpdated);
      setIsAccessModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingAccess(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
              <Users size={28} />
            </div>
            {t.title}
          </h2>
          <p className="text-sm text-slate-500 mt-2 flex items-center gap-2 ml-1">
            <Info size={16} className="text-indigo-400" />
            {t.subtitle}
          </p>
        </div>

        {canWrite && (
          <button
            onClick={() => handleOpenModal('create')}
            className="group px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            {t.addNew}
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60 h-[38px]">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent text-[10px] font-black text-slate-600 focus:outline-none cursor-pointer uppercase tracking-tight"
            >
              <option value="all">{common.all} {common.status}</option>
              <option value="active">{common.active}</option>
              <option value="inactive">{common.inactive}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60 h-[38px]">
            <Mail size={14} className="text-slate-400" />
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value as any)}
              className="bg-transparent text-[10px] font-black text-slate-600 focus:outline-none cursor-pointer uppercase tracking-tight"
            >
              <option value="all">{t.allVerificationStatus}</option>
              <option value="verified">{t.emailVerifiedLabels.verified}</option>
              <option value="unverified">{t.emailVerifiedLabels.unverified}</option>
            </select>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />

          <button
            onClick={handleApplyFilter}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-indigo-200/50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {common.apply}
          </button>

          <button
            onClick={handleClearFilter}
            className="flex items-center gap-2 bg-slate-50 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-slate-200/50 cursor-pointer"
          >
            <FilterX size={14} />
            {common.clear}
          </button>
        </div>
      </div>

      {/* Datatable section */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.tableHead.name}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.tableHead.email}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.tableHead.emailVerified}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.tableHead.status}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">{common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="wait">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="animate-pulse"
                    >
                      <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-100" /><div className="h-5 bg-slate-100 rounded-lg w-32" /></div></td>
                      <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded w-40" /></td>
                      <td className="px-8 py-5"><div className="h-6 bg-slate-100 rounded-full w-24" /></td>
                      <td className="px-8 py-5"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
                      <td className="px-8 py-5"><div className="h-10 bg-slate-100 rounded-xl w-32 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr
                    key="error"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <td colSpan={5}>
                      <div className="py-24 flex flex-col items-center justify-center gap-6 text-center">
                        <div className="p-6 bg-rose-50 rounded-full text-rose-400 border border-rose-100">
                          <ShieldAlert size={64} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-black text-xl">{common.errorLoadTable}</p>
                          <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto font-medium">{error}</p>
                          <button
                            onClick={() => fetchUsers()}
                            className="mt-8 px-8 py-3 bg-indigo-600 text-white text-xs font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2.5 mx-auto"
                          >
                            <RefreshCw size={16} />
                            {common.retry}
                          </button>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : !users || users.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <td colSpan={5}>
                      <div className="py-24 flex flex-col items-center justify-center gap-6 text-center">
                        <div className="p-6 bg-slate-50 rounded-3xl text-slate-300">
                          <Users size={64} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-black text-xl">{t.status.empty}</p>
                          <p className="text-slate-500 text-sm mt-2 font-medium">{t.status.emptyDesc}</p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  users.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shadow-md overflow-hidden">
                            {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{user.fullName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-600">{user.email}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          user.emailVerified
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                            : "bg-amber-50 text-amber-700 border-amber-200/50"
                        )}>
                          {user.emailVerified ? <Check size={12} /> : <AlertCircle size={12} />}
                          {user.emailVerified ? t.emailVerifiedLabels.verified : t.emailVerifiedLabels.unverified}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          user.isActive
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200/50"
                            : "bg-slate-50 text-slate-500 border-slate-200/50"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? "bg-indigo-500" : "bg-slate-400")} />
                          {user.isActive ? common.active : common.inactive}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          {canWrite && (
                            <button
                              onClick={() => handleOpenModal('edit', user)}
                              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                              title={common.edit}
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {canWrite && (
                            <button
                              onClick={() => handleOpenAccessModal(user)}
                              className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                              title={t.actions.manageAccess}
                            >
                              <Shield size={18} />
                            </button>
                          )}
                          {!user.emailVerified && canWrite && (
                            <button
                              onClick={() => handleResendActivation(user)}
                              className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                              title={t.actions.resendActivation}
                            >
                              <Send size={18} />
                            </button>
                          )}
                          {user.emailVerified && canReset && (
                            <button
                              onClick={() => handleForceResetPassword(user)}
                              className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              title={t.actions.forceResetPassword}
                            >
                              <Key size={18} />
                            </button>
                          )}
                          {canWrite && (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={cn(
                                "p-2.5 rounded-xl transition-all cursor-pointer",
                                user.isActive ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              )}
                              title={user.isActive ? common.deactivate : common.activate}
                            >
                              <RefreshCw size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {!loading && totalCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">
                {common.pagination.showing} <span className="text-slate-800 mx-0.5">{Math.min(totalCount, (currentPage - 1) * pageSize + 1)}</span> - <span className="text-slate-800 mx-0.5">{Math.min(totalCount, currentPage * pageSize)}</span> {common.pagination.of} <span className="text-slate-800 mx-0.5">{totalCount}</span> {common.pagination.entries}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {common.pagination.rowsPerPage}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer shadow-sm hover:border-slate-300"
                >
                  {[10, 25, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  currentPage === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer"
                )}
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => {
                  const totalPages = Math.ceil(totalCount / pageSize);
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum + (4 - i) > totalPages) pageNum = totalPages - 4 + i;
                  }

                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all",
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110 cursor-pointer"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 cursor-pointer"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                disabled={currentPage === Math.ceil(totalCount / pageSize)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  currentPage === Math.ceil(totalCount / pageSize) ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-white hover:shadow-sm active:scale-90 cursor-pointer"
                )}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalMode === 'create' ? t.modal.createTitle : t.modal.editTitle}
            size="xl"
          >
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <SectionHeader title={t.modal.basicInfo} icon={<Building2 size={14} className="text-blue-500" />} color="border-blue-500" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label={t.modal.fullName} required>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                    </FormField>

                    <FormField label={t.modal.username} required>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
                        placeholder="johndoe"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                    </FormField>

                    <FormField label={t.modal.email} required>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                      />
                    </FormField>

                    <div className="flex flex-col justify-end">
                      <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 w-fit">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.modal.isActive}</span>
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            formData.isActive ? "bg-indigo-600" : "bg-slate-200"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              formData.isActive ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", formData.isActive ? "text-indigo-600" : "text-slate-400")}>
                          {formData.isActive ? common.active : common.inactive}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Access Assignment Section - Only for new users */}
                {!editingUser && (
                  <div className="space-y-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between px-2">
                      <SectionHeader title={t.modal.accessAssignment} icon={<ShieldCheck size={14} className="text-emerald-500" />} color="border-emerald-500" />
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({
                          ...p,
                          accesses: [...p.accesses, { roleId: '', corporateId: '', departmentId: '', scope: 'corporate' }]
                        }))}
                        className="flex items-center gap-2.5 px-6 py-2.5 bg-white border border-slate-200 text-xs font-black text-indigo-600 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all active:scale-95 shadow-sm cursor-pointer"
                      >
                        <Plus size={14} />
                        {t.corporateAccessModal.addAccess}
                      </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[180px]">{t.corporateAccessModal.role}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[130px]">{t.corporateAccessModal.scope}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.corporateAccessModal.corporate}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.corporateAccessModal.department}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[60px]">AKSI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {formData.accesses.map((access, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors animate-in fade-in slide-in-from-top-1">
                              <td className="px-6 py-4">
                                <SearchableSelect
                                  options={roleOptions}
                                  value={access.roleId}
                                  onChange={(val) => {
                                    const newAccesses = [...formData.accesses];
                                    newAccesses[idx].roleId = val;
                                    const role = roles?.find(r => r.id === val);
                                    if (role) newAccesses[idx].scope = role.scope;
                                    setFormData(p => ({ ...p, accesses: newAccesses }));
                                  }}
                                  placeholder="Select Role"
                                  className="text-xs"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <SearchableSelect
                                  options={scopeOptions}
                                  value={access.scope}
                                  onChange={(val) => {
                                    const newAccesses = [...formData.accesses];
                                    newAccesses[idx].scope = val as any;
                                    setFormData(p => ({ ...p, accesses: newAccesses }));
                                  }}
                                  placeholder="Select Scope"
                                  className="text-xs"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <SearchableSelect
                                  options={corporates.map(c => ({ value: c.id, label: c.name }))}
                                  value={access.corporateId}
                                  onChange={(val) => {
                                    const newAccesses = [...formData.accesses];
                                    newAccesses[idx].corporateId = val;
                                    setFormData(p => ({ ...p, accesses: newAccesses }));
                                  }}
                                  placeholder={t.modal.selectCorporate}
                                  disabled={access.scope === 'system'}
                                  className="text-xs"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <SearchableSelect
                                  options={departments.map(d => ({ value: d.id, label: d.name }))}
                                  value={access.departmentId}
                                  onChange={(val) => {
                                    const newAccesses = [...formData.accesses];
                                    newAccesses[idx].departmentId = val;
                                    setFormData(p => ({ ...p, accesses: newAccesses }));
                                  }}
                                  placeholder={t.modal.selectDepartment}
                                  disabled={access.scope !== 'department'}
                                  className="text-xs"
                                />
                              </td>
                              <td className="px-6 py-4 text-right">
                                {formData.accesses.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setFormData(p => ({
                                      ...p,
                                      accesses: p.accesses.filter((_, i) => i !== idx)
                                    }))}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                      <div className="p-2 bg-white text-amber-600 rounded-xl shadow-sm h-fit">
                        <Info size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Activation Email</p>
                        <p className="text-xs font-medium text-amber-700/80 mt-1 leading-relaxed">
                          New user will receive an activation email to set their password. Access will be granted immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 bg-white border border-slate-200 text-sm font-black text-slate-500 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  {common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-12 py-3 bg-indigo-600 text-sm font-black text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 min-w-[200px] cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  {isSaving ? common.saving : common.save}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Corporate Access Modal */}
      <AnimatePresence>
        {isAccessModalOpen && accessUser && (
          <Modal
            isOpen={isAccessModalOpen}
            onClose={() => setIsAccessModalOpen(false)}
            title={t.corporateAccessModal.title}
            size="2xl"
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* User Info Card */}
                <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-200/60 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                    {accessUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800">{accessUser.fullName}</h4>
                    <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1">
                      <Mail size={14} /> {accessUser.email}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={handleAddAccessEntry}
                      className="px-6 py-3 bg-white border border-slate-200 text-sm font-black text-indigo-600 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all active:scale-95 shadow-sm flex items-center gap-2.5 cursor-pointer"
                    >
                      <Plus size={18} />
                      {t.corporateAccessModal.addAccess}
                    </button>
                  </div>
                </div>

                {/* Access List Table */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[200px]">{t.corporateAccessModal.role}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[140px]">{t.corporateAccessModal.scope}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.corporateAccessModal.corporate}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.corporateAccessModal.department}</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[80px]">{common.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {isFetchingAccess ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <tr key={`skeleton-access-${i}`} className="animate-pulse">
                            <td className="px-6 py-5"><div className="h-10 bg-slate-100 rounded-xl" /></td>
                            <td className="px-6 py-5"><div className="h-10 bg-slate-100 rounded-xl" /></td>
                            <td className="px-6 py-5"><div className="h-10 bg-slate-100 rounded-xl" /></td>
                            <td className="px-6 py-5"><div className="h-10 bg-slate-100 rounded-xl" /></td>
                            <td className="px-6 py-5"><div className="h-10 bg-slate-100 rounded-xl ml-auto" /></td>
                          </tr>
                        ))
                      ) : userAccesses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Shield size={48} className="text-slate-200" />
                              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t.corporateAccessModal.noAccess}</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        userAccesses.map((access) => (
                          <tr key={access.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-5">
                              <SearchableSelect
                                options={roleOptions}
                                value={access.roleId}
                                onChange={(val) => handleUpdateAccessEntry(access.id, { roleId: val })}
                                placeholder="Select Role"
                                className="text-xs"
                              />
                            </td>
                            <td className="px-6 py-5">
                              <SearchableSelect
                                options={scopeOptions}
                                value={access.scope}
                                onChange={(val) => handleUpdateAccessEntry(access.id, { scope: val as any })}
                                placeholder="Select Scope"
                                className="text-xs"
                              />
                            </td>
                            <td className="px-6 py-5">
                              <SearchableSelect
                                options={corporates.map(c => ({ value: c.id, label: c.name }))}
                                value={access.corporateId || ''}
                                onChange={(val) => handleUpdateAccessEntry(access.id, { corporateId: val })}
                                placeholder="Select Corporate"
                                disabled={access.scope === 'system'}
                                className="text-xs"
                              />
                            </td>
                            <td className="px-6 py-5">
                              <SearchableSelect
                                options={departments.map(d => ({ value: d.id, label: d.name }))}
                                value={access.departmentId || ''}
                                onChange={(val) => handleUpdateAccessEntry(access.id, { departmentId: val })}
                                placeholder="Select Dept"
                                disabled={access.scope !== 'department'}
                                className="text-xs"
                              />
                            </td>
                            <td className="px-6 py-5">
                              <button
                                onClick={() => handleRemoveAccessEntry(access.id)}
                                className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ml-auto block cursor-pointer"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsAccessModalOpen(false)}
                  className="px-8 py-3 bg-white border border-slate-200 text-sm font-black text-slate-500 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  {common.cancel}
                </button>
                <button
                  onClick={handleSaveAccess}
                  disabled={isSavingAccess || isFetchingAccess}
                  className="px-12 py-3 bg-indigo-600 text-sm font-black text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 min-w-[200px] cursor-pointer"
                >
                  {isSavingAccess ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  {isSavingAccess ? common.saving : common.save}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

