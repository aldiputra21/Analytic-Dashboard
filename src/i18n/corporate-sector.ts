// i18n/corporate-sector.ts
import { Locale } from './commons';

export interface CorporateSectorCopy {
  title: string;
  subtitle: string;
  addNew: string;
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

export const corporateSectorI18n: Record<Locale, CorporateSectorCopy> = {
  id: {
    title: 'Pengelolaan Sektor Perusahaan',
    subtitle: 'Kelola data master sektor industri perusahaan.',
    addNew: 'Tambah Sektor',
    searchPlaceholder: 'Cari kode atau label sektor...',
    tableHead: {
      code: 'Kode',
      labelId: 'Label (ID)',
      labelEn: 'Label (EN)',
    },
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data sektor perusahaan yang terdaftar.',
    },
    modal: {
      createTitle: 'Tambah Sektor Baru',
      editTitle: 'Edit Sektor',
      viewTitle: 'Detail Sektor',
      code: 'Kode',
      labelId: 'Label Bahasa Indonesia',
      labelEn: 'Label Bahasa Inggris',
    },
    alerts: {
      deleteTitle: 'Hapus sektor?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data sektor dan informasi terkait akan dihapus.',
      errorDuplicate: 'Kode sektor sudah digunakan',
    },
    validation: {
      codeMin: 'Kode minimal 2 karakter',
      labelIdRequired: 'Label (ID) wajib diisi',
      labelEnRequired: 'Label (EN) wajib diisi',
    },
  },
  en: {
    title: 'Corporate Sector Management',
    subtitle: 'Manage corporate industry sector master data.',
    addNew: 'Add Sector',
    searchPlaceholder: 'Search sector code or label...',
    tableHead: {
      code: 'Code',
      labelId: 'Label (ID)',
      labelEn: 'Label (EN)',
    },
    status: {
      empty: 'No Data',
      emptyDesc: 'No corporate sectors registered yet.',
    },
    modal: {
      createTitle: 'Add New Sector',
      editTitle: 'Edit Sector',
      viewTitle: 'Sector Detail',
      code: 'Code',
      labelId: 'Indonesian Label',
      labelEn: 'English Label',
    },
    alerts: {
      deleteTitle: 'Delete sector?',
      deleteDesc: 'This action cannot be undone. Sector data and related information will be deleted.',
      errorDuplicate: 'Sector code already in use',
    },
    validation: {
      codeMin: 'Code must be at least 2 characters',
      labelIdRequired: 'Label (ID) is required',
      labelEnRequired: 'Label (EN) is required',
    },
  },
};
