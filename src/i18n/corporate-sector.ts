// i18n/corporate-sector.ts
import { Locale } from './income-statement';

export interface CorporateSectorCopy {
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

export const corporateSectorI18n: Record<Locale, CorporateSectorCopy> = {
  id: {
    title: 'Pengelolaan Sektor Perusahaan',
    subtitle: 'Kelola data master sektor industri perusahaan.',
    addNew: 'Tambah Sektor',
    searchPlaceholder: 'Cari kode atau label sektor...',
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
      emptyDesc: 'Belum ada data sektor perusahaan yang terdaftar.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    modal: {
      createTitle: 'Tambah Sektor Baru',
      editTitle: 'Edit Sektor',
      viewTitle: 'Detail Sektor',
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
      deleteTitle: 'Hapus sektor?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data sektor dan informasi terkait akan dihapus.',
      deleteConfirm: 'Ya, Hapus Sektor',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Sektor berhasil ditambahkan',
      successUpdate: 'Sektor berhasil diperbarui',
      successDelete: 'Sektor berhasil dihapus',
      successStatus: 'Status sektor berhasil diubah',
      errorSave: 'Gagal menyimpan sektor',
      errorDelete: 'Gagal menghapus sektor',
      errorFetch: 'Gagal memuat data sektor',
      errorNetwork: 'Kesalahan jaringan',
      errorDuplicate: 'Kode sektor sudah digunakan',
    },
  },
  en: {
    title: 'Corporate Sector Management',
    subtitle: 'Manage corporate industry sector master data.',
    addNew: 'Add Sector',
    searchPlaceholder: 'Search sector code or label...',
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
      emptyDesc: 'No corporate sectors registered yet.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    modal: {
      createTitle: 'Add New Sector',
      editTitle: 'Edit Sector',
      viewTitle: 'Sector Detail',
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
      deleteTitle: 'Delete sector?',
      deleteDesc: 'This action cannot be undone. Sector data and related information will be deleted.',
      deleteConfirm: 'Yes, Delete Sector',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Sector added successfully',
      successUpdate: 'Sector updated successfully',
      successDelete: 'Sector deleted successfully',
      successStatus: 'Sector status updated successfully',
      errorSave: 'Failed to save sector',
      errorDelete: 'Failed to delete sector',
      errorFetch: 'Failed to load sector data',
      errorNetwork: 'Network error',
      errorDuplicate: 'Sector code already in use',
    },
  },
};
