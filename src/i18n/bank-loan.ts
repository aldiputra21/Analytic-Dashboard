// i18n/bank-loan.ts
import { Locale } from './income-statement';

export interface BankLoanCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    bank: string;
    corporate: string;
    amount: string;
    tenor: string;
    interestType: string;
    interestRate: string;
    startDate: string;
    status: string;
    progress: string;
    actions: string;
  };
  interestType: {
    flat: string;
    effective: string;
  };
  loanStatus: {
    ongoing: string;
    paid: string;
  };
  installmentStatus: {
    unpaid: string;
    paid: string;
  };
  status: {
    loading: string;
    submitting: string;
    empty: string;
    emptyDesc: string;
  };
  pagination: {
    showing: string;
    of: string;
    entries: string;
    rowsPerPage: string;
  };
  filter: {
    status: string;
    allStatuses: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    bank: string;
    corporate: string;
    amount: string;
    startDate: string;
    tenor: string;
    tenorUnit: string;
    interestType: string;
    interestRate: string;
    interestRateUnit: string;
    alertMinDays: string;
    alertMinDaysHint: string;
    installmentAmount: string;
    selectBank: string;
    selectCorporate: string;
    cancel: string;
    submit: string;
    close: string;
  };
  installment: {
    sectionTitle: string;
    tableHead: {
      no: string;
      installmentDate: string;
      amount: string;
      status: string;
      paidDate: string;
      actions: string;
    };
    markPaid: string;
    markPaidConfirmTitle: string;
    markPaidConfirmDesc: string;
    markPaidConfirm: string;
    markPaidCancel: string;
    noInstallments: string;
    progressLabel: string;
    effectiveInputHint: string;
    totalLabel: string;
    remainingLabel: string;
  };
  alerts: {
    errorRequired: string;
    errorInstallmentSum: string;
    errorInstallmentCount: string;
    deleteTitle: string;
    deleteDesc: string;
    deleteConfirm: string;
    deleteCancel: string;
    deleteDeleting: string;
    successSave: string;
    successUpdate: string;
    successDelete: string;
    successMarkPaid: string;
    successLoanPaid: string;
    errorSave: string;
    errorDelete: string;
    errorFetch: string;
    errorNetwork: string;
    errorMarkPaid: string;
  };
}

export const bankLoanI18n: Record<Locale, BankLoanCopy> = {
  id: {
    title: 'Pengelolaan Pinjaman Bank',
    subtitle: 'Kelola data pinjaman bank beserta jadwal cicilan.',
    addNew: 'Tambah Pinjaman',
    searchPlaceholder: 'Cari nama bank atau perusahaan...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      bank: 'Bank',
      corporate: 'Perusahaan',
      amount: 'Jumlah Pinjaman',
      tenor: 'Tenor',
      interestType: 'Jenis Bunga',
      interestRate: 'Suku Bunga',
      startDate: 'Tanggal Mulai',
      status: 'Status',
      progress: 'Progress Cicilan',
      actions: 'Aksi',
    },
    interestType: {
      flat: 'Flat',
      effective: 'Efektif',
    },
    loanStatus: {
      ongoing: 'Berjalan',
      paid: 'Lunas',
    },
    installmentStatus: {
      unpaid: 'Belum Bayar',
      paid: 'Lunas',
    },
    status: {
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data pinjaman bank yang terdaftar.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    filter: {
      status: 'Status',
      allStatuses: 'Semua Status',
    },
    modal: {
      createTitle: 'Tambah Pinjaman Baru',
      editTitle: 'Edit Pinjaman',
      viewTitle: 'Detail Pinjaman',
      bank: 'Bank',
      corporate: 'Perusahaan',
      amount: 'Jumlah Pinjaman',
      startDate: 'Tanggal Mulai',
      tenor: 'Tenor',
      tenorUnit: 'bulan',
      interestType: 'Jenis Bunga',
      interestRate: 'Suku Bunga (%)',
      interestRateUnit: '% per tahun',
      alertMinDays: 'Notifikasi Sebelum Jatuh Tempo',
      alertMinDaysHint: 'Hari sebelum jatuh tempo untuk mengirim notifikasi',
      installmentAmount: 'Jumlah Cicilan per Bulan',
      selectBank: 'Pilih Bank',
      selectCorporate: 'Pilih Perusahaan',
      cancel: 'Batal',
      submit: 'Simpan',
      close: 'Tutup',
    },
    installment: {
      sectionTitle: 'Jadwal Cicilan',
      tableHead: {
        no: 'No.',
        installmentDate: 'Tanggal Cicilan',
        amount: 'Jumlah',
        status: 'Status',
        paidDate: 'Tanggal Bayar',
        actions: 'Aksi',
      },
      markPaid: 'Tandai Lunas',
      markPaidConfirmTitle: 'Tandai cicilan sebagai lunas?',
      markPaidConfirmDesc: 'Cicilan ini akan ditandai sebagai lunas dengan tanggal hari ini.',
      markPaidConfirm: 'Ya, Tandai Lunas',
      markPaidCancel: 'Batal',
      noInstallments: 'Belum ada jadwal cicilan',
      progressLabel: 'cicilan lunas',
      effectiveInputHint: 'Masukkan jumlah cicilan untuk setiap bulan. Total harus sama dengan jumlah pinjaman.',
      totalLabel: 'Total Cicilan',
      remainingLabel: 'Selisih',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      errorInstallmentSum: 'Total cicilan harus sama dengan jumlah pinjaman',
      errorInstallmentCount: 'Jumlah baris cicilan harus sama dengan tenor',
      deleteTitle: 'Hapus pinjaman?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data pinjaman dan semua jadwal cicilan akan dihapus.',
      deleteConfirm: 'Ya, Hapus Pinjaman',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Pinjaman berhasil ditambahkan',
      successUpdate: 'Pinjaman berhasil diperbarui',
      successDelete: 'Pinjaman berhasil dihapus',
      successMarkPaid: 'Cicilan berhasil ditandai lunas',
      successLoanPaid: 'Semua cicilan lunas — pinjaman ditandai selesai',
      errorSave: 'Gagal menyimpan pinjaman',
      errorDelete: 'Gagal menghapus pinjaman',
      errorFetch: 'Gagal memuat data pinjaman',
      errorNetwork: 'Kesalahan jaringan',
      errorMarkPaid: 'Gagal menandai cicilan sebagai lunas',
    },
  },
  en: {
    title: 'Bank Loan Management',
    subtitle: 'Manage bank loan data along with installment schedules.',
    addNew: 'Add Loan',
    searchPlaceholder: 'Search bank or corporate name...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      bank: 'Bank',
      corporate: 'Corporate',
      amount: 'Loan Amount',
      tenor: 'Tenor',
      interestType: 'Interest Type',
      interestRate: 'Interest Rate',
      startDate: 'Start Date',
      status: 'Status',
      progress: 'Installment Progress',
      actions: 'Actions',
    },
    interestType: {
      flat: 'Flat',
      effective: 'Effective',
    },
    loanStatus: {
      ongoing: 'Ongoing',
      paid: 'Paid Off',
    },
    installmentStatus: {
      unpaid: 'Unpaid',
      paid: 'Paid',
    },
    status: {
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Data',
      emptyDesc: 'No bank loans registered yet.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    filter: {
      status: 'Status',
      allStatuses: 'All Statuses',
    },
    modal: {
      createTitle: 'Add New Loan',
      editTitle: 'Edit Loan',
      viewTitle: 'Loan Detail',
      bank: 'Bank',
      corporate: 'Corporate',
      amount: 'Loan Amount',
      startDate: 'Start Date',
      tenor: 'Tenor',
      tenorUnit: 'months',
      interestType: 'Interest Type',
      interestRate: 'Interest Rate (%)',
      interestRateUnit: '% per year',
      alertMinDays: 'Notify Before Due Date',
      alertMinDaysHint: 'Days before due date to send notification',
      installmentAmount: 'Monthly Installment Amount',
      selectBank: 'Select Bank',
      selectCorporate: 'Select Corporate',
      cancel: 'Cancel',
      submit: 'Save',
      close: 'Close',
    },
    installment: {
      sectionTitle: 'Installment Schedule',
      tableHead: {
        no: 'No.',
        installmentDate: 'Installment Date',
        amount: 'Amount',
        status: 'Status',
        paidDate: 'Paid Date',
        actions: 'Actions',
      },
      markPaid: 'Mark as Paid',
      markPaidConfirmTitle: 'Mark installment as paid?',
      markPaidConfirmDesc: 'This installment will be marked as paid with today\'s date.',
      markPaidConfirm: 'Yes, Mark as Paid',
      markPaidCancel: 'Cancel',
      noInstallments: 'No installment schedule yet',
      progressLabel: 'installments paid',
      effectiveInputHint: 'Enter the installment amount for each month. Total must equal the loan amount.',
      totalLabel: 'Total Installments',
      remainingLabel: 'Difference',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      errorInstallmentSum: 'Total installments must equal the loan amount',
      errorInstallmentCount: 'Number of installment rows must equal the tenor',
      deleteTitle: 'Delete loan?',
      deleteDesc: 'This action cannot be undone. Loan data and all installment schedules will be deleted.',
      deleteConfirm: 'Yes, Delete Loan',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Loan added successfully',
      successUpdate: 'Loan updated successfully',
      successDelete: 'Loan deleted successfully',
      successMarkPaid: 'Installment marked as paid successfully',
      successLoanPaid: 'All installments paid — loan marked as complete',
      errorSave: 'Failed to save loan',
      errorDelete: 'Failed to delete loan',
      errorFetch: 'Failed to load loan data',
      errorNetwork: 'Network error',
      errorMarkPaid: 'Failed to mark installment as paid',
    },
  },
};
