// i18n/department.ts
import { Locale } from './commons';

export interface DepartmentCopy {
  title: string;
  subtitle: string;
  inputNew: string;
  searchPlaceholder: string;
  tableHead: {
    code: string;
    name: string;
    corporate: string;
    head: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    sectionTitle: string;
    corporate: string;
    selectCorporate: string;
    code: string;
    codePlaceholder: string;
    name: string;
    namePlaceholder: string;
    head: string;
    headPlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
  };
  validation: {
    corporateRequired: string;
    codeMin: string;
    nameMin: string;
  };
}

export const departmentI18n: Record<Locale, DepartmentCopy> = {
  id: {
    title: 'Manajemen Departemen',
    subtitle: 'Kelola departemen dan unit kerja perusahaan.',
    inputNew: 'Tambah Departemen',
    searchPlaceholder: 'Cari kode atau nama departemen...',
    tableHead: {
      code: 'Kode',
      name: 'Nama Departemen',
      corporate: 'Perusahaan',
      head: 'Kepala Departemen',
    },
    status: {
      empty: 'Tidak ada data departemen',
      emptyDesc: 'Belum ada data departemen yang terdaftar atau tidak ditemukan.',
    },
    modal: {
      createTitle: 'Tambah Departemen Baru',
      editTitle: 'Edit Departemen',
      viewTitle: 'Detail Departemen',
      sectionTitle: 'Informasi Departemen',
      corporate: 'Perusahaan',
      selectCorporate: 'Pilih Perusahaan',
      code: 'Kode Departemen',
      codePlaceholder: 'Misal: FIN, HRD, IT',
      name: 'Nama Departemen',
      namePlaceholder: 'Misal: Finance & Accounting',
      head: 'Kepala Departemen',
      headPlaceholder: 'Nama kepala departemen',
      description: 'Deskripsi',
      descriptionPlaceholder: 'Keterangan tambahan...',
    },
    alerts: {
      deleteTitle: 'Hapus departemen?',
      deleteDesc: 'Tindakan ini akan menghapus data departemen secara permanen. Pastikan tidak ada data terkait lainnya.',
    },
    validation: {
      corporateRequired: 'Perusahaan harus dipilih',
      codeMin: 'Kode minimal 2 karakter',
      nameMin: 'Nama minimal 3 karakter',
    },
  },
  en: {
    title: 'Department Management',
    subtitle: 'Manage company departments and work units.',
    inputNew: 'Add Department',
    searchPlaceholder: 'Search department code or name...',
    tableHead: {
      code: 'Code',
      name: 'Department Name',
      corporate: 'Corporate',
      head: 'Department Head',
    },
    status: {
      empty: 'No departments found',
      emptyDesc: 'No departments have been registered yet or no results found.',
    },
    modal: {
      createTitle: 'Add New Department',
      editTitle: 'Edit Department',
      viewTitle: 'Department Details',
      sectionTitle: 'Department Information',
      corporate: 'Corporate',
      selectCorporate: 'Select Corporate',
      code: 'Department Code',
      codePlaceholder: 'Ex: FIN, HRD, IT',
      name: 'Department Name',
      namePlaceholder: 'Ex: Finance & Accounting',
      head: 'Department Head',
      headPlaceholder: 'Name of department head',
      description: 'Description',
      descriptionPlaceholder: 'Additional information...',
    },
    alerts: {
      deleteTitle: 'Delete department?',
      deleteDesc: 'This action will permanently delete the department data. Ensure no other related data exists.',
    },
    validation: {
      corporateRequired: 'Corporate must be selected',
      codeMin: 'Code must be at least 2 characters',
      nameMin: 'Name must be at least 3 characters',
    },
  },
};
