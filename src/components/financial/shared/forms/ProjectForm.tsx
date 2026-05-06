// ProjectForm — Shared form component untuk Project.
// Dipakai oleh:
//   1. ProjectManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//
// Gunakan CorporateSelector dan SearchableSelect untuk departmentId.
// Tidak ada fetch data di dalam form.

import React from 'react';
import { cn } from '../../../../utils/cn';
import { projectI18n } from '../../../../i18n/project';
import { CorporateSelector } from '../CorporateSelector';
import { SearchableSelect } from '../SearchableSelect';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectPayload {
  name?: string;
  code?: string;
  corporateId?: string;
  corporateName?: string;
  departmentId?: string;
  departmentName?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ProjectFormProps {
  payload: ProjectPayload;
  onChange?: (field: keyof ProjectPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
  showCorporateSelector?: boolean;
  corporateSelectorDisabled?: boolean;
  departmentOptions?: Array<{ value: string; label: string }>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const FormField: React.FC<{
  label: string;
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  required?: boolean;
  type?: string;
  placeholder?: string;
}> = ({ label, value, onChange, readOnly = false, required = false, type = 'text', placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
      {label}
      {required && !readOnly && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
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

export const ProjectForm: React.FC<ProjectFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
  showCorporateSelector = true,
  corporateSelectorDisabled = false,
  departmentOptions = [],
}) => {
  const t = projectI18n[language];

  const isReadOnly = readOnly || !onChange;

  return (
    <div>
      <div className="space-y-6">
        {/* ── Corporate & Department ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Department */}
          {departmentOptions.length > 0 && !isReadOnly ? (
            <SearchableSelect
              label={<span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                {t.modal.department} <span className="text-red-500">*</span>
              </span>}
              options={departmentOptions}
              value={String(payload.departmentId ?? '')}
              onChange={(val) => onChange?.('departmentId', val)}
              placeholder={t.modal.selectDepartment}
              disabled={isReadOnly}
              required={!isReadOnly}
            />
          ) : (
            <FormField
              label={t.modal.department}
              value={String(payload.departmentName ?? payload.departmentId ?? '')}
              readOnly
            />
          )}
        </div>

        {/* ── Code & Name ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label={t.modal.code}
            value={String(payload.code ?? '')}
            onChange={(val) => onChange?.('code', val)}
            readOnly={isReadOnly}
            required
          />
          <FormField
            label={t.modal.name}
            value={String(payload.name ?? '')}
            onChange={(val) => onChange?.('name', val)}
            readOnly={isReadOnly}
            required
          />
        </div>

        {/* ── Start & End Date ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label={t.modal.startDate}
            value={String(payload.startDate ?? '')}
            onChange={(val) => onChange?.('startDate', val)}
            readOnly={isReadOnly}
            required
            type="date"
          />
          <FormField
            label={t.modal.endDate}
            value={String(payload.endDate ?? '')}
            onChange={(val) => onChange?.('endDate', val)}
            readOnly={isReadOnly}
            required
            type="date"
          />
        </div>

        {/* ── Description ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">{t.modal.description}</label>
          <textarea
            value={String(payload.description ?? '')}
            onChange={(e) => onChange?.('description', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};
