// RealizationForm — Shared form component untuk Cash Realization.
// Dipakai oleh:
//   1. RealizationManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//
// Support readOnly untuk semua input termasuk file attachment display.
// Tidak ada fetch data di dalam form.

import React from 'react';
import { Paperclip, FileText, Download } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { realizationI18n } from '../../../../i18n/realization';
import { NumericInput } from '../NumericInput';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RealizationAttachment {
  id?: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  [key: string]: unknown;
}

export interface RealizationPayload {
  departmentId?: string;
  departmentName?: string;
  projectId?: string;
  projectName?: string;
  corporateId?: string;
  corporateName?: string;
  costCenterId?: string;
  costCenterName?: string;
  entityType?: 'department' | 'project';
  transactionDate?: string;
  category?: 'cash_in' | 'cash_out';
  amount?: number;
  description?: string;
  notes?: string;
  attachments?: RealizationAttachment[];
  [key: string]: unknown;
}

export interface RealizationFormProps {
  payload: RealizationPayload;
  onChange?: (field: keyof RealizationPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
}

// ── Sub-components ────────────────────────────────────────────────────────────

const FormField: React.FC<{
  label: string;
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  type?: string;
  required?: boolean;
}> = ({ label, value, onChange, readOnly = false, type = 'text', required = false }) => (
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
      className={cn(
        'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
        readOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
      )}
    />
  </div>
);


// ── Main Component ────────────────────────────────────────────────────────────

export const RealizationForm: React.FC<RealizationFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
}) => {
  const t = realizationI18n[language];

  const isReadOnly = readOnly || !onChange;

  const attachments: RealizationAttachment[] = Array.isArray(payload.attachments) ? payload.attachments : [];

  const entityLabel = payload.entityType === 'project'
    ? t.modal.project
    : t.modal.department;

  const entityValue = payload.entityType === 'project'
    ? (payload.projectName ?? payload.projectId ?? '')
    : (payload.departmentName ?? payload.departmentId ?? '');

  return (
    <div>
      <div className="space-y-6">
        {/* ── Basic Info ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Entity Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.modal.entityType}</label>
            <select
              value={String(payload.entityType ?? '')}
              onChange={(e) => onChange?.('entityType', e.target.value)}
              disabled={isReadOnly}
              className={cn(
                'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
              )}
            >
              <option value="department">{t.modal.department}</option>
              <option value="project">{t.modal.project}</option>
            </select>
          </div>

          {/* Entity (Department or Project) */}
          <FormField
            label={entityLabel}
            value={String(entityValue)}
            readOnly
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Corporate */}
          <FormField
            label={t.modal.corporate}
            value={String(payload.corporateName ?? payload.corporateId ?? '')}
            readOnly
          />

          {/* Cost Center */}
          <FormField
            label={t.modal.costCenter}
            value={String(payload.costCenterName ?? payload.costCenterId ?? '')}
            readOnly
          />
        </div>

        {/* ── Transaction Detail ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transaction Date */}
          <FormField
            label={t.modal.transactionDate}
            value={String(payload.transactionDate ?? '')}
            onChange={(val) => onChange?.('transactionDate', val)}
            readOnly={isReadOnly}
            type="date"
            required
          />

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">
              {t.modal.category}
              {!isReadOnly && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={String(payload.category ?? '')}
              onChange={(e) => onChange?.('category', e.target.value)}
              disabled={isReadOnly}
              className={cn(
                'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
              )}
            >
              <option value="">{t.modal.category}</option>
              <option value="cash_in">{t.modal.cashIn}</option>
              <option value="cash_out">{t.modal.cashOut}</option>
            </select>
          </div>
        </div>

        {/* Amount */}
        <NumericInput
          label={t.modal.amount}
          value={parseFloat(String(payload.amount ?? 0)) || 0}
          onValueChange={(v) => onChange?.('amount', v.floatValue ?? 0)}
          disabled={isReadOnly}
        />

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight ml-1">{t.modal.notes}</label>
          <textarea
            value={String(payload.description ?? payload.notes ?? '')}
            onChange={(e) => onChange?.('description', e.target.value)}
            readOnly={isReadOnly}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
          />
        </div>

        {/* ── Attachments ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Paperclip size={14} className="text-slate-400" />
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.modal.attachmentSection}</label>
          </div>

          {attachments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">{t.modal.noAttachments}</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <div
                  key={attachment.id ?? index}
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <FileText size={16} className="text-indigo-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 flex-1 truncate">{attachment.fileName}</span>
                  {attachment.fileSize && (
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      {(attachment.fileSize / 1024).toFixed(1)} KB
                    </span>
                  )}
                  {attachment.fileUrl && (
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title={t.modal.downloadAttachment}
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* File upload — only shown in editable mode */}
          {!isReadOnly && (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-300 transition-colors">
              <Paperclip size={20} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400">{t.modal.dropOrClick}</p>
              <p className="text-[10px] text-slate-300 mt-1 whitespace-pre-line">{t.modal.fileHint}</p>
              <input
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length > 0) {
                    onChange?.('attachments', files);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ position: 'relative' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
