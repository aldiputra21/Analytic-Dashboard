import React, { useState, useMemo } from 'react';
import {
  RefreshCw, Settings2, Info, ChevronDown,
  CheckCircle2, AlertCircle, RotateCcw,
  BarChart3, Activity,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThresholds } from '../../../hooks/financial/useThresholds';
import { Threshold, CreateThresholdInput } from '../../../types/financial/threshold';
import { RatioName } from '../../../types/financial/ratio';
import { PeriodType } from '../../../types/financial/financialData';
import { useAuth } from '../../../hooks/financial/useAuth';
import { thresholdI18n } from '../../../i18n/threshold';
import { commonsI18n } from '../../../i18n/commons';
import { cn } from '../../../utils/cn';
import { toast } from 'sonner';
import { z } from 'zod';
import { SearchableSelect } from '../shared/SearchableSelect';

interface ThresholdConfigProps {
  subsidiaryId: string;
  subsidiaryName: string;
  subsidiaries?: Array<{ id: string; name: string }>;
  onSubsidiaryChange?: (id: string, name: string) => void;
}

const LOWER_IS_BETTER: RatioName[] = ['der'];
const RATIO_NAMES: RatioName[] = ['roa', 'roe', 'npm', 'der', 'currentRatio', 'quickRatio', 'cashRatio', 'ocfRatio', 'dscr'];
const PERIOD_TYPES: PeriodType[] = ['monthly', 'quarterly', 'annual'];

function getThresholdKey(ratioName: RatioName, periodType: PeriodType): string {
  return `${ratioName}__${periodType}`;
}

type EditableThreshold = {
  ratioName: RatioName;
  periodType: PeriodType;
  healthyMin?: string;
  moderateMin?: string;
  healthyMax?: string;
  moderateMax?: string;
};

export const ThresholdConfig: React.FC<ThresholdConfigProps> = ({ 
  subsidiaryId, 
  subsidiaryName,
  subsidiaries = [],
  onSubsidiaryChange
}) => {
  const { language } = useAuth();
  const t = thresholdI18n[language];
  const common = commonsI18n[language];

  // Validation Schema
  const thresholdValueSchema = z.string().refine(v => {
    if (v === '') return true;
    const n = parseFloat(v);
    return !isNaN(n) && n >= 0;
  }, {
    message: t.validation.positiveNumber
  });

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('annual');
  const [editValues, setEditValues] = useState<Record<string, EditableThreshold>>({});
  const [saving, setSaving] = useState(false);

  const { thresholds, isLoading, error, updateThresholds, resetToDefaults } = useThresholds({
    subsidiaryId,
    periodType: selectedPeriod,
  });

  const thresholdMap = useMemo(() => {
    const map: Record<string, Threshold> = {};
    for (const threshold of thresholds) {
      map[getThresholdKey(threshold.ratioName, threshold.periodType)] = threshold;
    }
    return map;
  }, [thresholds]);

  function getEditValue(ratioName: RatioName, field: keyof EditableThreshold): string {
    const key = getThresholdKey(ratioName, selectedPeriod);
    const edit = editValues[key];
    if (edit && field in edit) return (edit as any)[field] ?? '';

    const threshold = thresholdMap[key];
    if (!threshold) return '';

    if (field === 'healthyMin') return threshold.healthyMin?.toString() ?? '';
    if (field === 'moderateMin') return threshold.moderateMin?.toString() ?? '';
    if (field === 'healthyMax') return threshold.healthyMax?.toString() ?? '';
    if (field === 'moderateMax') return threshold.moderateMax?.toString() ?? '';
    return '';
  }

  function handleChange(ratioName: RatioName, field: keyof EditableThreshold, value: string) {
    const key = getThresholdKey(ratioName, selectedPeriod);
    setEditValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], ratioName, periodType: selectedPeriod, [field]: value },
    }));
  }

  async function handleSave() {
    // Basic validation check
    for (const key in editValues) {
      const edit = editValues[key];
      const fields: (keyof EditableThreshold)[] = ['healthyMin', 'moderateMin', 'healthyMax', 'moderateMax'];
      for (const field of fields) {
        if (edit[field] !== undefined) {
          const result = thresholdValueSchema.safeParse(edit[field]);
          if (!result.success) {
            toast.error(`${t.ratioLabels[edit.ratioName]}: ${result.error.issues[0].message}`);
            return;
          }
        }
      }
    }

    setSaving(true);
    try {
      const updates: Omit<CreateThresholdInput, 'subsidiaryId'>[] = RATIO_NAMES.map((ratioName) => {
        const key = getThresholdKey(ratioName, selectedPeriod);
        const edit = editValues[key];
        const existing = thresholdMap[key];

        const parseNum = (v: string | undefined, fallback: number | undefined) => {
          if (v === undefined) return fallback;
          const n = parseFloat(v);
          return isNaN(n) ? fallback : n;
        };

        if (LOWER_IS_BETTER.includes(ratioName)) {
          return {
            ratioName,
            periodType: selectedPeriod,
            healthyMax: parseNum(edit?.healthyMax, existing?.healthyMax),
            moderateMax: parseNum(edit?.moderateMax, existing?.moderateMax),
          };
        }
        return {
          ratioName,
          periodType: selectedPeriod,
          healthyMin: parseNum(edit?.healthyMin, existing?.healthyMin),
          moderateMin: parseNum(edit?.moderateMin, existing?.moderateMin),
        };
      });

      await updateThresholds(updates);
      setEditValues({});
      toast.success(t.alerts.successSave);
    } catch (err: any) {
      toast.error(err.message || t.alerts.errorSave);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!window.confirm(t.confirmReset)) return;
    setSaving(true);
    try {
      await resetToDefaults();
      setEditValues({});
      toast.success(t.alerts.successReset);
    } catch (err: any) {
      toast.error(err.message || t.alerts.errorReset);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {subsidiaries.length > 1 ? (
            <div className="w-64">
              <SearchableSelect
                options={subsidiaries.map(s => ({ value: s.id, label: s.name }))}
                value={subsidiaryId}
                onChange={(val) => {
                  const sub = subsidiaries.find(s => s.id === val);
                  if (sub && onSubsidiaryChange) onSubsidiaryChange(sub.id, sub.name);
                }}
                placeholder={common.search}
                label={t.subsidiary}
              />
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                  <Settings2 size={24} />
                </div>
                {t.title}
              </h2>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 ml-1 font-bold">
                <Building2 size={14} className="text-indigo-400" />
                {subsidiaryName}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            {PERIOD_TYPES.map((pt) => (
              <button
                key={pt}
                onClick={() => setSelectedPeriod(pt)}
                className={cn(
                  "px-4 py-1.5 text-xs font-black rounded-lg transition-all uppercase tracking-widest",
                  selectedPeriod === pt
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t.periods[pt]}
              </button>
            ))}
          </div>

          <button
            onClick={handleReset}
            disabled={saving || isLoading}
            className="px-4 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw size={16} />
            {t.resetDefaults}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || isLoading}
            className="px-6 py-2 text-xs font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 cursor-pointer disabled:opacity-50 min-w-[140px] justify-center"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {saving ? common.saving : t.saveChanges}
          </button>
        </div>
      </div>

      {/* Datatable section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">{t.tableHead.ratio}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.healthy}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.tableHead.moderate}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{common.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 9 }).map((_, i) => (
                    <motion.tr
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="animate-pulse"
                    >
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-32" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-xl w-24" /></td>
                      <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-xl w-24" /></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20 ml-auto" /></td>
                    </motion.tr>
                  ))
                ) : error ? (
                  <motion.tr
                    key="error"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <td colSpan={4}>
                      <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 bg-red-50 rounded-full text-red-400 border border-red-100">
                          <AlertCircle size={48} />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-lg">{common.errorLoadTable}</p>
                          <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">{error}</p>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  RATIO_NAMES.map((ratioName, idx) => {
                    const key = getThresholdKey(ratioName, selectedPeriod);
                    const threshold = thresholdMap[key];
                    const isLower = LOWER_IS_BETTER.includes(ratioName);

                    return (
                      <motion.tr
                        key={ratioName}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                              <Activity size={16} />
                            </div>
                            <div>
                              <p className="text-sm text-slate-800">{t.ratioLabels[ratioName]}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                                {isLower ? t.better.lower : t.better.higher}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 group/input">
                            <span className="text-xs font-black text-emerald-500">{isLower ? '≤' : '≥'}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={isLower ? getEditValue(ratioName, 'healthyMax') : getEditValue(ratioName, 'healthyMin')}
                              onChange={(e) => handleChange(ratioName, isLower ? 'healthyMax' : 'healthyMin', e.target.value)}
                              className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all group-hover/input:bg-white"
                              placeholder="—"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 group/input">
                            <span className="text-xs font-black text-amber-500">{isLower ? '≤' : '≥'}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={isLower ? getEditValue(ratioName, 'moderateMax') : getEditValue(ratioName, 'moderateMin')}
                              onChange={(e) => handleChange(ratioName, isLower ? 'moderateMax' : 'moderateMin', e.target.value)}
                              className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all group-hover/input:bg-white"
                              placeholder="—"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {threshold ? (
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border",
                              threshold.isDefault
                                ? "bg-slate-50 text-slate-500 border-slate-100"
                                : "bg-indigo-50 text-indigo-700 border-indigo-100"
                            )}>
                              {threshold.isDefault ? t.status.default : t.status.custom}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-start gap-3">
        <Info size={18} className="text-indigo-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {t.note}
        </p>
      </div>
    </div>
  );
};
