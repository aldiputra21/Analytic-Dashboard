// i18n/cash-flow.ts
import { Locale } from './commons';

export interface CashFlowCopy {
  title: string;
  form: {
    period: string;
    department: string;
    project: string;
    optional: string;
    operatingActivities: string;
    investingActivities: string;
    financingActivities: string;
    cashInFromOps: string;
    cashOutFromOps: string;
    cashInFromInv: string;
    cashOutFromInv: string;
    cashInFromFin: string;
    cashOutFromFin: string;
    saveBtn: string;
    overwriteTitle: string;
    overwriteDesc: string;
    overwriteBtn: string;
  };
  validation: {
    periodRequired: string;
    fieldRequired: string;
    invalidNumber: string;
    nonNegative: string;
  };
  alerts: {
    saveSuccess: string;
    saveError: string;
    networkError: string;
  };
}

export const cashFlowI18n: Record<Locale, CashFlowCopy> = {
  id: {
    title: 'Laporan Arus Kas',
    form: {
      period: 'Periode',
      department: 'Departemen',
      project: 'Proyek',
      optional: 'opsional',
      operatingActivities: 'Aktivitas Operasi',
      investingActivities: 'Aktivitas Investasi',
      financingActivities: 'Aktivitas Pendanaan',
      cashInFromOps: 'Cash In dari Operasi',
      cashOutFromOps: 'Cash Out dari Operasi',
      cashInFromInv: 'Cash In dari Investasi',
      cashOutFromInv: 'Cash Out dari Investasi',
      cashInFromFin: 'Cash In dari Pendanaan',
      cashOutFromFin: 'Cash Out dari Pendanaan',
      saveBtn: 'Simpan Arus Kas',
      overwriteTitle: 'Data Sudah Ada',
      overwriteDesc: 'Arus Kas untuk kombinasi periode dan entitas ini sudah ada. Apakah Anda ingin menimpa data yang ada?',
      overwriteBtn: 'Timpa Data',
    },
    validation: {
      periodRequired: 'Periode wajib diisi',
      fieldRequired: '{field} wajib diisi',
      invalidNumber: 'Harus berupa angka valid',
      nonNegative: 'Nilai tidak boleh negatif',
    },
    alerts: {
      saveSuccess: 'Arus Kas periode {period} berhasil disimpan',
      saveError: 'Gagal menyimpan arus kas',
      networkError: 'Terjadi kesalahan jaringan',
    },
  },
  en: {
    title: 'Cash Flow Statement',
    form: {
      period: 'Period',
      department: 'Department',
      project: 'Project',
      optional: 'optional',
      operatingActivities: 'Operating Activities',
      investingActivities: 'Investing Activities',
      financingActivities: 'Financing Activities',
      cashInFromOps: 'Cash In from Operations',
      cashOutFromOps: 'Cash Out from Operations',
      cashInFromInv: 'Cash In from Investment',
      cashOutFromInv: 'Cash Out from Investment',
      cashInFromFin: 'Cash In from Financing',
      cashOutFromFin: 'Cash Out from Financing',
      saveBtn: 'Save Cash Flow',
      overwriteTitle: 'Data Already Exists',
      overwriteDesc: 'Cash Flow for this combination of period and entity already exists. Do you want to overwrite the existing data?',
      overwriteBtn: 'Overwrite Data',
    },
    validation: {
      periodRequired: 'Period is required',
      fieldRequired: '{field} is required',
      invalidNumber: 'Must be a valid number',
      nonNegative: 'Value cannot be negative',
    },
    alerts: {
      saveSuccess: 'Cash Flow for period {period} saved',
      saveError: 'Failed to save cash flow',
      networkError: 'Network error',
    },
  },
};
