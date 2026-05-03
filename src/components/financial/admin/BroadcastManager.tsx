import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, History, Users, Building2, Shield, LayoutGrid, 
  AlertCircle, CheckCircle2, Clock, Info, RefreshCw, X,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../../services/financial/apiFetch';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../hooks/financial/useAuth';
import { toast } from 'sonner';
import { getErrorMessage } from '../../../utils/errorUtils';
import { broadcastI18n } from '../../../i18n/broadcast';
import { commonsI18n } from '../../../i18n/commons';
import { useRoles } from '../../../hooks/financial/useRoles';
import { useUsers } from '../../../hooks/financial/useUsers';
import { useCorporates } from '../../../hooks/financial/useCorporates';
import { useDepartments } from '../../../hooks/financial/useDepartments';
import { MultiSearchableSelect } from '../shared/MultiSearchableSelect';

interface BroadcastHistory {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  targetRoles: string[];
  targetUsers: string[];
  targetCorporates: string[];
  targetDepartments: string[];
  recipientCount: number;
  sentBy: string;
  createdAt: string;
}

export const BroadcastManager: React.FC = () => {
  const { language, user } = useAuth();
  const t = broadcastI18n[language];
  const common = commonsI18n[language];

  // Form State
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetUsers, setTargetUsers] = useState<string[]>([]);
  const [targetCorporates, setTargetCorporates] = useState<string[]>([]);
  const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Data State
  const [history, setHistory] = useState<BroadcastHistory[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Fetch target options
  const { data: roles = [] } = useRoles({ isActive: true });
  const { data: usersData = [] } = useUsers({ status: 'active', pageSize: 1000 }); // Large page size for select
  const { corporates = [] } = useCorporates();
  
  // For departments, we might want to filter by selected corporates, but the hook fetches all usually or needs a corp ID
  // For simplicity in broadcast, we'll fetch all active departments if possible or just use the hook
  const { departments = [] } = useDepartments();

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await apiFetch('/api/frs/notifications/broadcast/history');
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (err) {
      // Silently fail history load
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error(t.form.message + ' is required');
      return;
    }

    setIsSending(true);
    try {
      const res = await apiFetch('/api/frs/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          message,
          severity,
          targetRoles,
          targetUsers,
          targetCorporates,
          targetDepartments,
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(t.messages.success.replace('{count}', data.recipientCount.toString()));
        setMessage('');
        setTargetRoles([]);
        setTargetUsers([]);
        setTargetCorporates([]);
        setTargetDepartments([]);
        fetchHistory();
      } else {
        const errData = await res.json();
        throw errData;
      }
    } catch (err: any) {
      const errCode = err.error?.code || err.code || 'NETWORK_ERROR';
      toast.error(getErrorMessage(errCode, language));
    } finally {
      setIsSending(false);
    }
  };

  const roleOptions = useMemo(() => roles.map(r => ({ value: r.id, label: r.description })), [roles]);
  const userOptions = useMemo(() => usersData.map(u => ({ value: u.id, label: u.fullName, sublabel: u.username })), [usersData]);
  const corporateOptions = useMemo(() => corporates.map(c => ({ value: c.id, label: c.name })), [corporates]);
  const departmentOptions = useMemo(() => departments.map(d => ({ value: d.id, label: d.name })), [departments]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100">
              <Megaphone size={28} />
            </div>
            {t.title}
          </h2>
          <p className="text-sm text-slate-500 mt-2 flex items-center gap-2 ml-1">
            <Info size={16} className="text-indigo-400" />
            {t.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Broadcast Form */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden sticky top-6"
          >
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                <Send className="text-indigo-500" size={20} />
                {t.sendBroadcast}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">{t.form.message}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.form.messagePlaceholder}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">{t.form.severity}</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  {(['low', 'medium', 'high'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-tight rounded-lg transition-all",
                        severity === s 
                          ? (s === 'high' ? "bg-rose-500 text-white shadow-lg" : s === 'medium' ? "bg-amber-500 text-white shadow-lg" : "bg-emerald-500 text-white shadow-lg")
                          : "text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100 my-4" />
              
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.form.targetsAll}</p>

              <MultiSearchableSelect
                label={t.form.targetRoles}
                options={roleOptions}
                value={targetRoles}
                onChange={setTargetRoles}
                placeholder={common.all}
              />

              <MultiSearchableSelect
                label={t.form.targetUsers}
                options={userOptions}
                value={targetUsers}
                onChange={setTargetUsers}
                placeholder={common.all}
              />

              <div className="grid grid-cols-1 gap-4">
                <MultiSearchableSelect
                  label={t.form.targetCorporates}
                  options={corporateOptions}
                  value={targetCorporates}
                  onChange={setTargetCorporates}
                  placeholder={common.all}
                />
                <MultiSearchableSelect
                  label={t.form.targetDepartments}
                  options={departmentOptions}
                  value={targetDepartments}
                  onChange={setTargetDepartments}
                  placeholder={common.all}
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    {t.form.sending}
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    {t.form.sendButton}
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <History className="text-slate-400" size={24} />
              {t.history}
            </h3>
            <button 
              onClick={fetchHistory}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-all"
            >
              <RefreshCw size={20} className={isHistoryLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.table.sentAt}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.table.message}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.table.targets}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{t.table.recipientCount}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode='wait'>
                    {isHistoryLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`skeleton-${i}`} className="animate-pulse">
                          <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                          <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                          <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                          <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-12 mx-auto" /></td>
                        </tr>
                      ))
                    ) : history.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-400">
                            <Clock size={48} className="opacity-20" />
                            <p className="font-bold text-sm italic">No broadcast history found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      history.map((item, idx) => (
                        <motion.tr 
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">
                                {new Date(item.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short' })}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 max-w-md">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                                item.severity === 'high' ? "bg-rose-500" : item.severity === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                              )} />
                              <p className="text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed">
                                {item.message}
                              </p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-wrap gap-1">
                              {item.targetRoles.length > 0 && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase">{item.targetRoles.length} Roles</span>}
                              {item.targetUsers.length > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase">{item.targetUsers.length} Users</span>}
                              {item.targetCorporates.length > 0 && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-black uppercase">{item.targetCorporates.length} Corps</span>}
                              {item.targetRoles.length === 0 && item.targetUsers.length === 0 && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">All Users</span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="text-sm font-black text-slate-800">{item.recipientCount}</span>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
