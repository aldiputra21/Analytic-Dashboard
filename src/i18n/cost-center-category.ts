// i18n/cost-center-category.ts
import { Locale } from './income-statement';

export interface CostCenterCategoryCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    code: string;
    labelId: string;
    labelEn: string;
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
    labelId: string;
    labelEn: string;
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
}

export const costCenterCategoryI18n: Record<Locale, CostCenterCategoryCopy> = {
  id: {
    title: 'Pengelolaan Kategori Cost Center',
    subtitle: 'Kelola data master kategori untuk pengelompokan cost center.',
    addNew: 'Tambah Kategori',
    searchPlaceholder: 'Cari kode atau label kategori...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      code: 'Kode',
      labelId: 'Label (ID)',
      labelEn: 'Label (EN)',
      status: 'Status',
      actions: 'Aksi',
    },
    status: {
      active: 'Aktif',
      inactive: 'Nonaktif',
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data kategori cost center yang terdaftar.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    modal: {
      createTitle: 'Tambah Kategori Baru',
      editTitle: 'Edit Kategori',
      viewTitle: 'Detail Kategori',
      code: 'Kode',
      labelId: 'Label Bahasa Indonesia',
      labelEn: 'Label Bahasa Inggris',
      status: 'Status',
      cancel: 'Batal',
      submit: 'Simpan',
      close: 'Tutup',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      deleteTitle: 'Hapus kategori?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data kategori dan informasi terkait akan dihapus.',
      deleteConfirm: 'Ya, Hapus Kategori',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Kategori berhasil ditambahkan',
      successUpdate: 'Kategori berhasil diperbarui',
      successDelete: 'Kategori berhasil dihapus',
      successStatus: 'Status kategori berhasil diubah',
      errorSave: 'Gagal menyimpan kategori',
      errorDelete: 'Gagal menghapus kategori',
      errorFetch: 'Gagal memuat data kategori',
      errorNetwork: 'Kesalahan jaringan',
      errorDuplicate: 'Kode kategori sudah digunakan',
    },
  },
  en: {
    title: 'Cost Center Category Management',
    subtitle: 'Manage category master data for cost center grouping.',
    addNew: 'Add Category',
    searchPlaceholder: 'Search category code or label...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      code: 'Code',
      labelId: 'Label (ID)',
      labelEn: 'Label (EN)',
      status: 'Status',
      actions: 'Actions',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Data',
      emptyDesc: 'No cost center categories registered yet.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    modal: {
      createTitle: 'Add New Category',
      editTitle: 'Edit Category',
      viewTitle: 'Category Detail',
      code: 'Code',
      labelId: 'Indonesian Label',
      labelEn: 'English Label',
      status: 'Status',
      cancel: 'Cancel',
      submit: 'Save',
      close: 'Close',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      deleteTitle: 'Delete category?',
      deleteDesc: 'This action cannot be undone. Category data and related information will be deleted.',
      deleteConfirm: 'Yes, Delete Category',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Category added successfully',
      successUpdate: 'Category updated successfully',
      successDelete: 'Category deleted successfully',
      successStatus: 'Category status updated successfully',
      errorSave: 'Failed to save category',
      errorDelete: 'Failed to delete category',
      errorFetch: 'Failed to load category data',
      errorNetwork: 'Network error',
      errorDuplicate: 'Category code already in use',
    },
  },
};
