// CorporateForm — Shared form component untuk Corporate.
// Dipakai oleh:
//   1. CorporateManager.tsx (di dalam modal CRUD)
//   2. formRegistry.tsx via createApprovalFormAdapter (di approval context)
//
// Gunakan SearchableSelect untuk industry dan currency.
// Tidak ada fetch data di dalam form.

import React from 'react';
import { Building2, Globe, Phone, Mail, Image } from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { corporateI18n } from '../../../../i18n/corporate';
import { SearchableSelect } from '../SearchableSelect';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CorporatePayload {
  name?: string;
  code?: string;
  industry?: string;
  sectorId?: string;
  sectorName?: string;
  currency?: string;
  currencyCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  taxRate?: number;
  fiscalYearStart?: number;
  [key: string]: unknown;
}

export interface CorporateFormProps {
  payload: CorporatePayload;
  onChange?: (field: keyof CorporatePayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
  sectorOptions?: Array<{ value: string; label: string }>;
  currencyOptions?: Array<{ value: string; label: string }>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const FormField: React.FC<{
  label: string;
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, onChange, readOnly = false, type = 'text', required = false, icon }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
      {icon}
      {label}
      {required && !readOnly && <span className="text-red-500">*</span>}
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

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; color: string }> = ({ title, icon, color }) => (
  <div className={cn('flex items-center gap-2 mb-4 pb-2 border-b-2', color)}>
    <div className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-100">{icon}</div>
    <h4 className="font-bold text-sm text-slate-700 tracking-tight uppercase">{title}</h4>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

export const CorporateForm: React.FC<CorporateFormProps> = ({
  payload,
  onChange,
  readOnly = false,
  language,
  sectorOptions = [],
  currencyOptions = [],
}) => {
  const t = corporateI18n[language];

  const isReadOnly = readOnly || !onChange;

  return (
    <div>
      <div className="space-y-6">
        {/* ── Basic Info ── */}
        <div>
          <SectionHeader
            title={t.modal.basicInfo}
            icon={<Building2 size={16} className="text-indigo-500" />}
            color="border-indigo-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label={t.modal.name}
              value={String(payload.name ?? '')}
              onChange={(val) => onChange?.('name', val)}
              readOnly={isReadOnly}
              required
            />
            <FormField
              label={t.modal.code}
              value={String(payload.code ?? '')}
              onChange={(val) => onChange?.('code', val)}
              readOnly={isReadOnly}
              required
            />

            {/* Industry / Sector */}
            {sectorOptions.length > 0 && !isReadOnly ? (
              <SearchableSelect
                label={<span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                  {t.modal.sector} <span className="text-red-500">*</span>
                </span>}
                options={sectorOptions}
                value={String(payload.sectorId ?? payload.industry ?? '')}
                onChange={(val) => onChange?.('sectorId', val)}
                placeholder={t.modal.sector}
                disabled={isReadOnly}
                required={!isReadOnly}
              />
            ) : (
              <FormField
                label={t.modal.sector}
                value={String(payload.sectorName ?? payload.sectorId ?? payload.industry ?? '')}
                readOnly
              />
            )}

            {/* Currency */}
            {currencyOptions.length > 0 && !isReadOnly ? (
              <SearchableSelect
                label={<span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                  {t.modal.currency} <span className="text-red-500">*</span>
                </span>}
                options={currencyOptions}
                value={String(payload.currency ?? payload.currencyCode ?? '')}
                onChange={(val) => onChange?.('currency', val)}
                placeholder={t.modal.currency}
                disabled={isReadOnly}
                required={!isReadOnly}
              />
            ) : (
              <FormField
                label={t.modal.currency}
                value={String(payload.currency ?? payload.currencyCode ?? '')}
                readOnly
              />
            )}
          </div>
        </div>

        {/* ── Financial Config ── */}
        <div>
          <SectionHeader
            title={t.modal.financialConfig}
            icon={<Globe size={16} className="text-emerald-500" />}
            color="border-emerald-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.modal.taxRate}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={payload.taxRate ?? ''}
                  onChange={(e) => onChange?.('taxRate', parseFloat(e.target.value) || 0)}
                  readOnly={isReadOnly}
                  min={0}
                  max={100}
                  step={0.01}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                    isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
                  )}
                />
                <span className="text-sm font-bold text-slate-500 shrink-0">%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">{t.modal.fiscalYear}</label>
              <input
                type="number"
                value={payload.fiscalYearStart ?? ''}
                onChange={(e) => onChange?.('fiscalYearStart', parseInt(e.target.value) || 1)}
                readOnly={isReadOnly}
                min={1}
                max={12}
                className={cn(
                  'w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/30',
                  isReadOnly && 'bg-slate-100 cursor-not-allowed font-medium text-slate-600 border-none shadow-none',
                )}
              />
            </div>
          </div>
        </div>

        {/* ── Contact Info ── */}
        <div>
          <SectionHeader
            title={language === 'id' ? 'Informasi Kontak' : 'Contact Information'}
            icon={<Phone size={16} className="text-amber-500" />}
            color="border-amber-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label={language === 'id' ? 'Alamat' : 'Address'}
              value={String(payload.address ?? '')}
              onChange={(val) => onChange?.('address', val)}
              readOnly={isReadOnly}
              icon={<Building2 size={12} />}
            />
            <FormField
              label={language === 'id' ? 'Telepon' : 'Phone'}
              value={String(payload.phone ?? '')}
              onChange={(val) => onChange?.('phone', val)}
              readOnly={isReadOnly}
              type="tel"
              icon={<Phone size={12} />}
            />
            <FormField
              label="Email"
              value={String(payload.email ?? '')}
              onChange={(val) => onChange?.('email', val)}
              readOnly={isReadOnly}
              type="email"
              icon={<Mail size={12} />}
            />
          </div>
        </div>

        {/* ── Logo ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
            <Image size={12} />
            {t.modal.logo}
          </label>
          {payload.logo ? (
            <div className="flex items-center gap-4">
              <img
                src={String(payload.logo)}
                alt="Logo"
                className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1"
              />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => onChange?.('logo', '')}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  {language === 'id' ? 'Hapus Logo' : 'Remove Logo'}
                </button>
              )}
            </div>
          ) : (
            !isReadOnly && (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-300 transition-colors">
                <Image size={20} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">{t.modal.dropOrClick}</p>
                <p className="text-[10px] text-slate-300 mt-1 whitespace-pre-line">{t.modal.logoHint}</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onChange?.('logo', file);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  style={{ position: 'relative' }}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
