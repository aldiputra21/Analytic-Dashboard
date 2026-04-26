// i18n/currency.ts
import { Locale } from './commons';

export interface CurrencyCopy {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  tableHead: {
    code: string;
    label: string;
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
    label: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
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
    searchPlaceholder: 'Cari kode atau nama mata uang...',
    tableHead: {
      code: 'Kode',
      label: 'Nama Mata Uang',
    },
    status: {
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada data mata uang yang terdaftar.',
    },
    modal: {
      createTitle: 'Tambah Mata Uang Baru',
      editTitle: 'Edit Mata Uang',
      viewTitle: 'Detail Mata Uang',
      code: 'Kode Mata Uang',
      label: 'Nama Mata Uang',
    },
    alerts: {
      deleteTitle: 'Hapus mata uang?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data mata uang dan informasi terkait akan dihapus.',
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
    searchPlaceholder: 'Search currency code or name...',
    tableHead: {
      code: 'Code',
      label: 'Currency Name',
    },
    status: {
      empty: 'No Data',
      emptyDesc: 'No currencies registered yet.',
    },
    modal: {
      createTitle: 'Add New Currency',
      editTitle: 'Edit Currency',
      viewTitle: 'Currency Detail',
      code: 'Currency Code',
      label: 'Currency Name',
    },
    alerts: {
      deleteTitle: 'Delete currency?',
      deleteDesc: 'This action cannot be undone. Currency data and related information will be deleted.',
      errorDuplicate: 'Currency code already in use',
    },
    validation: {
      codeRequired: 'Currency code is required',
      codeMin: 'Code must be at least 3 characters (e.g., USD)',
      labelRequired: 'Currency name is required',
    },
  },
};
