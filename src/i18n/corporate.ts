// i18n/corporate.ts
import { Locale } from './income-statement';

export interface CorporateCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    logo: string;
    name: string;
    sector: string;
    currency: string;
    fiscalYear: string;
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
    code: string;
    name: string;
    sector: string;
    currency: string;
    taxRate: string;
    fiscalYear: string;
    logo: string;
    basicInfo: string;
    financialConfig: string;
    fiscalCalendar: string;
    dropOrClick: string;
    logoHint: string;
    cancel: string;
    submit: string;
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
    invalidFileType: string;
    invalidFileDesc: string;
    fileTooLarge: string;
    fileTooLargeDesc: string;
  };
}

export const corporateI18n: Record<Locale, CorporateCopy> = {
  id: {
    title: 'Pengelolaan Perusahaan',
    subtitle: 'Kelola entitas perusahaan dan branding.',
    addNew: 'Tambah Perusahaan',
    searchPlaceholder: 'Cari nama atau kode...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      logo: 'Logo',
      name: 'Nama',
      sector: 'Sektor',
      currency: 'Mata Uang',
      fiscalYear: 'Tahun Fiskal',
      status: 'Status',
      actions: 'Aksi',
    },
    status: {
      active: 'Aktif',
      inactive: 'Nonaktif',
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data perusahaan yang terdaftar.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    modal: {
      createTitle: 'Tambah Perusahaan Baru',
      editTitle: 'Edit Perusahaan',
      code: 'Kode',
      name: 'Nama Perusahaan',
      sector: 'Sektor Industri',
      currency: 'Mata Uang Utama',
      taxRate: 'Tarif Pajak (%)',
      fiscalYear: 'Bulan Awal Tahun Fiskal',
      logo: 'Logo Perusahaan',
      basicInfo: 'Informasi Dasar',
      financialConfig: 'Konfigurasi Keuangan',
      fiscalCalendar: 'Kalender Fiskal',
      dropOrClick: 'Lepas atau klik',
      logoHint: 'JPG, PNG atau WEBP\nMax 2MB',
      cancel: 'Batal',
      submit: 'Simpan',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      deleteTitle: 'Hapus perusahaan?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Perusahaan dan data terkait akan dihapus.',
      deleteConfirm: 'Ya, Hapus Perusahaan',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Perusahaan berhasil ditambahkan',
      successUpdate: 'Perusahaan berhasil diperbarui',
      successDelete: 'Perusahaan berhasil dihapus',
      successStatus: 'Status perusahaan berhasil diubah',
      errorSave: 'Gagal menyimpan perusahaan',
      errorDelete: 'Gagal menghapus perusahaan',
      errorFetch: 'Gagal memuat data perusahaan',
      errorNetwork: 'Kesalahan jaringan',
      invalidFileType: 'Tipe file tidak valid',
      invalidFileDesc: 'Hanya file JPG, JPEG, PNG, dan WEBP yang diperbolehkan.',
      fileTooLarge: 'Ukuran file terlalu besar',
      fileTooLargeDesc: 'Ukuran logo maksimal adalah 2MB.',
    },
  },
  en: {
    title: 'Corporate Management',
    subtitle: 'Manage corporate entities and branding.',
    addNew: 'Add Corporate',
    searchPlaceholder: 'Search name or code...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      logo: 'Logo',
      name: 'Name',
      sector: 'Sector',
      currency: 'Currency',
      fiscalYear: 'Fiscal Year',
      status: 'Status',
      actions: 'Actions',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Data',
      emptyDesc: 'No companies registered yet.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    modal: {
      createTitle: 'Add New Corporate',
      editTitle: 'Edit Corporate',
      code: 'Code',
      name: 'Company Name',
      sector: 'Industry Sector',
      currency: 'Base Currency',
      taxRate: 'Tax Rate (%)',
      fiscalYear: 'Fiscal Year Start Month',
      logo: 'Company Logo',
      basicInfo: 'Basic Information',
      financialConfig: 'Financial Config',
      fiscalCalendar: 'Fiscal Calendar',
      dropOrClick: 'Drop or click',
      logoHint: 'JPG, PNG or WEBP\nMax 2MB',
      cancel: 'Cancel',
      submit: 'Save',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      deleteTitle: 'Delete corporate?',
      deleteDesc: 'This action cannot be undone. Corporate and related data will be deleted.',
      deleteConfirm: 'Yes, Delete Corporate',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Corporate added successfully',
      successUpdate: 'Corporate updated successfully',
      successDelete: 'Corporate deleted successfully',
      successStatus: 'Corporate status updated successfully',
      errorSave: 'Failed to save corporate',
      errorDelete: 'Failed to delete corporate',
      errorFetch: 'Failed to load corporate data',
      errorNetwork: 'Network error',
      invalidFileType: 'Invalid file type',
      invalidFileDesc: 'Only JPG, JPEG, PNG, and WEBP files are allowed.',
      fileTooLarge: 'File too large',
      fileTooLargeDesc: 'Maximum logo size is 2MB.',
    },
  },
};
