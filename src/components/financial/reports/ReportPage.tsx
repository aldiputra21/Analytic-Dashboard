// ReportPage.tsx — User-facing page for filling filters and generating a dynamic Excel report
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10

import React, { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../../services/financial/apiFetch';
import { useAuth } from '../../../hooks/financial/useAuth';
import { reportConfigI18n } from '../../../i18n/report-config';
import { commonsI18n } from '../../../i18n/commons';
import { getErrorMessage } from '../../../utils/errorUtils';
import { DynamicFilterField } from './DynamicFilterField';
import type { ReportConfig, FilterConfig } from '../../../types/financial/reportConfig';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReportPageProps {
  configId: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ReportPageSkeleton: React.FC = () => (
  <div className="p-6 space-y-6 animate-pulse">
    {/* Title */}
    <div className="h-7 bg-slate-200 rounded-lg w-1/3" />
    {/* Filter section header */}
    <div className="h-4 bg-slate-200 rounded w-1/5" />
    {/* Filter fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-1/3" />
          <div className="h-10 bg-slate-200 rounded-xl" />
        </div>
      ))}
    </div>
    {/* Button */}
    <div className="h-10 bg-slate-200 rounded-xl w-40" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const ReportPage: React.FC<ReportPageProps> = ({ configId }) => {
  const { language } = useAuth();
  const t = reportConfigI18n[language];
  const common = commonsI18n[language];

  // ── State ─────────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // filterValues: keyed by paramName
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  // Track which required fields have been touched and are empty
  const [touchedErrors, setTouchedErrors] = useState<Record<string, boolean>>({});

  const [isGenerating, setIsGenerating] = useState(false);

  // ── Fetch config ──────────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await apiFetch(`/api/frs/report-configs/${configId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw errData;
      }
      const data: ReportConfig = await res.json();
      setConfig(data);

      // Initialize filter values — range types get { from: '', to: '' }
      const initial: Record<string, unknown> = {};
      const RANGE_TYPES = new Set(['date_range', 'numeric_range', 'month_range']);
      (data.filters ?? []).forEach((f) => {
        initial[f.paramName] = RANGE_TYPES.has(f.type) ? { from: '', to: '' } : '';
      });
      setFilterValues(initial);
      setTouchedErrors({});
    } catch (err: unknown) {
      const errCode =
        (err as { error?: { code?: string }; code?: string })?.error?.code ??
        (err as { code?: string })?.code ??
        'NETWORK_ERROR';
      const msg = getErrorMessage(errCode, language) || t.reportPage.errorLoadConfig;
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [configId, language, t.reportPage.errorLoadConfig]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ── Sorted filters ────────────────────────────────────────────────────────
  const sortedFilters: FilterConfig[] = config
    ? [...(config.filters ?? [])].sort((a, b) => a.order - b.order)
    : [];

  // ── Handle filter change ──────────────────────────────────────────────────
  const handleFilterChange = (paramName: string, value: unknown) => {
    setFilterValues((prev) => ({ ...prev, [paramName]: value }));
    // Clear error once user fills the field
    const isRangeVal = value && typeof value === 'object' && 'from' in value && 'to' in value;
    const rangeHasValue = isRangeVal && (
      (value as { from: unknown }).from !== '' ||
      (value as { to: unknown }).to !== ''
    );
    if (value !== '' && value !== null && value !== undefined && (!isRangeVal || rangeHasValue)) {
      setTouchedErrors((prev) => ({ ...prev, [paramName]: false }));
    }
  };

  // ── Validate required filters ─────────────────────────────────────────────
  const validateFilters = (): boolean => {
    const errors: Record<string, boolean> = {};
    let hasError = false;

    sortedFilters.forEach((f) => {
      if (f.required) {
        const val = filterValues[f.paramName];
        const isRangeVal = val && typeof val === 'object' && 'from' in val && 'to' in val;
        const isEmpty = isRangeVal
          ? (val as { from: unknown; to: unknown }).from === '' && (val as { from: unknown; to: unknown }).to === ''
          : val === '' || val === null || val === undefined;
        if (isEmpty) {
          errors[f.paramName] = true;
          hasError = true;
        }
      }
    });

    setTouchedErrors(errors);
    return !hasError;
  };

  // ── Handle generate ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!config) return;
    if (isGenerating) return;

    if (!validateFilters()) {
      toast.error(t.reportPage.requiredFieldsError);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await apiFetch('/api/frs/report-outputs', {
        method: 'POST',
        body: JSON.stringify({
          configId: config.id,
          filterValues,
        }),
      });

      if (res.status === 202) {
        toast.success(t.reportPage.processingMessage);
      } else if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errCode =
          errData?.error?.code ?? errData?.code ?? 'NETWORK_ERROR';
        toast.error(getErrorMessage(errCode, language) || t.reportPage.errorGenerateFailed);
      } else {
        // 200 or other success
        toast.success(t.reportPage.processingMessage);
      }
    } catch {
      toast.error(t.reportPage.errorGenerateFailed);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Render: loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return <ReportPageSkeleton />;
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (loadError || !config) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="p-4 bg-red-50 rounded-full">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700 mb-1">
              {t.reportPage.errorLoadConfig}
            </p>
            {loadError && (
              <p className="text-xs text-slate-500">{loadError}</p>
            )}
          </div>
          <button
            type="button"
            onClick={fetchConfig}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            {common.retry}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: page title ────────────────────────────────────────────────────
  const pageTitle = language === 'id' ? config.titleId : config.titleEn;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 ring-4 ring-indigo-50">
            <FileSpreadsheet size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{pageTitle}</h1>
            <p className="text-sm text-slate-500 font-medium">{t.reportPage.filterSectionTitle}</p>
          </div>
        </div>
      </div>

      {/* ── Filter Section ── */}
      {sortedFilters.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden backdrop-blur-sm">
          {/* Section header */}
          <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/40 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {t.reportPage.filterSectionTitle}
            </h2>
          </div>

          {/* Filter list - Left-aligned vertical layout */}
          <div className="p-8 flex flex-col gap-6 max-w-2xl">
            {sortedFilters.map((filter) => (
              <DynamicFilterField
                key={filter.paramName}
                filter={filter}
                configId={config.id}
                value={filterValues[filter.paramName] ?? ''}
                onChange={(val) => handleFilterChange(filter.paramName, val)}
                language={language}
                hasError={touchedErrors[filter.paramName] === true}
              />
            ))}
          </div>

          {/* Action Footer */}
          <div className="px-8 py-6 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`
                group relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold
                transition-all cursor-pointer shadow-lg active:scale-95
                ${isGenerating
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{common.loading}</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                  <span>{t.reportPage.generateButton}</span>
                </>
              )}
            </button>

            {isGenerating && (
              <div className="flex items-center gap-2 text-indigo-600 animate-pulse">
                <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                <p className="text-xs font-bold italic">
                  {t.reportPage.processingMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State if no filters */}
      {sortedFilters.length === 0 && (
        <div className="bg-white rounded-[2rem] border border-dashed border-slate-300 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="text-slate-400" size={32} />
          </div>
          <p className="text-slate-500 font-medium">No filters required for this report.</p>
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-600 transition-colors"
          >
            {t.reportPage.generateButton}
          </button>
        </div>
      )}
    </div>
  );
};
