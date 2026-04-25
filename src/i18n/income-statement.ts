// i18n/income-statement.ts
export type Locale = 'id' | 'en';

export interface IncomeStatementCopy {
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
    revenue: string;
    cogs: string;
    netProfit: string;
    margin: string;
    actions: string;
  };
  apply: string;
  clear: string;
  status: {
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
    revenueAndCogs: string;
    expensesAndProfit: string;
    grossProfit: string;
    ebit: string;
    ebt: string;
    netProfit: string;
    netMargin: string;
    notes: string;
    notesPlaceholder: string;
    selectCorporate: string;
    cancel: string;
    submit: string;
    month: string;
    year: string;
  };
  fields: {
    revenue: string;
    cogs: string;
    operatingExpenses: string;
    interest: string;
    tax: string;
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
  };
}

export const incomeStatementI18n: Record<Locale, IncomeStatementCopy> = {
  id: {
    title: 'Manajemen Laba Rugi',
    subtitle: 'Lacak pendapatan, pengeluaran, dan profitabilitas operasional.',
    inputNew: 'Input Laba Rugi Baru',
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
      revenue: 'Pendapatan',
      cogs: 'HPP',
      netProfit: 'Laba Bersih',
      margin: 'NPM',
      actions: 'Aksi',
    },
    apply: 'Terapkan',
    clear: 'Bersihkan',
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Coba sesuaikan filter atau tambahkan data baru.',
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
    },
    modal: {
      createTitle: 'Input Laba Rugi',
      editTitle: 'Perbarui Laporan',
      viewTitle: 'Detail Laba Rugi',
      corporate: 'Perusahaan',
      period: 'Periode',
      revenueAndCogs: 'Pendapatan & HPP',
      expensesAndProfit: 'Biaya & Profit',
      grossProfit: 'LABA KOTOR (GROSS PROFIT)',
      ebit: 'EBIT (OPERATING PROFIT)',
      ebt: 'EBT (EARNINGS BEFORE TAX)',
      netProfit: 'LABA BERSIH (NET PROFIT / EAT)',
      netMargin: 'MARGIN BERSIH (NET MARGIN)',
      notes: 'Catatan tambahan',
      notesPlaceholder: 'Tambahkan catatan jika diperlukan...',
      selectCorporate: 'Pilih Perusahaan',
      cancel: 'Batal',
      submit: 'Simpan',
      month: 'Bulan',
      year: 'Tahun',
    },
    fields: {
      revenue: 'Pendapatan (Revenue)',
      cogs: 'HPP (COGS)',
      operatingExpenses: 'Biaya Operasional',
      interest: 'Bunga',
      tax: 'Pajak',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      success: 'Berhasil',
      error: 'Error',
      warning: 'Peringatan',
      deleteTitle: 'Hapus laporan laba rugi?',
      deleteDesc: 'Tindakan ini permanen. Data laba rugi untuk periode ini akan dihapus dari sistem.',
      deleteConfirm: 'Ya, Hapus Laba Rugi',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successDelete: 'Data laba rugi berhasil dihapus',
      errorDelete: 'Gagal menghapus data',
      successSave: 'Laporan laba rugi berhasil disimpan',
      successUpdate: 'Laporan laba rugi diperbarui',
      errorSave: 'Gagal menyimpan laporan',
      errorFetch: 'Gagal memuat data laba rugi',
      errorNetwork: 'Kesalahan jaringan',
    },
    validation: {
      corporateRequired: 'Perusahaan wajib dipilih',
      periodInvalid: 'Periode tidak valid',
      amountMin: 'Nilai tidak boleh negatif',
    },
  },
  en: {
    title: 'Income Statement Management',
    subtitle: 'Track revenue, expenses, and operational profitability.',
    inputNew: 'Input New Income Statement',
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
      revenue: 'Revenue',
      cogs: 'COGS',
      netProfit: 'Net Profit',
      margin: 'NPM',
      actions: 'Actions',
    },
    apply: 'Apply',
    clear: 'Clear',
    status: {
      empty: 'No Data',
      emptyDesc: 'Try adjusting filters or add new data.',
      loading: 'Loading Data...',
      submitting: 'Saving...',
    },
    modal: {
      createTitle: 'Input Income Statement',
      editTitle: 'Update Report',
      viewTitle: 'Income Statement Details',
      corporate: 'Corporate',
      period: 'Period',
      revenueAndCogs: 'Revenue & COGS',
      expensesAndProfit: 'Expenses & Profit',
      grossProfit: 'GROSS PROFIT',
      ebit: 'EBIT (OPERATING PROFIT)',
      ebt: 'EBT (EARNINGS BEFORE TAX)',
      netProfit: 'NET PROFIT (EAT)',
      netMargin: 'Net Margin',
      notes: 'Additional Notes',
      notesPlaceholder: 'Add notes if needed...',
      selectCorporate: 'Select Corporate',
      cancel: 'Cancel',
      submit: 'Save',
      month: 'Month',
      year: 'Year',
    },
    fields: {
      revenue: 'Revenue',
      cogs: 'COGS',
      operatingExpenses: 'Operating Expenses',
      interest: 'Interest',
      tax: 'Tax',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      deleteTitle: 'Delete income statement report?',
      deleteDesc: 'This action is permanent. Income statement data for this period will be deleted from the system.',
      deleteConfirm: 'Yes, Delete Income Statement',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successDelete: 'Income statement data deleted successfully',
      errorDelete: 'Failed to delete data',
      successSave: 'Income statement report saved successfully',
      successUpdate: 'Income statement report updated',
      errorSave: 'Failed to save report',
      errorFetch: 'Failed to load income statement data',
      errorNetwork: 'Network error',
    },
    validation: {
      corporateRequired: 'Corporate is required',
      periodInvalid: 'Invalid period',
      amountMin: 'Value cannot be negative',
    },
  },
};
