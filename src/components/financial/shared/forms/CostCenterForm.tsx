// CostCenterForm — Shared form component untuk Cost Center.
// Dipakai oleh:
//   1. CostCenterManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//
// Gunakan SearchableSelect untuk categoryId.
// Tidak ada fetch data di dalam form.

import React from 'react';
import { cn } from '../../../../utils/cn';
import { costCenterI18n } from '../../../../i18n/cost-center';
import { CorporateSelector } from '../CorporateSelector';
import { SearchableSelect } from '../SearchableSelect';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CostCenterPayload {
  name?: string;
  code?: string;
  corporateId?: string;
  corporateName?: string;
  categoryId?: string;
  categoryName?: string;
  parentId?: string;
  parentName?: string;
  description?: string;
  [key: string]: unknown;
}

export interface CostCenterFormProps {
  payload: CostCenterPayload;
  onChange?: (field: keyof CostCenterPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
  showCorporateSelector?: boolean;
  corporateSelectorDisabled?: boolean;
  categoryOptions?: Array<{ value: string; label: string }>;
  parentOptions?: Array<{ value: string; label: string }>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const FormField: React.FC<{
  label: string;
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, readOnly = false, required = false, placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
      {label}
      {required && !readOnly && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder={readOnly ? '' : placeholder}
      className={cn(
        'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
        readOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
      )}
    />
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const CostCenterForm: React.FC<CostCenterFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
  showCorporateSelector = true,
  corporateSelectorDisabled = false,
  categoryOptions = [],
  parentOptions = [],
}) => {
  const t = costCenterI18n[language];

  const isReadOnly = readOnly || !onChange;

  return (
    <div>
      <div className="space-y-6">
        {/* ── Corporate ── */}
        {showCorporateSelector && (
          <CorporateSelector
            label={t.modal.corporate}
            value={String(payload.corporateId ?? '')}
            onChange={(val) => onChange?.('corporateId', val)}
            placeholder={language === 'id' ? 'Pilih Perusahaan' : 'Select Corporate'}
            disabled={isReadOnly || corporateSelectorDisabled}
            required={!isReadOnly}
          />
        )}

        {/* ── Code & Name ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label={t.modal.code}
            value={String(payload.code ?? '')}
            onChange={(val) => onChange?.('code', val)}
            readOnly={isReadOnly}
            required
            placeholder={t.modal.codePlaceholder}
          />
          <FormField
            label={t.modal.name}
            value={String(payload.name ?? '')}
            onChange={(val) => onChange?.('name', val)}
            readOnly={isReadOnly}
            required
            placeholder={t.modal.namePlaceholder}
          />
        </div>

        {/* ── Category ── */}
        {categoryOptions.length > 0 && !isReadOnly ? (
          <SearchableSelect
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
              {t.modal.category} <span className="text-red-500">*</span>
            </span>}
            options={categoryOptions}
            value={String(payload.categoryId ?? '')}
            onChange={(val) => onChange?.('categoryId', val)}
            placeholder={t.modal.selectCategory}
            disabled={isReadOnly}
            required={!isReadOnly}
          />
        ) : (
          <FormField
            label={t.modal.category}
            value={String(payload.categoryName ?? payload.categoryId ?? '')}
            readOnly
          />
        )}

        {/* ── Parent ── */}
        {parentOptions.length > 0 && !isReadOnly ? (
          <SearchableSelect
            label={<span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
              {t.modal.parent}
            </span>}
            options={[{ value: '', label: t.modal.none }, ...parentOptions]}
            value={String(payload.parentId ?? '')}
            onChange={(val) => onChange?.('parentId', val || undefined)}
            placeholder={t.modal.none}
            disabled={isReadOnly}
          />
        ) : payload.parentId ? (
          <FormField
            label={t.modal.parent}
            value={String(payload.parentName ?? payload.parentId ?? '')}
            readOnly
          />
        ) : null}

        {/* ── Description ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">{t.modal.description}</label>
          <textarea
            value={String(payload.description ?? '')}
            onChange={(e) => onChange?.('description', e.target.value)}
            readOnly={isReadOnly}
            placeholder={isReadOnly ? '' : t.modal.descPlaceholder}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};
