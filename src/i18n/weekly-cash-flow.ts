// i18n/weekly-cash-flow.ts
import { Locale } from './commons';

export interface WeeklyCashFlowCopy {
  title: string;
  subtitle: string;
  inputNew: string;
  searchPlaceholder: string;
  tableHead: {
    period: string;
    week: string;
    corporateProject: string;
    cashIn: string;
    cashOut: string;
    netFlow: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    period: string;
    week: string;
    entityType: string;
    projectRelated: string;
    selectEntity: string;
    corporate: string;
    project: string;
    yes: string;
    no: string;
    projectSelectionDisabled: string;
    operatingActivity: string;
    investing: string;
    financing: string;
    netCashFlow: string;
    notes: string;
    notesPlaceholder: string;
    month: string;
    year: string;
    code: string;
    selectCorporate: string;
  };
  fields: {
    cashIn: string;
    cashOut: string;
    in: string;
    out: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    deleteConfirm: string;
    deleteDeleting: string;
  };
  validation: {
  nominalZero: string;
    corporateRequired: string;
    entityRequired: string;
    periodInvalid: string;
    weekRequired: string;
    amountMin: string;
  };
}

export const weeklyCashFlowI18n: Record<Locale, WeeklyCashFlowCopy> = {
  id: {
    title: 'Pengelolaan Arus Kas',
    subtitle: 'Monitoring likuiditas mingguan per perusahaan atau proyek.',
    inputNew: 'Tambah Arus Kas',
    searchPlaceholder: 'Cari proyek...',
    tableHead: {
      period: 'Periode',
      week: 'Minggu',
      corporateProject: 'Perusahaan / Proyek',
      cashIn: 'Kas Masuk',
      cashOut: 'Kas Keluar',
      netFlow: 'Kas Bersih',
    },
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Coba sesuaikan filter atau tambahkan data baru.',
    },
    modal: {
      createTitle: 'Input Arus Kas',
      editTitle: 'Perbarui Data',
      viewTitle: 'Detail Arus Kas',
      period: 'Periode',
      week: 'Minggu',
      entityType: 'Tipe Entitas',
      projectRelated: 'Terkait Proyek?',
      selectEntity: 'Pilih',
      corporate: 'Perusahaan',
      project: 'Proyek',
      yes: 'Ya',
      no: 'Tidak',
      projectSelectionDisabled: 'Pilihan proyek dinonaktifkan',
      operatingActivity: 'Aktivitas Operasional',
      investing: 'Investasi',
      financing: 'Pendanaan',
      netCashFlow: 'Arus Kas Bersih (Mingguan)',
      notes: 'Catatan tambahan',
      notesPlaceholder: 'Tambahkan catatan jika diperlukan...',
      month: 'Bulan',
      year: 'Tahun',
      code: 'Kode',
      selectCorporate: 'Pilih Perusahaan',
    },
    fields: {
      cashIn: 'Kas Masuk',
      cashOut: 'Kas Keluar',
      in: 'Masuk',
      out: 'Keluar',
    },
    alerts: {
      deleteTitle: 'Hapus data arus kas?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data arus kas untuk periode ini akan dihapus permanen dari sistem.',
      deleteConfirm: 'Ya, Hapus Arus Kas',
      deleteDeleting: 'Menghapus...',
    },
    validation: {
      nominalZero: 'Total nominal tidak boleh nol',
      corporateRequired: 'Perusahaan wajib dipilih',
      entityRequired: 'Entitas (Proyek/Perusahaan) wajib dipilih',
      periodInvalid: 'Periode tidak valid',
      weekRequired: 'Minggu wajib dipilih',
      amountMin: 'Nilai tidak boleh negatif',
    },
  },
  en: {
    title: 'Cash Flow Management',
    subtitle: 'Weekly liquidity monitoring per corporate or project.',
    inputNew: 'Add Cash Flow',
    searchPlaceholder: 'Search project...',
    tableHead: {
      period: 'Period',
      week: 'Week',
      corporateProject: 'Corporate / Project',
      cashIn: 'Cash In',
      cashOut: 'Cash Out',
      netFlow: 'Net Flow',
    },
    status: {
      empty: 'No Data',
      emptyDesc: 'Try adjusting filters or add new data.',
    },
    modal: {
      createTitle: 'Input Cash Flow',
      editTitle: 'Update Data',
      viewTitle: 'Cash Flow Details',
      period: 'Period',
      week: 'Week',
      entityType: 'Entity Type',
      projectRelated: 'Project Related?',
      selectEntity: 'Select',
      corporate: 'Corporate',
      project: 'Project',
      yes: 'Yes',
      no: 'No',
      projectSelectionDisabled: 'Project selection disabled',
      operatingActivity: 'Operating Activity',
      investing: 'Investing',
      financing: 'Financing',
      netCashFlow: 'Net Cash Flow (Weekly)',
      notes: 'Additional Notes',
      notesPlaceholder: 'Add notes if needed...',
      month: 'Month',
      year: 'Year',
      code: 'Code',
      selectCorporate: 'Select Corporate',
    },
    fields: {
      cashIn: 'Cash In',
      cashOut: 'Cash Out',
      in: 'In',
      out: 'Out',
    },
    alerts: {
      deleteTitle: 'Delete cash flow data?',
      deleteDesc: 'This action cannot be undone. Cash flow data for this period will be permanently deleted from the system.',
      deleteConfirm: 'Yes, Delete Cash Flow',
      deleteDeleting: 'Deleting...',
    },
    validation: {
      nominalZero: 'Total amount cannot be zero',
      corporateRequired: 'Corporate is required',
      entityRequired: 'Entity (Project/Corporate) is required',
      periodInvalid: 'Invalid period',
      weekRequired: 'Week is required',
      amountMin: 'Value cannot be negative',
    },
  },
};
