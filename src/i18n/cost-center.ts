// i18n/cost-center.ts
import { Locale } from './commons';

export interface CostCenterCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  tableHead: {
    code: string;
    name: string;
    parent: string;
    category: string;
  };
  filter: {
    allCorporates: string;
  };
  status: {
    loading: string;
    empty: string;
    emptyDesc: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    code: string;
    name: string;
    parent: string;
    category: string;
    corporate: string;
    description: string;
    none: string;
    parentNote: string;
    selectCategory: string;
    codePlaceholder: string;
    namePlaceholder: string;
    descPlaceholder: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    successSave: string;
    successUpdate: string;
    successDelete: string;
    errorSave: string;
    errorDelete: string;
  };
    validation: {
    codeMin: string;
    nameMin: string;
    categoryRequired: string;
    corporateRequired: string;
  };
}

export const costCenterI18n: Record<Locale, CostCenterCopy> = {
  id: {
    title: 'Pengelolaan Cost Center',
    subtitle: 'Kelola hierarki cost center untuk pelacakan keuangan.',
    addNew: 'Tambah Cost Center',
    searchPlaceholder: 'Cari nama atau kode...',
    tableHead: {
      code: 'Kode',
      name: 'Nama',
      parent: 'Induk',
      category: 'Kategori',
    },
    filter: {
      allCorporates: 'Semua Perusahaan',
    },
    status: {
      loading: 'Memuat Data...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada cost center yang terdaftar.',
    },
    modal: {
      createTitle: 'Tambah Cost Center Baru',
      editTitle: 'Edit Cost Center',
      viewTitle: 'Detail Cost Center',
      code: 'Kode',
      name: 'Nama',
      parent: 'Induk',
      category: 'Kategori',
      corporate: 'Perusahaan',
      description: 'Deskripsi',
      none: 'Tidak ada (Level Atas)',
      parentNote: 'Jika diatur, kategori akan mengikuti induk secara otomatis.',
      selectCategory: 'Pilih kategori...',
      codePlaceholder: 'CC-001',
      namePlaceholder: 'Nama Cost Center',
      descPlaceholder: 'Gunakan field ini untuk catatan tambahan...',
    },
    alerts: {
      deleteTitle: 'Hapus cost center?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data terkait cost center ini akan dihapus.',
      successSave: 'Cost center berhasil ditambahkan',
      successUpdate: 'Cost center berhasil diperbarui',
      successDelete: 'Cost center berhasil dihapus',
      errorSave: 'Gagal menyimpan cost center',
      errorDelete: 'Gagal menghapus cost center',
    },
    validation: {
      codeMin: 'Kode minimal 2 karakter',
      nameMin: 'Nama minimal 3 karakter',
      categoryRequired: 'Kategori wajib dipilih untuk level atas',
      corporateRequired: 'Perusahaan wajib dipilih',
    },
  },
  en: {
    title: 'Cost Center Management',
    subtitle: 'Manage cost center hierarchy for financial tracking.',
    addNew: 'Add Cost Center',
    searchPlaceholder: 'Search name or code...',
    tableHead: {
      code: 'Code',
      name: 'Name',
      parent: 'Parent',
      category: 'Category',
    },
    filter: {
      allCorporates: 'All Corporates',
    },
    status: {
      loading: 'Loading Data...',
      empty: 'No Data',
      emptyDesc: 'No cost centers registered yet.',
    },
    modal: {
      createTitle: 'Add New Cost Center',
      editTitle: 'Edit Cost Center',
      viewTitle: 'Cost Center Detail',
      code: 'Code',
      name: 'Name',
      parent: 'Parent',
      category: 'Category',
      corporate: 'Corporate',
      description: 'Description',
      none: 'None (Top Level)',
      parentNote: 'If set, category will follow parent automatically.',
      selectCategory: 'Select category...',
      codePlaceholder: 'CC-001',
      namePlaceholder: 'Cost Center Name',
      descPlaceholder: 'Use this field for additional notes...',
    },
    alerts: {
      deleteTitle: 'Delete cost center?',
      deleteDesc: 'This action cannot be undone. Cost center related data will be deleted.',
      successSave: 'Cost center added successfully',
      successUpdate: 'Cost center updated successfully',
      successDelete: 'Cost center deleted successfully',
      errorSave: 'Failed to save cost center',
      errorDelete: 'Failed to delete cost center',
    },
    validation: {
      codeMin: 'Code must be at least 2 characters',
      nameMin: 'Name must be at least 3 characters',
      categoryRequired: 'Category is required for top-level centers',
      corporateRequired: 'Corporate is required',
    },
  },
};
