import { Locale } from './commons';

export interface CorporateCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  tableHead: {
    logo: string;
    name: string;
    sector: string;
    currency: string;
    fiscalYear: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
  pagination: {
    entries: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
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
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    successSave: string;
    successUpdate: string;
    successDelete: string;
    successStatus: string;
    errorSave: string;
    errorDelete: string;
    invalidFileType: string;
    invalidFileDesc: string;
    fileTooLarge: string;
    fileTooLargeDesc: string;
  };
  validation: {
    nameMin: string;
    codeMin: string;
    sectorRequired: string;
    currencyInvalid: string;
  };
}

export const corporateI18n: Record<Locale, CorporateCopy> = {
  id: {
    title: 'Pengelolaan Perusahaan',
    subtitle: 'Kelola entitas perusahaan dan branding.',
    addNew: 'Tambah Perusahaan',
    searchPlaceholder: 'Cari nama atau kode...',
    tableHead: {
      logo: 'Logo',
      name: 'Nama',
      sector: 'Sektor',
      currency: 'Mata Uang',
      fiscalYear: 'Tahun Fiskal',
    },
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data perusahaan yang terdaftar.',
    },
    pagination: {
      entries: 'entri',
    },
    modal: {
      createTitle: 'Tambah Perusahaan Baru',
      editTitle: 'Edit Perusahaan',
      viewTitle: 'Detail Perusahaan',
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
    },
    alerts: {
      deleteTitle: 'Hapus perusahaan?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Perusahaan dan data terkait akan dihapus.',
      successSave: 'Perusahaan berhasil ditambahkan',
      successUpdate: 'Perusahaan berhasil diperbarui',
      successDelete: 'Perusahaan berhasil dihapus',
      successStatus: 'Status perusahaan berhasil diubah',
      errorSave: 'Gagal menyimpan perusahaan',
      errorDelete: 'Gagal menghapus perusahaan',
      invalidFileType: 'Tipe file tidak valid',
      invalidFileDesc: 'Hanya file JPG, JPEG, PNG, dan WEBP yang diperbolehkan.',
      fileTooLarge: 'Ukuran file terlalu besar',
      fileTooLargeDesc: 'Ukuran logo maksimal adalah 2MB.',
    },
    validation: {
      nameMin: 'Nama minimal 3 karakter',
      codeMin: 'Kode minimal 2 karakter',
      sectorRequired: 'Sektor wajib dipilih',
      currencyInvalid: 'Mata uang tidak valid',
    },
  },
  en: {
    title: 'Corporate Management',
    subtitle: 'Manage corporate entities and branding.',
    addNew: 'Add Corporate',
    searchPlaceholder: 'Search name or code...',
    tableHead: {
      logo: 'Logo',
      name: 'Name',
      sector: 'Sector',
      currency: 'Currency',
      fiscalYear: 'Fiscal Year',
    },
    status: {
      empty: 'No Data',
      emptyDesc: 'No companies registered yet.',
    },
    pagination: {
      entries: 'entries',
    },
    modal: {
      createTitle: 'Add New Corporate',
      editTitle: 'Edit Corporate',
      viewTitle: 'Corporate Details',
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
    },
    alerts: {
      deleteTitle: 'Delete corporate?',
      deleteDesc: 'This action cannot be undone. Corporate and related data will be deleted.',
      successSave: 'Corporate added successfully',
      successUpdate: 'Corporate updated successfully',
      successDelete: 'Corporate deleted successfully',
      successStatus: 'Corporate status updated successfully',
      errorSave: 'Failed to save corporate',
      errorDelete: 'Failed to delete corporate',
      invalidFileType: 'Invalid file type',
      invalidFileDesc: 'Only JPG, JPEG, PNG, and WEBP files are allowed.',
      fileTooLarge: 'File too large',
      fileTooLargeDesc: 'Maximum logo size is 2MB.',
    },
    validation: {
      nameMin: 'Name must be at least 3 characters',
      codeMin: 'Code must be at least 2 characters',
      sectorRequired: 'Sector is required',
      currencyInvalid: 'Invalid currency',
    },
  },
};
