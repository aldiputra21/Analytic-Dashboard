// DepartmentForm — Shared form component untuk Department.
// Dipakai oleh:
//   1. DepartmentManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//
// Gunakan CorporateSelector untuk corporateId.
// Tidak ada fetch data di dalam form.

import React from 'react';
import { cn } from '../../../../utils/cn';
import { departmentI18n } from '../../../../i18n/department';
import { CorporateSelector } from '../CorporateSelector';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DepartmentPayload {
  name?: string;
  code?: string;
  corporateId?: string;
  corporateName?: string;
  head?: string;
  description?: string;
  [key: string]: unknown;
}

export interface DepartmentFormProps {
  payload: DepartmentPayload;
  onChange?: (field: keyof DepartmentPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
  showCorporateSelector?: boolean;
  corporateSelectorDisabled?: boolean;
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

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
  showCorporateSelector = true,
  corporateSelectorDisabled = false,
}) => {
  const t = departmentI18n[language];

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
            placeholder={t.modal.selectCorporate}
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

        {/* ── Head ── */}
        <FormField
          label={t.modal.head}
          value={String(payload.head ?? '')}
          onChange={(val) => onChange?.('head', val)}
          readOnly={isReadOnly}
          placeholder={t.modal.headPlaceholder}
        />

        {/* ── Description ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">{t.modal.description}</label>
          <textarea
            value={String(payload.description ?? '')}
            onChange={(e) => onChange?.('description', e.target.value)}
            readOnly={isReadOnly}
            placeholder={isReadOnly ? '' : t.modal.descriptionPlaceholder}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};
