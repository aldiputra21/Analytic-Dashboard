// i18n/cost-center.ts
import { Locale } from './commons';

export interface CostCenterCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    code: string;
    name: string;
    parent: string;
    category: string;
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
    parent: string;
    category: string;
    description: string;
    cancel: string;
    submit: string;
    none: string;
    parentNote: string;
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
    errorSave: string;
    errorDelete: string;
    errorFetch: string;
    errorNetwork: string;
  };
  validation: {
    codeMin: string;
    nameMin: string;
    categoryRequired: string;
  };
}

export const costCenterI18n: Record<Locale, CostCenterCopy> = {
  id: {
    title: 'Pengelolaan Cost Center',
    subtitle: 'Kelola hierarki cost center untuk pelacakan keuangan.',
    addNew: 'Tambah Cost Center',
    searchPlaceholder: 'Cari nama atau kode...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      code: 'Kode',
      name: 'Nama',
      parent: 'Induk',
      category: 'Kategori',
      status: 'Status',
      actions: 'Aksi',
    },
    status: {
      active: 'Aktif',
      inactive: 'Nonaktif',
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada cost center yang terdaftar.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    modal: {
      createTitle: 'Tambah Cost Center Baru',
      editTitle: 'Edit Cost Center',
      viewTitle: 'Detail Cost Center',
      code: 'Kode',
      name: 'Nama',
      parent: 'Induk',
      category: 'Kategori',
      description: 'Deskripsi',
      cancel: 'Batal',
      submit: 'Simpan',
      none: 'Tidak ada (Level Atas)',
      parentNote: 'Jika diatur, kategori akan mengikuti induk secara otomatis.',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      deleteTitle: 'Hapus cost center?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data terkait cost center ini akan dihapus.',
      deleteConfirm: 'Ya, Hapus Cost Center',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Cost center berhasil ditambahkan',
      successUpdate: 'Cost center berhasil diperbarui',
      successDelete: 'Cost center berhasil dihapus',
      errorSave: 'Gagal menyimpan cost center',
      errorDelete: 'Gagal menghapus cost center',
      errorFetch: 'Gagal memuat data cost center',
      errorNetwork: 'Kesalahan jaringan',
    },
    validation: {
      codeMin: 'Kode minimal 2 karakter',
      nameMin: 'Nama minimal 3 karakter',
      categoryRequired: 'Kategori wajib dipilih untuk level atas',
    },
  },
  en: {
    title: 'Cost Center Management',
    subtitle: 'Manage cost center hierarchy for financial tracking.',
    addNew: 'Add Cost Center',
    searchPlaceholder: 'Search name or code...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      code: 'Code',
      name: 'Name',
      parent: 'Parent',
      category: 'Category',
      status: 'Status',
      actions: 'Actions',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Data',
      emptyDesc: 'No cost centers registered yet.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    modal: {
      createTitle: 'Add New Cost Center',
      editTitle: 'Edit Cost Center',
      viewTitle: 'Cost Center Detail',
      code: 'Code',
      name: 'Name',
      parent: 'Parent',
      category: 'Category',
      description: 'Description',
      cancel: 'Cancel',
      submit: 'Save',
      none: 'None (Top Level)',
      parentNote: 'If set, category will follow parent automatically.',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      deleteTitle: 'Delete cost center?',
      deleteDesc: 'This action cannot be undone. Cost center related data will be deleted.',
      deleteConfirm: 'Yes, Delete Cost Center',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Cost center added successfully',
      successUpdate: 'Cost center updated successfully',
      successDelete: 'Cost center deleted successfully',
      errorSave: 'Failed to save cost center',
      errorDelete: 'Failed to delete cost center',
      errorFetch: 'Failed to load cost center data',
      errorNetwork: 'Network error',
    },
    validation: {
      codeMin: 'Code must be at least 2 characters',
      nameMin: 'Name must be at least 3 characters',
      categoryRequired: 'Category is required for top-level centers',
    },
  },
};
