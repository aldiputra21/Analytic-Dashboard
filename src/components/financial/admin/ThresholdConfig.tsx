// ThresholdConfig.tsx - Admin component for configuring threshold values
// Requirements: 5.10, 15.1, 15.7

import React, { useState, useMemo } from 'react';
import { useThresholds } from '../../../hooks/financial/useThresholds';
import { Threshold, CreateThresholdInput } from '../../../types/financial/threshold';
import { RatioName } from '../../../types/financial/ratio';
import { PeriodType } from '../../../types/financial/financialData';

interface ThresholdConfigProps {
  subsidiaryId: string;
  subsidiaryName: string;
}

const RATIO_LABELS: Record<RatioName, string> = {
  roa: 'ROA (%)',
  roe: 'ROE (%)',
  npm: 'NPM (%)',
  der: 'DER',
  currentRatio: 'Current Ratio',
  quickRatio: 'Quick Ratio',
  cashRatio: 'Cash Ratio',
  ocfRatio: 'OCF Ratio',
  dscr: 'DSCR',
};

// Ratios where lower is better (DER)
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

export const ThresholdConfig: React.FC<ThresholdConfigProps> = ({ subsidiaryId, subsidiaryName }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('annual');
  const [editValues, setEditValues] = useState<Record<string, EditableThreshold>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { thresholds, isLoading, error, updateThresholds, resetToDefaults } = useThresholds({
    subsidiaryId,
    periodType: selectedPeriod,
  });

  // Build a lookup map from thresholds
  const thresholdMap = useMemo(() => {
    const map: Record<string, Threshold> = {};
    for (const t of thresholds) {
      map[getThresholdKey(t.ratioName, t.periodType)] = t;
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
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to save thresholds');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm('Reset all thresholds to industry defaults?')) return;
    setSaving(true);
    setSaveError(null);
    try {
      await resetToDefaults();
      setEditValues({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message ?? 'Failed to reset thresholds');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Threshold Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subsidiaryName}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
            {PERIOD_TYPES.map((pt) => (
              <button
                key={pt}
                onClick={() => setSelectedPeriod(pt)}
                className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                  selectedPeriod === pt
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pt}
              </button>
            ))}
          </div>
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
          Thresholds saved successfully.
        </div>
      )}

      {/* Threshold table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 w-32">Ratio</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Healthy Threshold</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Moderate Threshold</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 w-24">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {RATIO_NAMES.map((ratioName) => {
              const key = getThresholdKey(ratioName, selectedPeriod);
              const threshold = thresholdMap[key];
              const isLower = LOWER_IS_BETTER.includes(ratioName);

              return (
                <tr key={ratioName} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">{RATIO_LABELS[ratioName]}</span>
                    <span className="block text-xs text-slate-400 mt-0.5">
                      {isLower ? 'lower is better' : 'higher is better'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">{isLower ? '≤' : '≥'}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={isLower
                          ? getEditValue(ratioName, 'healthyMax')
                          : getEditValue(ratioName, 'healthyMin')
                        }
                        onChange={(e) => handleChange(ratioName, isLower ? 'healthyMax' : 'healthyMin', e.target.value)}
                        className="w-24 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="—"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">{isLower ? '≤' : '≥'}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={isLower
                          ? getEditValue(ratioName, 'moderateMax')
                          : getEditValue(ratioName, 'moderateMin')
                        }
                        onChange={(e) => handleChange(ratioName, isLower ? 'moderateMax' : 'moderateMin', e.target.value)}
                        className="w-24 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="—"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {threshold ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        threshold.isDefault
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {threshold.isDefault ? 'Default' : 'Custom'}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Thresholds define when alerts are generated. Healthy thresholds must be more favorable than moderate thresholds.
      </p>
    </div>
  );
};
