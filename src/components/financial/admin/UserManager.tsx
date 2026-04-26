import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Shield, Eye,
  X, AlertCircle, CheckCircle2,
  RefreshCw, Users, Info, ChevronDown,
  FilterX, Key, Building2, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { toast } from 'sonner';
import { z } from 'zod';
import { userI18n } from '../../../i18n/user';
import { commonsI18n } from '../../../i18n/commons';
import { FRSUser, UserRole } from '../../../types/financial/user';

const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'bg-purple-50 text-purple-700 border-purple-100',
  bod: 'bg-blue-50 text-blue-700 border-blue-100',
  subsidiary_manager: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

// --- Shared Components ---

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn("bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col max-h-[90vh]", sizeClasses[size])}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <User size={18} />
            </div>
            {title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const FormField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, error, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 font-medium ml-1 flex items-center gap-1">
      <AlertCircle size={10} /> {error}
    </p>}
  </div>
);

// --- Main Component ---

export const UserManager: React.FC = () => {
  const { hasPermission, language } = useAuth();
  const t = userI18n[language];
  const common = commonsI18n[language];
  const { corporates: subsidiaries } = useCorporates();

  const canWrite = hasPermission('cfd.users.write');
  const canDelete = hasPermission('cfd.users.delete');

  // Validation Schemas
  const userSchema = z.object({
    fullName: z.string().min(3, t.validation.fullNameMin),
    username: z.string().min(4, t.validation.usernameMin),
    email: z.string().email(t.validation.emailInvalid),
    role: z.enum(['owner', 'bod', 'subsidiary_manager']),
    password: z.string().optional().refine(val => !val || val.length >= 12, {
      message: t.validation.passwordMin
    }).refine(val => !val || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(val), {
      message: t.validation.passwordStrength
    }),
    subsidiaryIds: z.array(z.string()),
    isActive: z.boolean()
  }).refine(data => {
    if (data.role !== 'owner' && data.subsidiaryIds.length === 0) return false;
    return true;
  }, {
    message: t.modal.subsidiaryNote,
    path: ['subsidiaryIds']
  });

  // State
  const [users, setUsers] = useState<FRSUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingUser, setEditingUser] = useState<FRSUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Access Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessUserId, setAccessUserId] = useState<string | null>(null);
  const [selectedSubsidiaryIds, setSelectedSubsidiaryIds] = useState<string[]>([]);
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    role: 'bod' as UserRole,
    password: '',
    subsidiaryIds: [] as string[],
    isActive: true
  });

  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await apiFetch('/api/frs/users');
      if (!res.ok) throw new Error(common.errorLoadTable);

      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || common.errorLoadTable);
      toast.error(err.message || common.errorLoadTable);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [common.errorLoadTable]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = async (mode: 'create' | 'edit' | 'view', user?: FRSUser) => {
    setModalMode(mode);
    if (user) {
      setEditingUser(user);

      // Fetch existing access
      let scopeIds: string[] = [];
      try {
        const res = await apiFetch(`/api/frs/users/${user.id}/subsidiary-access`);
        if (res.ok) {
          const accessRows = await res.json() as Array<{ subsidiaryId: string }>;
          scopeIds = accessRows.map((row) => row.subsidiaryId).filter(Boolean);
        }
      } catch {
        scopeIds = [];
      }

      setFormData({
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        password: '',
        subsidiaryIds: scopeIds,
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        username: '',
        email: '',
        role: 'bod',
        password: '',
        subsidiaryIds: [],
        isActive: true
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
      const url = editingUser ? `/api/frs/users/${editingUser.id}` : '/api/frs/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload: any = { ...validation.data };
      if (editingUser && !payload.password) delete payload.password;
      if (payload.role === 'owner') payload.subsidiaryIds = [];

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || t.alerts.errorSave);
      }

      toast.success(editingUser ? t.alerts.successUpdate : t.alerts.successSave);
      setIsModalOpen(false);
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user: FRSUser) => {
    try {
      const res = await apiFetch(`/api/frs/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || t.alerts.errorStatus);
      }

      toast.success(t.alerts.successStatus);
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openAccessManager = async (user: FRSUser) => {
    setAccessUserId(user.id);
    try {
      const res = await apiFetch(`/api/frs/users/${user.id}/subsidiary-access`);
      if (!res.ok) throw new Error(common.errorLoadTable);

      const accessRows = await res.json() as Array<{ subsidiaryId: string }>;
      setSelectedSubsidiaryIds(accessRows.map((row) => row.subsidiaryId).filter(Boolean));
      setIsAccessModalOpen(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveAccess = async () => {
    if (!accessUserId) return;
    setIsSavingAccess(true);
    try {
      const res = await apiFetch(`/api/frs/users/${accessUserId}/subsidiary-access`, {
        method: 'POST',
        body: JSON.stringify({ subsidiaryIds: selectedSubsidiaryIds, replace: true })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || t.alerts.errorAccess);
      }

      toast.success(t.alerts.successAccess);
      setIsAccessModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingAccess(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Users size={24} />
            </div>
            {t.title}
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 ml-1">
            <Info size={14} className="text-indigo-400" />
            {t.subtitle}
          </p>
        </div>

        {canWrite && (
          <button
            onClick={() => handleOpenModal('create')}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>

        <button
          onClick={() => fetchUsers()}
          className="flex items-center gap-2 bg-slate-50 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-slate-200/50 cursor-pointer"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          {common.search}
        </button>
      </div>

      {/* Datatable section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.name}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.username}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.email}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.role}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{common.status}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="animate-pulse"
                    >
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-32" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-24" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-16" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-lg w-24 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr
                    key="error"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <td colSpan={6}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-red-50 rounded-full text-red-400 border border-red-100">
                          <AlertCircle size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{common.errorLoadTable}</p>
                          <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">{error}</p>
                          <button
                            onClick={() => fetchUsers()}
                            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
                          >
                            <RefreshCw size={14} />
                            {common.retry}
                          </button>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : filteredUsers.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <td colSpan={6}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <Users size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{t.status.empty}</p>
                          <p className="text-slate-500 text-sm mt-1">{t.status.emptyDesc}</p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors group font-bold"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                            <User size={14} />
                          </div>
                          <span className="text-sm text-slate-800">{user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-500">{user.username}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-600">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border",
                          ROLE_COLORS[user.role]
                        )}>
                          {user.roleDescription || t.roles[user.role]}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border",
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-50 text-slate-500 border-slate-100"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", user.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                          {user.isActive ? common.active : common.inactive}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenModal('view', user)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title={t.modal.viewTitle}
                          >
                            <Eye size={16} />
                          </button>
                          {canWrite && (
                            <button
                              onClick={() => handleOpenModal('edit', user)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                              title={t.modal.editTitle}
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {(user.role === 'subsidiary_manager' || user.role === 'bod') && canWrite && (
                            <button
                              onClick={() => openAccessManager(user)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                              title={t.modal.accessTitle}
                            >
                              <Shield size={16} />
                            </button>
                          )}
                          {canWrite && (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={cn(
                                "p-2 rounded-lg transition-all cursor-pointer",
                                user.isActive ? common.active : common.inactive
                              )}
                              title={user.isActive ? common.deactivate : common.activate}
                            >
                              <RefreshCw size={16} />
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
      </div>

      {/* User Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={modalMode === 'create' ? t.modal.createTitle : modalMode === 'edit' ? t.modal.editTitle : t.modal.viewTitle}
            size="lg"
          >
            <form onSubmit={handleSubmit} onInvalid={() => toast.error(common.errorRequired, { id: 'errorRequired' })} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label={t.modal.fullName} required>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))}
                      disabled={modalMode === 'view'}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </FormField>

                  <FormField label={t.modal.username} required>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
                      disabled={modalMode === 'view'}
                      placeholder="johndoe"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </FormField>

                  <FormField label={t.modal.email} required>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      disabled={modalMode === 'view'}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </FormField>

                  <FormField label={t.modal.role} required>
                    <div className="relative">
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as UserRole }))}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
                      >
                        <option value="bod">{t.roles.bod}</option>
                        <option value="subsidiary_manager">{t.roles.subsidiary_manager}</option>
                        <option value="owner">{t.roles.owner}</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </FormField>

                  <FormField label={t.modal.password} required={modalMode === 'create'}>
                    <div className="relative">
                      <input
                        type="password"
                        required={modalMode === 'create'}
                        value={formData.password}
                        onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                        disabled={modalMode === 'view'}
                        placeholder={t.modal.passwordPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      />
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </div>
                    {modalMode === 'edit' && <p className="text-[10px] text-slate-400 mt-1 italic">{t.modal.passwordNote}</p>}
                  </FormField>

                  <div className="space-y-1.5 pt-6">
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{common.status}</span>
                      <button
                        type="button"
                        disabled={modalMode === 'view'}
                        onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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

                {formData.role !== 'owner' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                      {t.modal.subsidiaryAccess} {modalMode === 'create' && <span className="text-red-500">*</span>}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      {subsidiaries.map((sub) => (
                        <label key={sub.id} className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                          formData.subsidiaryIds.includes(sub.id)
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                            : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                        )}>
                          <input
                            type="checkbox"
                            checked={formData.subsidiaryIds.includes(sub.id)}
                            disabled={modalMode === 'view'}
                            onChange={(e) => {
                              setFormData((current) => ({
                                ...current,
                                subsidiaryIds: e.target.checked
                                  ? [...current.subsidiaryIds, sub.id]
                                  : current.subsidiaryIds.filter((id) => id !== sub.id),
                              }));
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-black">{sub.name}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building2 size={10} />
                              {sub.industrySector}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 ml-1 italic">{t.modal.subsidiaryNote}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  {modalMode === 'view' ? common.close : common.cancel}
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-10 py-3 bg-indigo-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[180px] cursor-pointer"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    {isSaving ? common.saving : common.save}
                  </button>
                )}
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Access Manager Modal */}
      <AnimatePresence>
        {isAccessModalOpen && (
          <Modal
            isOpen={isAccessModalOpen}
            onClose={() => setIsAccessModalOpen(false)}
            title={t.modal.accessTitle}
            size="md"
          >
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 italic ml-1">{t.modal.subsidiaryNote}</p>
                  <div className="space-y-2 p-1">
                    {subsidiaries.map((sub) => (
                      <label key={sub.id} className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                        selectedSubsidiaryIds.includes(sub.id)
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                          : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                      )}>
                        <input
                          type="checkbox"
                          checked={selectedSubsidiaryIds.includes(sub.id)}
                          onChange={(e) => {
                            setSelectedSubsidiaryIds((prev) =>
                              e.target.checked
                                ? [...prev, sub.id]
                                : prev.filter((id) => id !== sub.id)
                            );
                          }}
                          className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-black">{sub.name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building2 size={10} />
                            {sub.industrySector}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAccessModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  {common.cancel}
                </button>
                <button
                  onClick={handleSaveAccess}
                  disabled={isSavingAccess}
                  className="px-8 py-2.5 bg-emerald-600 text-sm font-bold text-white rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[150px] cursor-pointer"
                >
                  {isSavingAccess ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {isSavingAccess ? common.saving : t.modal.saveAccess}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
