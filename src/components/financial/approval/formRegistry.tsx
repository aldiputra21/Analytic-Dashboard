// Form Registry — maps viewComponent keys (stored in DB) to React components.
//
// TIDAK perlu membuat file wrapper per-modul.
// Gunakan createApprovalFormAdapter() untuk mendaftarkan shared form langsung.
//
// Cara menambahkan modul baru (cukup 1 baris):
//   import { MyEntityForm } from '../shared/forms/MyEntityForm';
//   'MyEntityApprovalForm': createApprovalFormAdapter(MyEntityForm),

import React from 'react';
import { BalanceSheetForm } from '../shared/forms/BalanceSheetForm';
import type { BalanceSheetPayload } from '../shared/forms/BalanceSheetForm';

// ── ApprovalFormProps — kontrak yang diterima ApprovalDetailModal ─────────────

export interface StagedAttachment {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: string;
}

export interface ApprovalFormProps {
  payload: Record<string, unknown>;
  originalData?: Record<string, unknown>;
  onChange?: (field: string, value: unknown) => void;
  onFilesChange?: (files: File[]) => void;
  stagedFiles?: StagedAttachment[];
  onStagedFileRemove?: (attachmentId: string) => void;
  readOnly: boolean;
  language: 'id' | 'en';
}

// ── SharedFormProps — kontrak yang harus diimplementasikan shared form ────────
//
// Setiap shared form (BalanceSheetForm, IncomeStatementForm, dll.) harus
// menerima props ini agar bisa didaftarkan via createApprovalFormAdapter.

export interface SharedFormProps<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  payload: TPayload;
  onChange?: (field: keyof TPayload, value: unknown) => void;
  readOnly?: boolean;
  language: 'id' | 'en';
  // Props tambahan yang spesifik per-form (e.g. showCorporateSelector)
  // bisa ditambahkan via AdapterOptions di bawah.
  [key: string]: unknown;
}

// ── AdapterOptions — konfigurasi tambahan saat mendaftarkan form ──────────────

export interface AdapterOptions {
  /**
   * Props tambahan yang selalu diteruskan ke shared form saat dirender di approval.
   * Contoh: { showCorporateSelector: true, corporateSelectorDisabled: true }
   */
  extraProps?: Record<string, unknown>;
}

// ── createApprovalFormAdapter — HOC generic ───────────────────────────────────
//
// Mengkonversi ApprovalFormProps (dari ApprovalDetailModal) ke props shared form.
// Tidak perlu membuat file wrapper per-modul.
//
// Contoh penggunaan:
//   createApprovalFormAdapter(BalanceSheetForm, {
//     extraProps: { showCorporateSelector: true, corporateSelectorDisabled: true }
//   })

export function createApprovalFormAdapter<TPayload extends Record<string, unknown>>(
  FormComponent: React.ComponentType<SharedFormProps<TPayload>>,
  options: AdapterOptions = {},
): React.ComponentType<ApprovalFormProps> {
  const AdapterComponent: React.FC<ApprovalFormProps> = ({
    payload,
    onChange,
    readOnly,
    language,
  }) => {
    const handleChange = onChange
      ? (field: keyof TPayload, value: unknown) => onChange(field as string, value)
      : undefined;

    return (
      <FormComponent
        payload={payload as TPayload}
        onChange={handleChange}
        readOnly={readOnly}
        language={language}
        {...(options.extraProps ?? {})}
      />
    );
  };

  AdapterComponent.displayName = `ApprovalAdapter(${FormComponent.displayName ?? FormComponent.name})`;
  return AdapterComponent;
}

// ── FORM_REGISTRY ─────────────────────────────────────────────────────────────
//
// Daftarkan shared form di sini. Key harus sama dengan view_component di DB.
// Tidak perlu file wrapper terpisah — gunakan createApprovalFormAdapter().

export const FORM_REGISTRY: Record<string, React.ComponentType<ApprovalFormProps>> = {
  // Balance Sheet — di approval, corporate selector tampil tapi disabled
  BalanceSheetApprovalForm: createApprovalFormAdapter<BalanceSheetPayload>(
    BalanceSheetForm as React.ComponentType<SharedFormProps<BalanceSheetPayload>>,
    {
      extraProps: {
        showCorporateSelector: true,
        corporateSelectorDisabled: true,
      },
    },
  ),

  // Tambahkan modul baru di sini:
  // IncomeStatementApprovalForm: createApprovalFormAdapter(IncomeStatementForm, { ... }),
  // WeeklyCashFlowApprovalForm: createApprovalFormAdapter(WeeklyCashFlowForm, { ... }),
};
