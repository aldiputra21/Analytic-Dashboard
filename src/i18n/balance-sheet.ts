// i18n/balance-sheet.ts
import { Locale } from './commons';

export interface BalanceSheetCopy {
  title: string;
  subtitle: string;
  inputNew: string;
  searchPlaceholder: string;
  tableHead: {
    period: string;
    corporate: string;
    totalAssets: string;
    totalLiabilities: string;
    totalEquity: string;
    status: string;
    actions: string;
  };
  status: {
    balanced: string;
    unbalanced: string;
    empty: string;
    emptyDesc: string;
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
    month: string;
    year: string;
    totalLiab: string;
    totalLiabEquityCompact: string;
    noData: string;
    overwriteConfirm: string;
    overwrite: string;
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
    deleteTitle: string;
    deleteDesc: string;
    deleteConfirm: string;
    deleteDeleting: string;
  };
  validation: {
    corporateRequired: string;
    periodInvalid: string;
    amountMin: string;
    unbalancedError: string;
    nominalZero: string;
  };
}

export const balanceSheetI18n: Record<Locale, BalanceSheetCopy> = {
  id: {
    title: 'Manajemen Neraca',
    subtitle: 'Pantau dan kelola laporan neraca keuangan anak perusahaan.',
    inputNew: 'Input Neraca Baru',
    searchPlaceholder: 'Cari perusahaan...',
    tableHead: {
      period: 'Periode',
      corporate: 'Perusahaan',
      totalAssets: 'Total Aset',
      totalLiabilities: 'Total Liabilitas',
      totalEquity: 'Total Ekuitas',
      status: 'Status',
      actions: 'Aksi',
    },
    status: {
      balanced: 'Seimbang',
      unbalanced: 'Tidak Seimbang',
      empty: 'Data Kosong',
      emptyDesc: 'Coba sesuaikan filter atau tambahkan data baru.',
    },
    modal: {
      createTitle: 'Input Neraca',
      editTitle: 'Perbarui Neraca',
      viewTitle: 'Detail Neraca',
      corporate: 'Perusahaan',
      period: 'Periode',
      diff: 'Selisih',
      activa: 'Aset Lancar',
      fixedAsset: 'Aset Tetap Bersih',
      liabilities: 'Kewajiban',
      shortTermLiabilities: 'Hutang Lancar',
      longTermLiabilities: 'Hutang Jangka Panjang',
      equity: 'Modal',
      totalAssets: 'Total Aset',
      totalLiabEquity: 'Total Hutang + Modal',
      totalActiva: 'Total Aset Lancar',
      totalFixedAsset: 'Total Aset Tetap Bersih',
      totalShortTermLiabilities: 'Total Hutang Lancar',
      totalLongTermLiabilities: 'Total Hutang Jangka Panjang',
      totalEquity: 'Total Modal',
      notes: 'Catatan tambahan',
      notesPlaceholder: 'Tambahkan catatan jika diperlukan...',
      selectCorporate: 'Pilih Perusahaan',
      month: 'Bulan',
      year: 'Tahun',
      totalLiab: 'TOTAL KEWAJIBAN',
      totalLiabEquityCompact: 'Kwjbn + Ekuitas',
      noData: 'Belum ada data',
      overwriteConfirm: 'Data untuk periode ini sudah ada. Ingin menimpa?',
      overwrite: 'Timpa Data',
    },
    fields: {
      cashAndBank: 'Kas & Bank',
      accountsReceivable: 'Piutang',
      workInProgress: 'WIP',
      inventory: 'Persediaan',
      prepaidExpenses: 'Biaya Dibayar Dimuka',
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
      capital: 'Modal',
      earningsAfterTax: 'Laba Thn. Berjalan (EAT)',
      retainedEarnings: 'Laba Ditahan',
      dividends: 'Dividen',
    },
    alerts: {
      deleteTitle: 'Hapus laporan neraca?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data neraca untuk periode ini akan dihapus permanen dari sistem.',
      deleteConfirm: 'Ya, Hapus Neraca',
      deleteDeleting: 'Menghapus...',
    },
    validation: {
      corporateRequired: 'Perusahaan wajib dipilih',
      periodInvalid: 'Periode tidak valid',
      amountMin: 'Nilai tidak boleh negatif',
      unbalancedError: 'Neraca tidak seimbang! Selisih harus nol.',
      nominalZero: 'Data nominal tidak boleh kosong atau nol',
    },
  },
  en: {
    title: 'Balance Sheet Management',
    subtitle: 'Monitor and manage subsidiary balance sheet reports.',
    inputNew: 'Input New Balance Sheet',
    searchPlaceholder: 'Search corporate...',
    tableHead: {
      period: 'Period',
      corporate: 'Corporate',
      totalAssets: 'Total Assets',
      totalLiabilities: 'Total Liabilities',
      totalEquity: 'Total Equity',
      status: 'Status',
      actions: 'Actions',
    },
    status: {
      balanced: 'Balanced',
      unbalanced: 'Unbalanced',
      empty: 'No Data',
      emptyDesc: 'Try adjusting filters or add new data.',
    },
    modal: {
      createTitle: 'Input Balance Sheet',
      editTitle: 'Update Report',
      viewTitle: 'Balance Sheet Details',
      corporate: 'Corporate',
      period: 'Period',
      diff: 'Diff',
      activa: 'Current Assets (Activa)',
      fixedAsset: 'Net Fixed Assets',
      liabilities: 'Liabilities',
      shortTermLiabilities: 'Current Liabilities',
      longTermLiabilities: 'Long Term Liabilities',
      equity: 'Equity',
      totalAssets: 'Total Assets',
      totalLiabEquity: 'Total Liabilities + Equity',
      totalActiva: 'Total Current Assets',
      totalFixedAsset: 'Total Net Fixed Assets',
      totalShortTermLiabilities: 'Total Current Liabilities',
      totalLongTermLiabilities: 'Total Long Term Liabilities',
      totalEquity: 'Total Equity',
      notes: 'Additional Notes',
      notesPlaceholder: 'Add notes if needed...',
      selectCorporate: 'Select Corporate',
      month: 'Month',
      year: 'Year',
      totalLiab: 'TOTAL LIABILITIES',
      totalLiabEquityCompact: 'Liab + Equity',
      noData: 'No data yet',
      overwriteConfirm: 'Data for this period already exists. Overwrite?',
      overwrite: 'Overwrite Data',
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
      capital: 'Equity',
      earningsAfterTax: 'Earnings After Tax (EAT)',
      retainedEarnings: 'Retained Earnings',
      dividends: 'Dividends',
    },
    alerts: {
      deleteTitle: 'Delete balance sheet report?',
      deleteDesc: 'This action cannot be undone. Balance sheet data for this period will be permanently deleted from the system.',
      deleteConfirm: 'Yes, Delete Balance Sheet',
      deleteDeleting: 'Deleting...',
    },
    validation: {
      corporateRequired: 'Corporate is required',
      periodInvalid: 'Invalid period',
      amountMin: 'Value cannot be negative',
      unbalancedError: 'Balance sheet is not balanced! Difference must be zero.',
      nominalZero: 'Financial data cannot be empty or zero',
    },
  },
};
