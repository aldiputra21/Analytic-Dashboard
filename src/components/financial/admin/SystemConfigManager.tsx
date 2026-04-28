import React, { useState, useEffect } from 'react';
import { 
  Settings2, Plus, Edit2, Trash2, Search, RefreshCw, X, Save, 
  AlertCircle, Info, ChevronLeft, ChevronRight, FilterX 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../../../services/financial/apiFetch';
import { useAuth } from '../../../hooks/financial/useAuth';
import { commonsI18n } from '../../../i18n/commons';
import { toast } from 'sonner';
import { cn } from '../../../utils/cn';

interface SystemConfig {
  key: string;
  value: any;
  description: string | null;
  updatedAt: string | null;
}

export const SystemConfigManager: React.FC = () => {
  const { language, hasPermission } = useAuth();
  const common = commonsI18n[language];
  
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: ''
  });

  const canWrite = hasPermission('public.system_configs.write');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/system-configs');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      } else {
        toast.error(common.errorLoadTable);
      }
    } catch (err) {
      toast.error(common.errorLoadTable);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (config?: SystemConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        key: config.key,
        value: typeof config.value === 'object' ? JSON.stringify(config.value, null, 2) : String(config.value),
        description: config.description || ''
      });
    } else {
      setEditingConfig(null);
      setFormData({ key: '', value: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    
    setIsSaving(true);
    try {
      let parsedValue: any = formData.value;
      
      // Try to parse as JSON if it looks like JSON
      if (formData.value.trim().startsWith('{') || formData.value.trim().startsWith('[')) {
        try {
          parsedValue = JSON.parse(formData.value);
        } catch (e) {
          // Keep as string if parsing fails
        }
      } else if (formData.value.toLowerCase() === 'true') {
        parsedValue = true;
      } else if (formData.value.toLowerCase() === 'false') {
        parsedValue = false;
      } else if (!isNaN(Number(formData.value)) && formData.value.trim() !== '') {
        parsedValue = Number(formData.value);
      }

      const url = editingConfig ? `/api/system-configs/${editingConfig.key}` : '/api/system-configs';
      const method = editingConfig ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: formData.key,
          value: parsedValue,
          description: formData.description
        })
      });

      if (res.ok) {
        toast.success(common.success);
        setIsModalOpen(false);
        fetchConfigs();
      } else {
        const err = await res.json();
        toast.error(err.message || common.error);
      }
    } catch (err) {
      toast.error(common.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm(common.deleteConfirm)) return;
    
    try {
      const res = await apiFetch(`/api/system-configs/${key}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(common.success);
        fetchConfigs();
      } else {
        toast.error(common.error);
      }
    } catch (err) {
      toast.error(common.error);
    }
  };

  const filteredConfigs = configs.filter(c => 
    c.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={common.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConfigs}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title={common.retry}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          
          {canWrite && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              <Plus size={16} />
              {language === 'id' ? 'Tambah Konfig' : 'Add Config'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4 text-left">Key</th>
                <th className="px-6 py-4 text-left">Value</th>
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-40" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                    <Settings2 size={48} className="mx-auto mb-4 opacity-20" />
                    <p>{language === 'id' ? 'Tidak ada konfigurasi ditemukan' : 'No configurations found'}</p>
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((config) => (
                  <tr key={config.key} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-800">{config.key}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate font-mono text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                        {typeof config.value === 'object' ? JSON.stringify(config.value) : String(config.value)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{config.description || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canWrite && (
                          <>
                            <button
                              onClick={() => handleOpenModal(config)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(config.key)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Settings2 size={18} />
                  </div>
                  {editingConfig ? (language === 'id' ? 'Edit Konfigurasi' : 'Edit Configuration') : (language === 'id' ? 'Tambah Konfigurasi' : 'Add Configuration')}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Config Key</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData(p => ({ ...p, key: e.target.value }))}
                    disabled={!!editingConfig}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-mono disabled:opacity-50"
                    placeholder="APP_SETTING_NAME"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Value (JSON/String/Number)</label>
                  <textarea
                    value={formData.value}
                    onChange={(e) => setFormData(p => ({ ...p, value: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-mono h-32 resize-none"
                    placeholder='{"example": "value"}'
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm h-20 resize-none"
                    placeholder="What is this configuration for?"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    {common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    {common.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
