// i18n/balance-sheet.ts
import { Locale } from './commons';

export interface BalanceSheetCopy {
  title: string;
  subtitle: string;
  inputNew: string;
  searchPlaceholder: string;
  pagination: {
    showing: string;
    of: string;
    entries: string;
    rowsPerPage: string;
  };
  actions: {
    view: string;
    edit: string;
    delete: string;
  };
  tableHead: {
    period: string;
    corporate: string;
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
    status: string;
    actions: string;
  };
  apply: string;
  clear: string;
  status: {
    balanced: string;
    unbalanced: string;
    empty: string;
    emptyDesc: string;
    loading: string;
    submitting: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    corporate: string;
    period: string;
    diff: string;
    activa: string;
    fixedAsset: string;
    liabilities: string;
    shortTermLiabilities: string;
    longTermLiabilities: string;
    equity: string;
    totalAssets: string;
    totalLiabEquity: string;
    totalActiva: string;
    totalFixedAsset: string;
    totalShortTermLiabilities: string;
    totalLongTermLiabilities: string;
    totalEquity: string;
    notes: string;
    notesPlaceholder: string;
    selectCorporate: string;
    cancel: string;
    submit: string;
    month: string;
    year: string;
    totalLiab: string;
    totalLiabEquityCompact: string;
    overwriteConfirm: string;
    overwrite: string;
    saveBtn: string;
    noData: string;
  };
  fields: {
    cashAndBank: string;
    accountsReceivable: string;
    workInProgress: string;
    inventory: string;
    prepaidExpenses: string;
    land: string;
    building: string;
    equipment: string;
    otherFixedAssets: string;
    accountsPayable: string;
    bankLoanCurrent: string;
    otherCurrentLiabilities: string;
    bankLoanLongTerm: string;
    otherLongTermLiabilities: string;
    shareholderLoan: string;
    capital: string;
    earningsAfterTax: string;
    retainedEarnings: string;
    dividends: string;
  };
  alerts: {
    errorRequired: string;
    success: string;
    error: string;
    warning: string;
    deleteTitle: string;
    deleteDesc: string;
    deleteConfirm: string;
    deleteCancel: string;
    deleteDeleting: string;
    successDelete: string;
    errorDelete: string;
    successSave: string;
    successUpdate: string;
    errorSave: string;
    errorFetch: string;
    errorNetwork: string;
  };
  validation: {
    corporateRequired: string;
    periodInvalid: string;
    amountMin: string;
    unbalancedError: string;
  };
}

export const balanceSheetI18n: Record<Locale, BalanceSheetCopy> = {
  id: {
    title: 'Manajemen Neraca',
    subtitle: 'Pantau dan kelola laporan neraca keuangan anak perusahaan.',
    inputNew: 'Input Neraca Baru',
    searchPlaceholder: 'Cari perusahaan...',
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman'
    },
    actions: {
      view: 'Detail',
      edit: 'Edit',
      delete: 'Hapus'
    },
    tableHead: {
      period: 'Periode',
      corporate: 'Perusahaan',
      totalAssets: 'Total Aset',
      totalLiabilities: 'Total Liabilitas',
      totalEquity: 'Total Ekuitas',
      status: 'Status',
      actions: 'Aksi',
    },
    apply: 'Terapkan',
    clear: 'Bersihkan',
    status: {
      balanced: 'Seimbang',
      unbalanced: 'Tidak Seimbang',
      empty: 'Data Kosong',
      emptyDesc: 'Coba sesuaikan filter atau tambahkan data baru.',
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
    },
    modal: {
      createTitle: 'Input Neraca',
      editTitle: 'Perbarui Neraca',
      viewTitle: 'Detail Neraca',
      corporate: 'Perusahaan',
      period: 'Periode',
      diff: 'Selisih',
      activa: 'Aset Lancar (Activa)',
      fixedAsset: 'Aset Tetap (Fixed Asset)',
      liabilities: 'Kewajiban (Liabilities)',
      shortTermLiabilities: 'Hutang Lancar',
      longTermLiabilities: 'Hutang Jangka Panjang',
      equity: 'Modal / Ekuitas',
      totalAssets: 'Total Aset',
      totalLiabEquity: 'Total Hutang + Modal / Ekuitas',
      totalActiva: 'Total Aset Lancar',
      totalFixedAsset: 'Total Aset Tetap',
      totalShortTermLiabilities: 'Total Hutang Lancar',
      totalLongTermLiabilities: 'Total Hutang Jangka Panjang',
      totalEquity: 'Total Modal / Ekuitas',
      notes: 'Catatan tambahan',
      notesPlaceholder: 'Tambahkan catatan jika diperlukan...',
      selectCorporate: 'Pilih Perusahaan',
      cancel: 'Batal',
      submit: 'Simpan',
      month: 'Bulan',
      year: 'Tahun',
      totalLiab: 'TOTAL KEWAJIBAN',
      totalLiabEquityCompact: 'Kwjbn + Ekuitas',
      overwriteConfirm: 'Timpa data periode {period}?',
      overwrite: 'Timpa',
      saveBtn: 'Simpan Neraca',
      noData: 'Belum ada data',
    },
    fields: {
      cashAndBank: 'Kas & Bank',
      accountsReceivable: 'Piutang (AR)',
      workInProgress: 'WIP',
      inventory: 'Persediaan (Inventory)',
      prepaidExpenses: 'Biaya Dibayar Dimuka (Prepaid)',
      land: 'Tanah',
      building: 'Bangunan',
      equipment: 'Peralatan',
      otherFixedAssets: 'Aset Tetap Lainnya',
      accountsPayable: 'Hutang Usaha',
      bankLoanCurrent: 'Hutang Bank Jangka Pendek',
      otherCurrentLiabilities: 'Hutang Lancar Lainnya',
      bankLoanLongTerm: 'Hutang Bank Jangka Panjang',
      otherLongTermLiabilities: 'Hutang Jangka Panjang Lainnya',
      shareholderLoan: 'Hutang Pemegang Saham',
      capital: 'Modal / Equity',
      earningsAfterTax: 'Laba Thn. Berjalan (EAT)',
      retainedEarnings: 'Laba Ditahan',
      dividends: 'Dividen',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      success: 'Berhasil',
      error: 'Error',
      warning: 'Peringatan',
      deleteTitle: 'Hapus laporan neraca?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data neraca untuk periode ini akan dihapus permanen dari sistem.',
      deleteConfirm: 'Ya, Hapus Neraca',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successDelete: 'Data neraca berhasil dihapus',
      errorDelete: 'Gagal menghapus data neraca',
      successSave: 'Laporan neraca berhasil disimpan',
      successUpdate: 'Laporan neraca diperbarui',
      errorSave: 'Gagal menyimpan laporan',
      errorFetch: 'Gagal memuat data neraca',
      errorNetwork: 'Terjadi kesalahan jaringan',
    },
    validation: {
      corporateRequired: 'Perusahaan wajib dipilih',
      periodInvalid: 'Periode tidak valid',
      amountMin: 'Nilai tidak boleh negatif',
      unbalancedError: 'Neraca tidak seimbang! Selisih harus nol.',
    },
  },
  en: {
    title: 'Balance Sheet Management',
    subtitle: 'Monitor and manage subsidiary balance sheet reports.',
    inputNew: 'Input New Balance Sheet',
    searchPlaceholder: 'Search corporate...',
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page'
    },
    actions: {
      view: 'Details',
      edit: 'Edit',
      delete: 'Delete'
    },
    tableHead: {
      period: 'Period',
      corporate: 'Corporate',
      totalAssets: 'Total Assets',
      totalLiabilities: 'Total Liabilities',
      totalEquity: 'Total Equity',
      status: 'Status',
      actions: 'Actions',
    },
    apply: 'Apply',
    clear: 'Clear',
    status: {
      balanced: 'Balanced',
      unbalanced: 'Unbalanced',
      empty: 'No Data',
      emptyDesc: 'Try adjusting filters or add new data.',
      loading: 'Loading Data...',
      submitting: 'Saving...',
    },
    modal: {
      createTitle: 'Input Balance Sheet',
      editTitle: 'Update Report',
      viewTitle: 'Balance Sheet Details',
      corporate: 'Corporate',
      period: 'Period',
      diff: 'Diff',
      activa: 'Current Assets (Activa)',
      fixedAsset: 'Fixed Assets',
      liabilities: 'Liabilities',
      shortTermLiabilities: 'Current Liabilities',
      longTermLiabilities: 'Long Term Liabilities',
      equity: 'Capital / Equity',
      totalAssets: 'Total Assets',
      totalLiabEquity: 'Total Liabilities + Equity',
      totalActiva: 'Total Current Assets',
      totalFixedAsset: 'Total Fixed Assets',
      totalShortTermLiabilities: 'Total Current Liabilities',
      totalLongTermLiabilities: 'Total Long Term Liabilities',
      totalEquity: 'Total Capital / Equity',
      notes: 'Additional Notes',
      notesPlaceholder: 'Add notes if needed...',
      selectCorporate: 'Select Corporate',
      cancel: 'Cancel',
      submit: 'Save',
      month: 'Month',
      year: 'Year',
      totalLiab: 'TOTAL LIABILITIES',
      totalLiabEquityCompact: 'Liab + Equity',
      overwriteConfirm: 'Overwrite data for period {period}?',
      overwrite: 'Overwrite',
      saveBtn: 'Save Balance Sheet',
      noData: 'No data yet',
    },
    fields: {
      cashAndBank: 'Cash & Bank',
      accountsReceivable: 'Accounts Receivable (AR)',
      workInProgress: 'WIP',
      inventory: 'Inventory',
      prepaidExpenses: 'Prepaid Expenses',
      land: 'Land',
      building: 'Building',
      equipment: 'Equipment',
      otherFixedAssets: 'Other Fixed Assets',
      accountsPayable: 'Accounts Payable',
      bankLoanCurrent: 'Current Bank Loan',
      otherCurrentLiabilities: 'Other Current Liabilities',
      bankLoanLongTerm: 'Long Term Bank Loan',
      otherLongTermLiabilities: 'Other Long Term Liabilities',
      shareholderLoan: 'Shareholder Loan',
      capital: 'Capital / Equity',
      earningsAfterTax: 'Earnings After Tax (EAT)',
      retainedEarnings: 'Retained Earnings',
      dividends: 'Dividends',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      deleteTitle: 'Delete balance sheet report?',
      deleteDesc: 'This action cannot be undone. Balance sheet data for this period will be permanently deleted from the system.',
      deleteConfirm: 'Yes, Delete Balance Sheet',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successDelete: 'Balance sheet data deleted successfully',
      errorDelete: 'Failed to delete balance sheet data',
      successSave: 'Balance sheet report saved successfully',
      successUpdate: 'Balance sheet report updated',
      errorSave: 'Failed to save report',
      errorFetch: 'Failed to load balance sheet data',
      errorNetwork: 'Network error',
    },
    validation: {
      corporateRequired: 'Corporate is required',
      periodInvalid: 'Invalid period',
      amountMin: 'Value cannot be negative',
      unbalancedError: 'Balance sheet is not balanced! Difference must be zero.',
    },
  },
};
