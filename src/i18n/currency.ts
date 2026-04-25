// i18n/currency.ts
import { Locale } from './income-statement';

export interface CurrencyCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    code: string;
    label: string;
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
    label: string;
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
    codeRequired: string;
    codeMin: string;
    labelRequired: string;
  };
}

export const currencyI18n: Record<Locale, CurrencyCopy> = {
  id: {
    title: 'Pengelolaan Mata Uang',
    subtitle: 'Kelola data master mata uang yang digunakan dalam sistem.',
    addNew: 'Tambah Mata Uang',
    searchPlaceholder: 'Cari kode atau nama mata uang...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      code: 'Kode',
      label: 'Nama Mata Uang',
      status: 'Status',
      actions: 'Aksi',
    },
    status: {
      active: 'Aktif',
      inactive: 'Nonaktif',
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data mata uang yang terdaftar.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    modal: {
      createTitle: 'Tambah Mata Uang Baru',
      editTitle: 'Edit Mata Uang',
      viewTitle: 'Detail Mata Uang',
      code: 'Kode Mata Uang',
      label: 'Nama Mata Uang',
      status: 'Status',
      cancel: 'Batal',
      submit: 'Simpan',
      close: 'Tutup',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      deleteTitle: 'Hapus mata uang?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data mata uang dan informasi terkait akan dihapus.',
      deleteConfirm: 'Ya, Hapus Mata Uang',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Mata uang berhasil ditambahkan',
      successUpdate: 'Mata uang berhasil diperbarui',
      successDelete: 'Mata uang berhasil dihapus',
      successStatus: 'Status mata uang berhasil diubah',
      errorSave: 'Gagal menyimpan mata uang',
      errorDelete: 'Gagal menghapus mata uang',
      errorFetch: 'Gagal memuat data mata uang',
      errorNetwork: 'Kesalahan jaringan',
      errorDuplicate: 'Kode mata uang sudah digunakan',
    },
    validation: {
      codeRequired: 'Kode mata uang wajib diisi',
      codeMin: 'Kode minimal 3 karakter (e.g., IDR)',
      labelRequired: 'Nama mata uang wajib diisi',
    },
  },
  en: {
    title: 'Currency Management',
    subtitle: 'Manage currency master data used in the system.',
    addNew: 'Add Currency',
    searchPlaceholder: 'Search currency code or name...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      code: 'Code',
      label: 'Currency Name',
      status: 'Status',
      actions: 'Actions',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Data',
      emptyDesc: 'No currencies registered yet.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    modal: {
      createTitle: 'Add New Currency',
      editTitle: 'Edit Currency',
      viewTitle: 'Currency Detail',
      code: 'Currency Code',
      label: 'Currency Name',
      status: 'Status',
      cancel: 'Cancel',
      submit: 'Save',
      close: 'Close',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      deleteTitle: 'Delete currency?',
      deleteDesc: 'This action cannot be undone. Currency data and related information will be deleted.',
      deleteConfirm: 'Yes, Delete Currency',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Currency added successfully',
      successUpdate: 'Currency updated successfully',
      successDelete: 'Currency deleted successfully',
      successStatus: 'Currency status updated successfully',
      errorSave: 'Failed to save currency',
      errorDelete: 'Failed to delete currency',
      errorFetch: 'Failed to load currency data',
      errorNetwork: 'Network error',
      errorDuplicate: 'Currency code already in use',
    },
    validation: {
      codeRequired: 'Currency code is required',
      codeMin: 'Code must be at least 3 characters (e.g., USD)',
      labelRequired: 'Currency name is required',
    },
  },
};
