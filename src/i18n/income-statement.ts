// i18n/income-statement.ts
import { Locale } from './commons';

export interface IncomeStatementCopy {
  title: string;
  subtitle: string;
  inputNew: string;
  searchPlaceholder: string;
  tableHead: {
    period: string;
    corporate: string;
    revenue: string;
    cogs: string;
    netProfit: string;
    margin: string;
    actions: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
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
    month: string;
    year: string;
    expensesAndOthers: string;
    otherIncome: string;
    otherIncExp: string;
    taxAndResult: string;
    overwriteConfirm: string;
    overwrite: string;
  };
  fields: {
    revenue: string;
    cogs: string;
    operatingExpenses: string;
    interest: string;
    tax: string;
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
  };
}

export const incomeStatementI18n: Record<Locale, IncomeStatementCopy> = {
  id: {
    title: 'Manajemen Laba Rugi',
    subtitle: 'Lacak pendapatan, pengeluaran, dan profitabilitas operasional.',
    inputNew: 'Input Laba Rugi Baru',
    searchPlaceholder: 'Cari perusahaan...',
    tableHead: {
      period: 'Periode',
      corporate: 'Perusahaan',
      revenue: 'Pendapatan',
      cogs: 'HPP',
      netProfit: 'Laba Bersih',
      margin: 'NPM',
      actions: 'Aksi',
    },
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Coba sesuaikan filter atau tambahkan data baru.',
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
      month: 'Bulan',
      year: 'Tahun',
      expensesAndOthers: 'Beban & Lain-lain',
      otherIncome: 'Pendapatan Lain',
      otherIncExp: 'Pend. & Beban Lain',
      taxAndResult: 'Pajak & Hasil',
      overwriteConfirm: 'Data untuk periode ini sudah ada. Ingin menimpa?',
      overwrite: 'Timpa Data',
    },
    fields: {
      revenue: 'Pendapatan (Revenue)',
      cogs: 'HPP (COGS)',
      operatingExpenses: 'Biaya Operasional',
      interest: 'Bunga',
      tax: 'Pajak',
    },
    alerts: {
      deleteTitle: 'Hapus laporan laba rugi?',
      deleteDesc: 'Tindakan ini permanen. Data laba rugi untuk periode ini akan dihapus dari sistem.',
      deleteConfirm: 'Ya, Hapus Laba Rugi',
      deleteDeleting: 'Menghapus...',
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
    tableHead: {
      period: 'Period',
      corporate: 'Corporate',
      revenue: 'Revenue',
      cogs: 'COGS',
      netProfit: 'Net Profit',
      margin: 'NPM',
      actions: 'Actions',
    },
    status: {
      empty: 'No Data',
      emptyDesc: 'Try adjusting filters or add new data.',
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
      month: 'Month',
      year: 'Year',
      expensesAndOthers: 'Expenses & Others',
      otherIncome: 'Other Income',
      otherIncExp: 'Other Inc. & Exp.',
      taxAndResult: 'Tax & Result',
      overwriteConfirm: 'Data for this period already exists. Overwrite?',
      overwrite: 'Overwrite Data',
    },
    fields: {
      revenue: 'Revenue',
      cogs: 'COGS',
      operatingExpenses: 'Operating Expenses',
      interest: 'Interest',
      tax: 'Tax',
    },
    alerts: {
      deleteTitle: 'Delete income statement report?',
      deleteDesc: 'This action is permanent. Income statement data for this period will be deleted from the system.',
      deleteConfirm: 'Yes, Delete Income Statement',
      deleteDeleting: 'Deleting...',
    },
    validation: {
      corporateRequired: 'Corporate is required',
      periodInvalid: 'Invalid period',
      amountMin: 'Value cannot be negative',
    },
  },
};
