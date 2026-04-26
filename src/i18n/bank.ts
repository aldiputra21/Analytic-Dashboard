// i18n/bank.ts
import { Locale } from './commons';

export interface BankCopy {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  tableHead: {
    code: string;
    name: string;
    swiftCode: string;
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
    name: string;
    swiftCodeOptional: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    errorDuplicate: string;
  };
  validation: {
    codeMin: string;
    nameMin: string;
  };
}

export const bankI18n: Record<Locale, BankCopy> = {
  id: {
    title: 'Manajemen Bank',
    subtitle: 'Kelola data master bank untuk transaksi keuangan.',
    searchPlaceholder: 'Cari kode atau nama bank...',
    tableHead: {
      code: 'Kode',
      name: 'Nama Bank',
      swiftCode: 'SWIFT Code',
    },
    status: {
      empty: 'Tidak ada data bank',
      emptyDesc: 'Belum ada data bank yang terdaftar atau tidak ditemukan.',
    },
    modal: {
      createTitle: 'Tambah Bank Baru',
      editTitle: 'Edit Data Bank',
      viewTitle: 'Detail Bank',
      code: 'Kode Bank',
      name: 'Nama Lengkap Bank',
      swiftCodeOptional: 'SWIFT Code (Opsional)',
    },
    alerts: {
      deleteTitle: 'Hapus bank?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data bank akan dihapus permanen.',
      errorDuplicate: 'Kode bank sudah digunakan',
    },
    validation: {
      codeMin: 'Kode minimal 2 karakter',
      nameMin: 'Nama minimal 3 karakter',
    },
  },
  en: {
    title: 'Bank Management',
    subtitle: 'Manage bank master data for financial transactions.',
    searchPlaceholder: 'Search bank code or name...',
    tableHead: {
      code: 'Code',
      name: 'Bank Name',
      swiftCode: 'SWIFT Code',
    },
    status: {
      empty: 'No bank found',
      emptyDesc: 'No banks have been registered yet or no results found.',
    },
    modal: {
      createTitle: 'Add New Bank',
      editTitle: 'Edit Bank Data',
      viewTitle: 'Bank Details',
      code: 'Bank Code',
      name: 'Full Bank Name',
      swiftCodeOptional: 'SWIFT Code (Optional)',
    },
    alerts: {
      deleteTitle: 'Delete bank?',
      deleteDesc: 'This action cannot be undone. Bank data will be permanently deleted.',
      errorDuplicate: 'Bank code already in use',
    },
    validation: {
      codeMin: 'Code must be at least 2 characters',
      nameMin: 'Name must be at least 3 characters',
    },
  },
};
