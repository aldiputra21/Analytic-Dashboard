import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, History, Info, Calendar, 
  Tag, Search, ChevronDown, ChevronUp,
  AlertCircle, User, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { useAuth } from '../../../hooks/financial/useAuth';
import { cn } from '../../../utils/cn';
import { auditLogI18n } from '../../../i18n/audit-log';
import { commonsI18n } from '../../../i18n/commons';
import { toast } from 'sonner';
import { SearchableSelect } from '../shared/SearchableSelect';

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  subsidiaryId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  justification?: string;
  ipAddress?: string;
  createdAt: string;
}

interface AuditLogProps {
  subsidiaryId?: string;
  subsidiaries?: Array<{ id: string; name: string }>;
  onSubsidiaryChange?: (id: string, name: string) => void;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  update: 'bg-blue-50 text-blue-700 border-blue-100',
  delete: 'bg-rose-50 text-rose-700 border-rose-100',
  login: 'bg-slate-50 text-slate-600 border-slate-100',
  logout: 'bg-slate-50 text-slate-600 border-slate-100',
  export: 'bg-purple-50 text-purple-700 border-purple-100',
  backup: 'bg-amber-50 text-amber-700 border-amber-100',
  restore: 'bg-amber-50 text-amber-700 border-amber-100',
};

function JsonViewer({ data }: { data?: Record<string, any> }) {
  if (!data) return <span className="text-slate-400 italic">—</span>;
  return (
    <pre className="text-[10px] bg-slate-900 text-slate-300 rounded-xl p-4 overflow-auto max-h-48 whitespace-pre font-mono shadow-inner">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export const AuditLog: React.FC<AuditLogProps> = ({ 
  subsidiaryId,
  subsidiaries = [],
  onSubsidiaryChange
}) => {
  const { language } = useAuth();
  const t = auditLogI18n[language];
  const common = commonsI18n[language];

  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAuditLog = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (subsidiaryId) params.set('subsidiaryId', subsidiaryId);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (actionFilter) params.set('action', actionFilter);
      if (entityTypeFilter) params.set('entityType', entityTypeFilter);
      params.set('limit', '200');

      const res = await apiFetch(`/api/frs/audit-log?${params.toString()}`);

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || common.errorLoadTable);
      }

      const data = await res.json();
      setEntries(data);
    } catch (err: any) {
      setError(err.message || common.errorLoadTable);
      toast.error(err.message || common.errorLoadTable);
    } finally {
      setLoading(false);
    }
  }, [subsidiaryId, startDate, endDate, actionFilter, entityTypeFilter, common.errorLoadTable]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {subsidiaries.length > 1 ? (
            <div className="w-64">
              <SearchableSelect
                options={[
                  { value: '', label: common.all },
                  ...subsidiaries.map(s => ({ value: s.id, label: s.name }))
                ]}
                value={subsidiaryId || ''}
                onChange={(val) => {
                  const sub = subsidiaries.find(s => s.id === val);
                  if (onSubsidiaryChange) onSubsidiaryChange(val, sub?.name || '');
                }}
                placeholder={common.search}
                label={t.subsidiary || 'Subsidiary'}
              />
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                  <History size={24} />
                </div>
                {t.title}
              </h2>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 ml-1">
                <Info size={14} className="text-indigo-400" />
                {subsidiaryId ? t.subtitle.replace('All system changes', 'Changes for selected subsidiary') : t.subtitle}
              </p>
            </>
          )}
        </div>

        <button
          onClick={() => fetchAuditLog()}
          disabled={loading}
          className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          {t.refresh}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.filters.from}</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.filters.to}</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.filters.action}</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">{common.all}</option>
              <option value="create">{t.filters.create}</option>
              <option value="update">{t.filters.update}</option>
              <option value="delete">{t.filters.delete}</option>
              <option value="login">{t.filters.login}</option>
              <option value="logout">{t.filters.logout}</option>
              <option value="export">{t.filters.export}</option>
              <option value="backup">{t.filters.backup}</option>
              <option value="restore">{t.filters.restore}</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.filters.entity}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              placeholder="financial_data"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => fetchAuditLog()}
            className="w-full px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer"
          >
            {common.apply}
          </button>
        </div>
      </div>

      {/* Datatable section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.timestamp}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.user}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.action}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.entity}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.tableHead.details}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              <AnimatePresence>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="animate-pulse"
                    >
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr
                    key="error"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <td colSpan={5}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-red-50 rounded-full text-red-400 border border-red-100">
                          <AlertCircle size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{common.errorLoadTable}</p>
                          <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">{error}</p>
                          <button
                            onClick={() => fetchAuditLog()}
                            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
                          >
                            <RefreshCw size={14} />
                            {common.retry}
                          </button>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : entries.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <td colSpan={5}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <History size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{t.status.empty}</p>
                          <p className="text-slate-500 text-sm mt-1">{t.status.emptyDesc}</p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  entries.map((entry, idx) => {
                    const isExpanded = expandedId === entry.id;
                    return (
                      <React.Fragment key={entry.id}>
                        <motion.tr
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.02 }}
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className={cn(
                            "transition-all cursor-pointer group",
                            isExpanded ? "bg-indigo-50/50" : "hover:bg-slate-50/50"
                          )}
                        >
                          <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                            {formatDate(entry.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-slate-100 rounded text-slate-500">
                                <User size={12} />
                              </div>
                              <span className="text-sm text-slate-800">{entry.userId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border",
                              ACTION_COLORS[entry.action] || 'bg-slate-50 text-slate-600 border-slate-100'
                            )}>
                              {t.filters[entry.action as keyof typeof t.filters] || entry.action}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-700 tracking-tight">{entry.entityType}</span>
                              {entry.entityId && (
                                <span className="text-[10px] text-slate-400 font-mono">#{entry.entityId.slice(-8)}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors",
                              isExpanded ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                            )}>
                              {isExpanded ? (
                                <>
                                  {t.details.hide}
                                  <ChevronUp size={14} />
                                </>
                              ) : (
                                <>
                                  {t.details.show}
                                  <ChevronDown size={14} />
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                        
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-slate-50/30"
                            >
                              <td colSpan={5} className="px-6 py-6 border-b border-slate-100">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                      {t.details.oldValues}
                                    </div>
                                    <JsonViewer data={entry.oldValues} />
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                      {t.details.newValues}
                                    </div>
                                    <JsonViewer data={entry.newValues} />
                                  </div>

                                  {(entry.justification || entry.ipAddress) && (
                                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100/50">
                                      {entry.justification && (
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                            <ShieldCheck size={14} />
                                            {t.details.justification}
                                          </div>
                                          <p className="text-xs font-bold text-slate-700 bg-amber-50/50 border border-amber-100 rounded-xl p-4 leading-relaxed">
                                            {entry.justification}
                                          </p>
                                        </div>
                                      )}
                                      {entry.ipAddress && (
                                        <div className="space-y-2">
                                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {t.details.ipAddress}
                                          </div>
                                          <div className="inline-flex px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-600">
                                            {entry.ipAddress}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center pt-4">
        {t.entriesHint}
      </p>
    </div>
  );
};
