// i18n/bank.ts
import { Locale } from './income-statement';

export interface BankCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    code: string;
    name: string;
    swiftCode: string;
    status: string;
    actions: string;
  };
  status: {
    active: string;
    inactive: string;
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
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    code: string;
    name: string;
    swiftCode: string;
    swiftCodeOptional: string;
    status: string;
    cancel: string;
    submit: string;
    close: string;
  };
  alerts: {
    errorRequired: string;
    deleteTitle: string;
    deleteDesc: string;
    deleteConfirm: string;
    deleteCancel: string;
    deleteDeleting: string;
    successSave: string;
    successUpdate: string;
    successDelete: string;
    successStatus: string;
    errorSave: string;
    errorDelete: string;
    errorFetch: string;
    errorNetwork: string;
    errorDuplicate: string;
  };
  validation: {
    codeMin: string;
    nameMin: string;
  };
}

export const bankI18n: Record<Locale, BankCopy> = {
  id: {
    title: 'Pengelolaan Bank',
    subtitle: 'Kelola data master bank untuk transaksi keuangan.',
    addNew: 'Tambah Bank',
    searchPlaceholder: 'Cari nama atau kode bank...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      code: 'Kode',
      name: 'Nama Bank',
      swiftCode: 'Kode SWIFT',
      status: 'Status',
      actions: 'Aksi',
    },
    status: {
      active: 'Aktif',
      inactive: 'Nonaktif',
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data bank yang terdaftar.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    modal: {
      createTitle: 'Tambah Bank Baru',
      editTitle: 'Edit Bank',
      viewTitle: 'Detail Bank',
      code: 'Kode Bank',
      name: 'Nama Bank',
      swiftCode: 'Kode SWIFT',
      swiftCodeOptional: 'Kode SWIFT (Opsional)',
      status: 'Status',
      cancel: 'Batal',
      submit: 'Simpan',
      close: 'Tutup',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      deleteTitle: 'Hapus bank?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data bank dan informasi terkait akan dihapus.',
      deleteConfirm: 'Ya, Hapus Bank',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Bank berhasil ditambahkan',
      successUpdate: 'Bank berhasil diperbarui',
      successDelete: 'Bank berhasil dihapus',
      successStatus: 'Status bank berhasil diubah',
      errorSave: 'Gagal menyimpan bank',
      errorDelete: 'Gagal menghapus bank',
      errorFetch: 'Gagal memuat data bank',
      errorNetwork: 'Kesalahan jaringan',
      errorDuplicate: 'Kode bank sudah digunakan',
    },
    validation: {
      codeMin: 'Kode minimal 2 karakter',
      nameMin: 'Nama minimal 3 karakter',
    },
  },
  en: {
    title: 'Bank Management',
    subtitle: 'Manage bank master data for financial transactions.',
    addNew: 'Add Bank',
    searchPlaceholder: 'Search bank name or code...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      code: 'Code',
      name: 'Bank Name',
      swiftCode: 'SWIFT Code',
      status: 'Status',
      actions: 'Actions',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Data',
      emptyDesc: 'No banks registered yet.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    modal: {
      createTitle: 'Add New Bank',
      editTitle: 'Edit Bank',
      viewTitle: 'Bank Detail',
      code: 'Bank Code',
      name: 'Bank Name',
      swiftCode: 'SWIFT Code',
      swiftCodeOptional: 'SWIFT Code (Optional)',
      status: 'Status',
      cancel: 'Cancel',
      submit: 'Save',
      close: 'Close',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      deleteTitle: 'Delete bank?',
      deleteDesc: 'This action cannot be undone. Bank data and related information will be deleted.',
      deleteConfirm: 'Yes, Delete Bank',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Bank added successfully',
      successUpdate: 'Bank updated successfully',
      successDelete: 'Bank deleted successfully',
      successStatus: 'Bank status updated successfully',
      errorSave: 'Failed to save bank',
      errorDelete: 'Failed to delete bank',
      errorFetch: 'Failed to load bank data',
      errorNetwork: 'Network error',
      errorDuplicate: 'Bank code already in use',
    },
    validation: {
      codeMin: 'Code must be at least 2 characters',
      nameMin: 'Name must be at least 3 characters',
    },
  },
};
