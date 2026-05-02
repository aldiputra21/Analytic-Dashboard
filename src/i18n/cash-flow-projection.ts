import { Locale } from './commons';

export interface CashFlowProjectionCopy {
  title: string;
  manageTitle: string;
  addProjection: string;
  editProjection: string;
  initialBalance: string;
  fiscalYear: string;
  month: string;
  group: string;
  type: string;
  category: string;
  amount: string;
  notes: string;
  inflow: string;
  outflow: string;
  operating: string;
  investing: string;
  financing: string;
  netCashFlow: string;
  endingBalance: string;
  summary: string;
  projections: string;
  realizations: string;
  difference: string;
  totalInflow: string;
  totalOutflow: string;
  closingBalance: string;
  validation: {
    duplicateYear: string;
    missingInflow: string;
    missingOutflow: string;
  };
}

export const cashFlowProjectionI18n: Record<Locale, CashFlowProjectionCopy> = {
  id: {
    title: 'Proyeksi Arus Kas',
    manageTitle: 'Manajemen Proyeksi Arus Kas',
    addProjection: 'Tambah Proyeksi',
    editProjection: 'Ubah Proyeksi',
    initialBalance: 'Saldo Awal Tahun',
    fiscalYear: 'Tahun Fiskal',
    month: 'Bulan',
    group: 'Grup',
    type: 'Tipe',
    category: 'Kategori',
    amount: 'Nominal',
    notes: 'Catatan',
    inflow: 'Uang Masuk',
    outflow: 'Uang Keluar',
    operating: 'Operasional',
    investing: 'Investasi',
    financing: 'Pendanaan',
    netCashFlow: 'Arus Kas Bersih',
    endingBalance: 'Saldo Akhir',
    summary: 'Ringkasan',
    projections: 'Proyeksi',
    realizations: 'Realisasi',
    difference: 'Selisih',
    totalInflow: 'Total Uang Masuk',
    totalOutflow: 'Total Uang Keluar',
    closingBalance: 'Saldo Kas Akhir',
    validation: {
      duplicateYear: 'Proyeksi untuk tahun ini sudah ada',
      missingInflow: 'Mohon isi setidaknya satu uang masuk',
      missingOutflow: 'Mohon isi setidaknya satu uang keluar',
    },
  },
  en: {
    title: 'Cash Flow Projection',
    manageTitle: 'Cash Flow Projection Management',
    addProjection: 'Add Projection',
    editProjection: 'Edit Projection',
    initialBalance: 'Opening Balance (Year Start)',
    fiscalYear: 'Fiscal Year',
    month: 'Month',
    group: 'Group',
    type: 'Type',
    category: 'Category',
    amount: 'Amount',
    notes: 'Notes',
    inflow: 'Cash Inflow',
    outflow: 'Cash Outflow',
    operating: 'Operating',
    investing: 'Investing',
    financing: 'Financing',
    netCashFlow: 'Net Cash Flow',
    endingBalance: 'Ending Balance',
    summary: 'Summary',
    projections: 'Projections',
    realizations: 'Realizations',
    difference: 'Difference',
    totalInflow: 'Total Inflow',
    totalOutflow: 'Total Outflow',
    closingBalance: 'Closing Cash Balance',
    validation: {
      duplicateYear: 'Projection for this year already exists',
      missingInflow: 'Please fill at least one cash inflow',
      missingOutflow: 'Please fill at least one cash outflow',
    },
  },
};
