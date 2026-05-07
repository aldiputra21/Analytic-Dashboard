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
import { IncomeStatementForm } from '../shared/forms/IncomeStatementForm';
import type { IncomeStatementPayload } from '../shared/forms/IncomeStatementForm';
import { IncomeStatementProjectionForm } from '../shared/forms/IncomeStatementProjectionForm';
import type { IncomeStatementProjectionPayload } from '../shared/forms/IncomeStatementProjectionForm';
import { WeeklyCashFlowForm } from '../shared/forms/WeeklyCashFlowForm';
import type { WeeklyCashFlowPayload } from '../shared/forms/WeeklyCashFlowForm';
import { RealizationForm } from '../shared/forms/RealizationForm';
import type { RealizationPayload } from '../shared/forms/RealizationForm';
import { CashFlowProjectionForm } from '../shared/forms/CashFlowProjectionForm';
import type { CashFlowProjectionPayload } from '../shared/forms/CashFlowProjectionForm';
import { BankLoanForm } from '../shared/forms/BankLoanForm';
import type { BankLoanPayload } from '../shared/forms/BankLoanForm';
import { CorporateForm } from '../shared/forms/CorporateForm';
import type { CorporatePayload } from '../shared/forms/CorporateForm';
import { DepartmentForm } from '../shared/forms/DepartmentForm';
import type { DepartmentPayload } from '../shared/forms/DepartmentForm';
import { CostCenterForm } from '../shared/forms/CostCenterForm';
import type { CostCenterPayload } from '../shared/forms/CostCenterForm';
import { ProjectForm } from '../shared/forms/ProjectForm';
import type { ProjectPayload } from '../shared/forms/ProjectForm';

// ── Upload Approval Forms ──────────────────────────────────────────────────────
import {
  BalanceSheetUploadApprovalForm,
  IncomeStatementUploadApprovalForm,
  IncomeStatementProjectionUploadApprovalForm,
  WeeklyCashFlowUploadApprovalForm,
  RealizationUploadApprovalForm,
  CashFlowProjectionUploadApprovalForm,
  BankLoanUploadApprovalForm,
  CorporateUploadApprovalForm,
  DepartmentUploadApprovalForm,
  CostCenterUploadApprovalForm,
  ProjectUploadApprovalForm,
} from './UploadApprovalForms';

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

  // ── Modul Finansial ──────────────────────────────────────────────────────────

  // Laba Rugi — corporate selector tampil tapi disabled di approval context
  IncomeStatementApprovalForm: createApprovalFormAdapter<IncomeStatementPayload>(
    IncomeStatementForm as React.ComponentType<SharedFormProps<IncomeStatementPayload>>,
    {
      extraProps: {
        showCorporateSelector: true,
        corporateSelectorDisabled: true,
      },
    },
  ),

  // Proyeksi Laba Rugi — tidak ada corporate selector (berbasis departemen)
  IncomeStatementProjectionApprovalForm: createApprovalFormAdapter<IncomeStatementProjectionPayload>(
    IncomeStatementProjectionForm as React.ComponentType<SharedFormProps<IncomeStatementProjectionPayload>>,
  ),

  // Arus Kas Mingguan — corporate selector tampil tapi disabled di approval context
  WeeklyCashFlowApprovalForm: createApprovalFormAdapter<WeeklyCashFlowPayload>(
    WeeklyCashFlowForm as React.ComponentType<SharedFormProps<WeeklyCashFlowPayload>>,
    {
      extraProps: {
        showCorporateSelector: true,
        corporateSelectorDisabled: true,
      },
    },
  ),

  // Realisasi — tidak ada corporate selector (read-only entity fields)
  RealizationApprovalForm: createApprovalFormAdapter<RealizationPayload>(
    RealizationForm as React.ComponentType<SharedFormProps<RealizationPayload>>,
  ),

  // Proyeksi Arus Kas — corporate selector tampil tapi disabled di approval context
  CashFlowProjectionApprovalForm: createApprovalFormAdapter<CashFlowProjectionPayload>(
    CashFlowProjectionForm as React.ComponentType<SharedFormProps<CashFlowProjectionPayload>>,
    {
      extraProps: {
        showCorporateSelector: true,
        corporateSelectorDisabled: true,
      },
    },
  ),

  // Pinjaman Bank — corporate selector tampil tapi disabled di approval context
  BankLoanApprovalForm: createApprovalFormAdapter<BankLoanPayload>(
    BankLoanForm as React.ComponentType<SharedFormProps<BankLoanPayload>>,
    {
      extraProps: {
        showCorporateSelector: true,
        corporateSelectorDisabled: true,
      },
    },
  ),

  // ── Modul Master Data ────────────────────────────────────────────────────────

  // Perusahaan — tidak ada corporate selector (form IS the corporate entity)
  CorporateApprovalForm: createApprovalFormAdapter<CorporatePayload>(
    CorporateForm as React.ComponentType<SharedFormProps<CorporatePayload>>,
  ),

  // Departemen — corporate selector tampil tapi disabled di approval context
  DepartmentApprovalForm: createApprovalFormAdapter<DepartmentPayload>(
    DepartmentForm as React.ComponentType<SharedFormProps<DepartmentPayload>>,
    {
      extraProps: {
        showCorporateSelector: true,
        corporateSelectorDisabled: true,
      },
    },
  ),

  // Cost Center — corporate selector tampil tapi disabled di approval context
  CostCenterApprovalForm: createApprovalFormAdapter<CostCenterPayload>(
    CostCenterForm as React.ComponentType<SharedFormProps<CostCenterPayload>>,
    {
      extraProps: {
        showCorporateSelector: true,
        corporateSelectorDisabled: true,
      },
    },
  ),

  // Proyek — corporate selector tampil tapi disabled di approval context
  ProjectApprovalForm: createApprovalFormAdapter<ProjectPayload>(
    ProjectForm as React.ComponentType<SharedFormProps<ProjectPayload>>,
    {
      extraProps: {
        showCorporateSelector: true,
        corporateSelectorDisabled: true,
      },
    },
  ),

  // ── Upload Approval Forms ────────────────────────────────────────────────────

  // Balance Sheet Upload
  BalanceSheetUploadApprovalForm,

  // Income Statement Upload
  IncomeStatementUploadApprovalForm,

  // Income Statement Projection Upload
  IncomeStatementProjectionUploadApprovalForm,

  // Weekly Cash Flow Upload
  WeeklyCashFlowUploadApprovalForm,

  // Realization Upload
  RealizationUploadApprovalForm,

  // Cash Flow Projection Upload
  CashFlowProjectionUploadApprovalForm,

  // Bank Loan Upload
  BankLoanUploadApprovalForm,

  // Corporate Upload
  CorporateUploadApprovalForm,

  // Department Upload
  DepartmentUploadApprovalForm,

  // Cost Center Upload
  CostCenterUploadApprovalForm,

  // Project Upload
  ProjectUploadApprovalForm,
};
