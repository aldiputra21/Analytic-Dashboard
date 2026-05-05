// ApprovalConfigManager — CRUD for approval workflows and steps.
// Form improvements:
// - Module dropdown (from workflowCatalog)
// - Entity type, callback handler, view component: auto-fill readonly
// - Action dropdown (create/edit/delete)
// - Maker role & required role: dropdown from roles API
// - Name ID + Name EN side by side
// - Status as toggle switch

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Edit2, Trash2, RefreshCw, AlertCircle, X,
  CheckCircle, Settings, ChevronDown, ChevronUp, Search, FilterX,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '../../../utils/cn';
import { apiFetch } from '../../../services/financial/apiFetch';
import { useAuth } from '../../../hooks/financial/useAuth';
import { commonsI18n } from '../../../i18n/commons';
import { approvalI18n } from '../../../i18n/approval';
import { getErrorMessage } from '../../../utils/errorUtils';
import { WORKFLOW_CATALOG, WORKFLOW_ACTIONS, type WorkflowAction } from './workflowCatalog';
import { SearchableSelect } from '../shared/SearchableSelect';

// ── Types

interface WorkflowStep {
  id?: string;
  stepOrder: number;
  stepType: string;
  requiredRole: string;
  requiredRoleInfo?: { id: string; name: string; description?: string | null } | null;
  isActive: boolean;
}

interface Workflow {
  id: string;
  module: string;
  entityType: string;
  action: string;
  name: string;
  nameEn?: string;
  description?: string;
  callbackHandler: string;
  viewComponent: string;
  makerRole: string;
  makerRoleInfo?: { id: string; name: string; description?: string | null } | null;
  isActive: boolean;
  createdAt: string;
  steps: WorkflowStep[];
}

interface RoleOption {
  id: string;
  name: string;
  description?: string | null;
}

// ── Validation

const workflowSchema = z.object({
  module: z.string().min(1),
  entityType: z.string().min(1),
  action: z.string().min(1),
  name: z.string().min(1),
  nameEn: z.string().min(1),
  description: z.string().optional(),
  callbackHandler: z.string().min(1),
  viewComponent: z.string().min(1),
  makerRole: z.string().min(1),
  isActive: z.boolean(),
  steps: z.array(z.object({
    stepOrder: z.number().int().min(1),
    stepType: z.string().min(1),
    requiredRole: z.string().min(1),
    isActive: z.boolean(),
  })).min(1),
});

// Field labels for validation messages
const FIELD_LABELS_ID: Record<string, string> = {
  module: 'Modul',
  action: 'Aksi',
  name: 'Nama Workflow (ID)',
  nameEn: 'Nama Workflow (EN)',
  makerRole: 'Role Pembuat (Maker)',
  steps: 'Langkah Persetujuan (minimal 1)',
};

const FIELD_LABELS_EN: Record<string, string> = {
  module: 'Module',
  action: 'Action',
  name: 'Workflow Name (ID)',
  nameEn: 'Workflow Name (EN)',
  makerRole: 'Maker Role',
  steps: 'Approval Steps (at least 1)',
};

// ── Sub-components

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-10 h-5 rounded-full transition-colors cursor-pointer',
        checked ? 'bg-indigo-600' : 'bg-slate-300',
      )}
    >
      <div className={cn(
        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0.5',
      )} />
    </div>
    <span className="text-sm font-bold text-slate-700">{label}</span>
  </label>
);

const ReadonlyField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
    <div className="px-3 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono truncate">
      {value || '—'}
    </div>
  </div>
);

// Reusable styled select with proper chevron positioning
const StyledSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className, children, ...props }) => (
  <div className="relative">
    <select
      {...props}
      className={cn(
        'w-full appearance-none px-3 py-2.5 pr-8 text-sm border border-slate-200 rounded-xl',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
        'bg-white cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed',
        className,
      )}
    >
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
);

// ── Main Component

export const ApprovalConfigManager: React.FC = () => {
  const { language, hasPermission } = useAuth();
  const t = approvalI18n[language];
  const common = commonsI18n[language];

  const canWrite = hasPermission('public.approval_configs.write');
  const canDelete = hasPermission('public.approval_configs.delete');

  const [data, setData] = useState<Workflow[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterSearch, setFilterSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const emptyStep = (): WorkflowStep => ({ stepOrder: 1, stepType: 'approval', requiredRole: '', isActive: true });

  const [formData, setFormData] = useState<Partial<Workflow> & { steps: WorkflowStep[] }>({
    module: '', entityType: '', action: 'create', name: '', nameEn: '', description: '',
    callbackHandler: '', viewComponent: '', makerRole: '', isActive: true, steps: [emptyStep()],
  });

  // Auto-fill entity type, callback handler, view component when module+action changes
  const selectedCatalog = WORKFLOW_CATALOG.find(c => c.module === formData.module && c.entityType === formData.entityType)
    ?? WORKFLOW_CATALOG.find(c => c.module === formData.module);

  const handleModuleChange = (moduleKey: string) => {
    const catalog = WORKFLOW_CATALOG.find(c => `${c.module}:${c.entityType}` === moduleKey);
    if (catalog) {
      const action = (formData.action as WorkflowAction) || 'create';
      setFormData(p => ({
        ...p,
        module: catalog.module,
        entityType: catalog.entityType,
        viewComponent: catalog.viewComponent,
        callbackHandler: catalog.callbacks[action] ?? '',
      }));
    }
  };

  const handleActionChange = (action: string) => {
    const catalog = WORKFLOW_CATALOG.find(c => c.module === formData.module && c.entityType === formData.entityType);
    setFormData(p => ({
      ...p,
      action,
      callbackHandler: catalog?.callbacks[action as WorkflowAction] ?? p.callbackHandler ?? '',
    }));
  };

  const getRoleLabel = (roleId: string, roleInfo?: { name: string; description?: string | null } | null) => {
    if (roleInfo) return roleInfo.description ? `${roleInfo.name} — ${roleInfo.description}` : roleInfo.name;
    const found = roleOptions.find(r => r.id === roleId);
    if (found) return found.description ? `${found.name} — ${found.description}` : found.name;
    return roleId ? roleId.slice(0, 8) + '...' : '—';
  };

  // Convert roleOptions to SearchableSelect format
  const roleSelectOptions = [
    { value: '', label: language === 'id' ? '— Pilih Role —' : '— Select Role —' },
    ...roleOptions.map(r => ({
      value: r.id,
      label: r.name,
      sublabel: r.description ?? undefined,
    })),
  ];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedSearch) params.set('search', appliedSearch);
      const res = await apiFetch(`/api/frs/approval-configs?${params.toString()}`);
      if (!res.ok) throw new Error(common.errorLoadTable);
      const d = await res.json();
      setData(d.records ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [appliedSearch, refreshKey]);

  // Fetch roles once on mount for dropdowns
  useEffect(() => {
    apiFetch('/api/frs/roles?pageSize=100&isActive=true')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setRoleOptions(d.data ?? []); })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApplyFilter = () => { setAppliedSearch(filterSearch); setRefreshKey(k => k + 1); };
  const handleClearFilter = () => { setFilterSearch(''); setAppliedSearch(''); setRefreshKey(k => k + 1); };

  const openModal = (mode: 'create' | 'edit', item?: Workflow) => {
    setModalMode(mode);
    if (item) {
      setFormData({ ...item, steps: item.steps.length > 0 ? item.steps : [emptyStep()] });
    } else {
      setFormData({ module: '', entityType: '', action: 'create', name: '', nameEn: '', description: '', callbackHandler: '', viewComponent: '', makerRole: '', isActive: true, steps: [emptyStep()] });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build schema and validate
    const schema = workflowSchema;
    const parsed = schema.safeParse(formData);

    if (!parsed.success) {
      // Hanya tampilkan error untuk field yang user-facing (bukan auto-fill)
      const userFacingFields = new Set(['module', 'action', 'name', 'nameEn', 'makerRole', 'steps']);
      const fieldLabels = language === 'id' ? FIELD_LABELS_ID : FIELD_LABELS_EN;
      const seen = new Set<string>();
      const messages: string[] = [];

      for (const issue of parsed.error.issues) {
        const topField = String(issue.path[0]);

        // Skip auto-fill fields
        if (!userFacingFields.has(topField)) continue;

        let label: string;
        if (topField === 'steps' && issue.path.length > 2 && issue.path[2] === 'requiredRole') {
          const stepNum = (issue.path[1] as number) + 1;
          label = language === 'id' ? `Role pada langkah ${stepNum}` : `Role on step ${stepNum}`;
        } else {
          label = fieldLabels[topField] ?? topField;
        }

        if (!seen.has(label)) {
          seen.add(label);
          messages.push(label);
        }
      }

      if (messages.length > 0) {
        // Render sebagai JSX list agar rapi
        toast.error(
          <div>
            <p className="font-bold mb-1">{language === 'id' ? 'Wajib diisi:' : 'Required fields:'}</p>
            <ul className="list-disc list-inside space-y-0.5">
              {messages.map(m => <li key={m} className="text-sm">{m}</li>)}
            </ul>
          </div>,
          { duration: 5000 },
        );
      }
      return;
    }

    setIsSaving(true);
    try {
      // Cek duplikasi di frontend (hanya untuk create)
      if (modalMode === 'create') {
        const isDuplicate = data.some(
          w => w.module === parsed.data.module &&
               w.entityType === parsed.data.entityType &&
               w.action === parsed.data.action,
        );
        if (isDuplicate) {
          toast.error(language === 'id'
            ? `Workflow untuk ${parsed.data.module}.${parsed.data.entityType}.${parsed.data.action} sudah ada`
            : `Workflow for ${parsed.data.module}.${parsed.data.entityType}.${parsed.data.action} already exists`);
          setIsSaving(false);
          return;
        }
      }

      const url = modalMode === 'edit' ? `/api/frs/approval-configs/${formData.id}` : '/api/frs/approval-configs';
      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, body: JSON.stringify(parsed.data) });
      if (!res.ok) {
        const err = await res.json();
        // Handle duplicate entry from backend
        if (err.error?.code === 'DUPLICATE_ENTRY' || res.status === 409) {
          toast.error(language === 'id'
            ? 'Workflow dengan modul dan aksi yang sama sudah ada'
            : 'A workflow with the same module and action already exists');
          return;
        }
        throw new Error(getErrorMessage(err.error?.code, language) || common.errorSave);
      }
      toast.success(modalMode === 'create' ? common.successSave : common.successUpdate);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? common.errorSave);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(common.deleteConfirm)) return;
    try {
      const res = await apiFetch(`/api/frs/approval-configs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(common.errorDelete);
      toast.success(common.successDelete);
      fetchData();
    } catch (err: any) {
      toast.error(err.message ?? common.errorDelete);
    }
  };

  const addStep = () => {
    const maxOrder = Math.max(0, ...formData.steps.map(s => s.stepOrder));
    setFormData(p => ({ ...p, steps: [...p.steps, { stepOrder: maxOrder + 1, stepType: 'approval', requiredRole: '', isActive: true }] }));
  };

  const removeStep = (idx: number) => setFormData(p => ({ ...p, steps: p.steps.filter((_, i) => i !== idx) }));

  const updateStep = (idx: number, field: keyof WorkflowStep, value: unknown) =>
    setFormData(p => ({ ...p, steps: p.steps.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));

  // Drag-drop handlers for step reordering
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    setFormData(p => {
      const steps = [...p.steps];
      const [moved] = steps.splice(dragIdx, 1);
      steps.splice(idx, 0, moved);
      return { ...p, steps: steps.map((s, i) => ({ ...s, stepOrder: i + 1 })) };
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100"><Settings size={24} /></div>
            {t.configTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-1">{t.configSubtitle}</p>
        </div>
        {canWrite && (
          <button onClick={() => openModal('create')} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 cursor-pointer">
            <Plus size={16} />{common.add}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={filterSearch} onChange={e => setFilterSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleApplyFilter()} placeholder={common.search} className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50" />
          </div>
          <button onClick={handleApplyFilter} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-indigo-200/50 cursor-pointer">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />{common.apply}
          </button>
          <button onClick={handleClearFilter} className="flex items-center gap-2 bg-slate-50 text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 border border-slate-200/50 cursor-pointer">
            <FilterX size={14} />{common.clear}
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><RefreshCw size={24} className="animate-spin text-indigo-400" /></div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertCircle size={40} className="text-rose-400" />
          <p className="text-slate-600 font-medium">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl cursor-pointer">{common.retry}</button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Settings size={40} className="text-slate-300" />
          <p className="text-slate-500 font-medium">{common.noData}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', item.isActive ? 'bg-emerald-500' : 'bg-slate-300')} />
                  <div>
                    <p className="font-bold text-slate-800">{language === 'en' && item.nameEn ? item.nameEn : item.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.module}.{item.entityType}.{item.action}</p>
                    {item.makerRole && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {language === 'id' ? 'Pembuat' : 'Maker'}: <span className="font-bold text-slate-500">{getRoleLabel(item.makerRole, item.makerRoleInfo)}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{item.steps.length} step{item.steps.length !== 1 ? 's' : ''}</span>
                  <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
                    {expandedId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {canWrite && <button onClick={() => openModal('edit', item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"><Edit2 size={16} /></button>}
                  {canDelete && <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 size={16} /></button>}
                </div>
              </div>
              {expandedId === item.id && (
                <div className="px-5 pb-4 border-t border-slate-100 pt-3">
                  <p className="text-xs font-black text-slate-400 uppercase mb-2">{t.config.steps}</p>
                  <div className="space-y-2">
                    {item.steps.map(step => (
                      <div key={step.id ?? step.stepOrder} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-black shrink-0">{step.stepOrder}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{getRoleLabel(step.requiredRole, step.requiredRoleInfo)}</p>
                          <p className="text-[10px] text-slate-400">{step.stepType}</p>
                        </div>
                        <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full shrink-0', step.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500')}>
                          {step.isActive ? common.active : common.inactive}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">{modalMode === 'create' ? `${common.add} Workflow` : `${common.edit} Workflow`}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full cursor-pointer"><X size={18} className="text-slate-500" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="workflowForm" onSubmit={handleSave} noValidate className="space-y-5">

                  {/* Module dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{t.config.module}</label>
                    <StyledSelect
                      value={formData.module && formData.entityType ? `${formData.module}:${formData.entityType}` : ''}
                      onChange={e => handleModuleChange(e.target.value)}
                      disabled={modalMode === 'edit'}
                    >
                      <option value="">{language === 'id' ? '— Pilih Modul —' : '— Select Module —'}</option>
                      {WORKFLOW_CATALOG.map(c => (
                        <option key={`${c.module}:${c.entityType}`} value={`${c.module}:${c.entityType}`}>
                          {language === 'en' ? c.labelEn : c.labelId}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>

                  {/* Entity type + Action */}
                  <div className="grid grid-cols-2 gap-4">
                    <ReadonlyField label={t.config.entityType} value={formData.entityType ?? ''} />
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">{t.config.action}</label>
                      <StyledSelect
                        value={formData.action ?? 'create'}
                        onChange={e => handleActionChange(e.target.value)}
                        disabled={modalMode === 'edit'}
                      >
                        {WORKFLOW_ACTIONS.map(a => (
                          <option key={a} value={a}>{t.config.actionLabels[a]}</option>
                        ))}
                      </StyledSelect>
                    </div>
                  </div>

                  {/* Name ID + Name EN */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">{t.config.name}</label>
                      <input value={formData.name ?? ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Persetujuan Input Neraca" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">{t.config.nameEn}</label>
                      <input value={formData.nameEn ?? ''} onChange={e => setFormData(p => ({ ...p, nameEn: e.target.value }))} className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="Balance Sheet Input Approval" />
                    </div>
                  </div>

                  {/* Callback Handler + View Component (readonly) */}
                  <div className="grid grid-cols-2 gap-4">
                    <ReadonlyField label={t.config.callbackHandler} value={formData.callbackHandler ?? ''} />
                    <ReadonlyField label={t.config.viewComponent} value={formData.viewComponent ?? ''} />
                  </div>

                  {/* Maker Role — searchable */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">{t.config.makerRole}</label>
                    <SearchableSelect
                      options={roleSelectOptions}
                      value={formData.makerRole ?? ''}
                      onChange={v => setFormData(p => ({ ...p, makerRole: v }))}
                      placeholder={language === 'id' ? '— Pilih Role —' : '— Select Role —'}
                      usePortal
                    />
                  </div>

                  {/* Status toggle */}
                  <ToggleSwitch
                    checked={formData.isActive ?? true}
                    onChange={v => setFormData(p => ({ ...p, isActive: v }))}
                    label={t.config.isActive}
                  />

                  {/* Steps — drag-drop to reorder */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-slate-500 uppercase">{t.config.steps}</p>
                      <button type="button" onClick={addStep} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer">
                        <Plus size={13} />{t.config.addStep}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.steps.map((step, idx) => (
                        <div
                          key={idx}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={e => handleDragOver(e, idx)}
                          onDrop={() => handleDrop(idx)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            'bg-slate-50 rounded-xl p-3 border transition-all',
                            dragOverIdx === idx && dragIdx !== idx
                              ? 'border-indigo-400 bg-indigo-50/50 scale-[1.01]'
                              : 'border-slate-200',
                            dragIdx === idx ? 'opacity-50' : 'opacity-100',
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {/* Drag handle + order badge */}
                            <div className="flex items-center gap-1.5 shrink-0 cursor-grab active:cursor-grabbing">
                              <svg className="w-3.5 h-3.5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                              </svg>
                              <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                            </div>

                            {/* Required role — searchable */}
                            <div className="flex-1">
                              <SearchableSelect
                                options={roleSelectOptions}
                                value={step.requiredRole}
                                onChange={v => updateStep(idx, 'requiredRole', v)}
                                placeholder={language === 'id' ? '— Pilih Role —' : '— Select Role —'}
                                usePortal
                                size="sm"
                              />
                            </div>

                            {/* Active toggle (compact) */}
                            <div
                              onClick={() => updateStep(idx, 'isActive', !step.isActive)}
                              className={cn(
                                'relative w-8 h-4 rounded-full transition-colors cursor-pointer shrink-0',
                                step.isActive ? 'bg-indigo-600' : 'bg-slate-300',
                              )}
                            >
                              <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform', step.isActive ? 'translate-x-4' : 'translate-x-0.5')} />
                            </div>

                            {/* Remove */}
                            {formData.steps.length > 1 && (
                              <button type="button" onClick={() => removeStep(idx)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer shrink-0">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">{language === 'id' ? 'Seret untuk mengatur urutan langkah' : 'Drag to reorder steps'}</p>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-5 py-2.5 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl cursor-pointer">{common.cancel}</button>
                <button type="submit" form="workflowForm" disabled={isSaving} className="px-8 py-2.5 text-sm font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2 cursor-pointer">
                  {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {isSaving ? common.saving : common.save}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApprovalConfigManager;
