// i18n/bank-loan.ts
import { Locale } from './commons';

export interface BankLoanCopy {
  title: string;
  subtitle: string;
  inputNew: string;
  searchPlaceholder: string;
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
    empty: string;
    emptyDesc: string;
  };
  filter: {
    status: string;
    allStatuses: string;
    allCorporates: string;
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
    markPaidConfirm: string;
    markPaidConfirmTitle: string;
    markPaidConfirmDesc: string;
    noInstallments: string;
    progressLabel: string;
    effectiveInputHint: string;
    totalLabel: string;
    remainingLabel: string;
  };
  alerts: {
    errorInstallmentSum: string;
    errorInstallmentCount: string;
    deleteTitle: string;
    deleteDesc: string;
    deleteConfirm: string;
    deleteDeleting: string;
    successMarkPaid: string;
    successLoanPaid: string;
    errorMarkPaid: string;
  };
  validation: {
    bankRequired: string;
    corporateRequired: string;
    amountMin: string;
    startDateRequired: string;
    tenorMin: string;
    interestRateInvalid: string;
  };
}

export const bankLoanI18n: Record<Locale, BankLoanCopy> = {
  id: {
    title: 'Pengelolaan Pinjaman Bank',
    subtitle: 'Kelola data pinjaman bank beserta jadwal cicilan.',
    inputNew: 'Tambah Pinjaman',
    searchPlaceholder: 'Cari nama bank atau perusahaan...',
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
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data pinjaman bank yang terdaftar.',
    },
    filter: {
      status: 'Status',
      allStatuses: 'Semua Status',
      allCorporates: 'Semua Perusahaan',
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
      markPaidConfirm: 'Ya, Tandai Lunas',
      markPaidConfirmTitle: 'Tandai cicilan sebagai lunas?',
      markPaidConfirmDesc: 'Tindakan ini akan mencatat cicilan ini telah dibayarkan hari ini.',
      noInstallments: 'Belum ada jadwal cicilan',
      progressLabel: 'cicilan lunas',
      effectiveInputHint: 'Masukkan jumlah cicilan untuk setiap bulan. Total harus sama dengan jumlah pinjaman.',
      totalLabel: 'Total Cicilan',
      remainingLabel: 'Selisih',
    },
    alerts: {
      errorInstallmentSum: 'Total cicilan harus sama dengan jumlah pinjaman',
      errorInstallmentCount: 'Jumlah baris cicilan harus sama dengan tenor',
      deleteTitle: 'Hapus pinjaman?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data pinjaman dan semua jadwal cicilan akan dihapus.',
      deleteConfirm: 'Ya, Hapus Pinjaman',
      deleteDeleting: 'Menghapus...',
      successMarkPaid: 'Cicilan berhasil ditandai lunas',
      successLoanPaid: 'Semua cicilan lunas — pinjaman ditandai selesai',
      errorMarkPaid: 'Gagal menandai cicilan sebagai lunas',
    },
    validation: {
      bankRequired: 'Bank wajib dipilih',
      corporateRequired: 'Perusahaan wajib dipilih',
      amountMin: 'Jumlah harus lebih besar dari 0',
      startDateRequired: 'Tanggal mulai wajib diisi',
      tenorMin: 'Tenor minimal 1 bulan',
      interestRateInvalid: 'Suku bunga tidak valid',
    },
  },
  en: {
    title: 'Bank Loan Management',
    subtitle: 'Manage bank loan data along with installment schedules.',
    inputNew: 'Add Loan',
    searchPlaceholder: 'Search bank or corporate name...',
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
      empty: 'No Data',
      emptyDesc: 'No bank loans registered yet.',
    },
    filter: {
      status: 'Status',
      allStatuses: 'All Statuses',
      allCorporates: 'All Corporates',
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
      markPaidConfirm: 'Yes, Mark as Paid',
      markPaidConfirmTitle: 'Mark installment as paid?',
      markPaidConfirmDesc: 'This action will record this installment as paid today.',
      noInstallments: 'No installment schedule yet',
      progressLabel: 'installments paid',
      effectiveInputHint: 'Enter the installment amount for each month. Total must equal the loan amount.',
      totalLabel: 'Total Installments',
      remainingLabel: 'Difference',
    },
    alerts: {
      errorInstallmentSum: 'Total installments must equal the loan amount',
      errorInstallmentCount: 'Number of installment rows must equal the tenor',
      deleteTitle: 'Delete loan?',
      deleteDesc: 'This action cannot be undone. Loan data and all installment schedules will be deleted.',
      deleteConfirm: 'Yes, Delete Loan',
      deleteDeleting: 'Deleting...',
      successMarkPaid: 'Installment marked as paid successfully',
      successLoanPaid: 'All installments paid — loan marked as complete',
      errorMarkPaid: 'Failed to mark installment as paid',
    },
    validation: {
      bankRequired: 'Bank is required',
      corporateRequired: 'Corporate is required',
      amountMin: 'Amount must be greater than 0',
      startDateRequired: 'Start date is required',
      tenorMin: 'Tenor must be at least 1 month',
      interestRateInvalid: 'Invalid interest rate',
    },
  },
};
