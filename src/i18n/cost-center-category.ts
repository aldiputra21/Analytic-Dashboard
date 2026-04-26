// i18n/cost-center-category.ts
import { Locale } from './commons';

export interface CostCenterCategoryCopy {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  tableHead: {
    code: string;
    labelId: string;
    labelEn: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    code: string;
    labelId: string;
    labelEn: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    errorDuplicate: string;
  };
  validation: {
    codeMin: string;
    labelIdRequired: string;
    labelEnRequired: string;
  };
}

export const costCenterCategoryI18n: Record<Locale, CostCenterCategoryCopy> = {
  id: {
    title: 'Pengelolaan Kategori Cost Center',
    subtitle: 'Kelola data master kategori untuk pengelompokan cost center.',
    searchPlaceholder: 'Cari kode atau label kategori...',
    tableHead: {
      code: 'Kode',
      labelId: 'Label (ID)',
      labelEn: 'Label (EN)',
    },
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data kategori cost center yang terdaftar.',
    },
    modal: {
      createTitle: 'Tambah Kategori Baru',
      editTitle: 'Edit Kategori',
      viewTitle: 'Detail Kategori',
      code: 'Kode',
      labelId: 'Label Bahasa Indonesia',
      labelEn: 'Label Bahasa Inggris',
    },
    alerts: {
      deleteTitle: 'Hapus kategori?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data kategori dan informasi terkait akan dihapus.',
      errorDuplicate: 'Kode kategori sudah digunakan',
    },
    validation: {
      codeMin: 'Kode minimal 2 karakter',
      labelIdRequired: 'Label (ID) wajib diisi',
      labelEnRequired: 'Label (EN) wajib diisi',
    },
  },
  en: {
    title: 'Cost Center Category Management',
    subtitle: 'Manage category master data for cost center grouping.',
    searchPlaceholder: 'Search category code or label...',
    tableHead: {
      code: 'Code',
      labelId: 'Label (ID)',
      labelEn: 'Label (EN)',
    },
    status: {
      empty: 'No Data',
      emptyDesc: 'No cost center categories registered yet.',
    },
    modal: {
      createTitle: 'Add New Category',
      editTitle: 'Edit Category',
      viewTitle: 'Category Detail',
      code: 'Code',
      labelId: 'Indonesian Label',
      labelEn: 'English Label',
    },
    alerts: {
      deleteTitle: 'Delete category?',
      deleteDesc: 'This action cannot be undone. Category data and related information will be deleted.',
      errorDuplicate: 'Category code already in use',
    },
    validation: {
      codeMin: 'Code must be at least 2 characters',
      labelIdRequired: 'Label (ID) is required',
      labelEnRequired: 'Label (EN) is required',
    },
  },
};
