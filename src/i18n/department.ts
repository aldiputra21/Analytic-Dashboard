// i18n/department.ts
import { Locale } from './income-statement';

export interface DepartmentCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    code: string;
    name: string;
    corporate: string;
    head: string;
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
    corporate: string;
    code: string;
    name: string;
    head: string;
    description: string;
    cancel: string;
    submit: string;
    selectCorporate: string;
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
    errorSave: string;
    errorDelete: string;
    errorFetch: string;
    errorNetwork: string;
  };
}

export const departmentI18n: Record<Locale, DepartmentCopy> = {
  id: {
    title: 'Pengelolaan Departemen',
    subtitle: 'Kelola departemen untuk setiap entitas perusahaan.',
    addNew: 'Tambah Departemen',
    searchPlaceholder: 'Cari nama atau kode...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      code: 'Kode',
      name: 'Nama Departemen',
      corporate: 'Perusahaan',
      head: 'Kepala Dept',
      status: 'Status',
      actions: 'Aksi',
    },
    status: {
      active: 'Aktif',
      inactive: 'Nonaktif',
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada departemen yang terdaftar.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    modal: {
      createTitle: 'Tambah Departemen Baru',
      editTitle: 'Edit Departemen',
      viewTitle: 'Detail Departemen',
      corporate: 'Perusahaan',
      code: 'Kode',
      name: 'Nama',
      head: 'Kepala Departemen',
      description: 'Deskripsi',
      cancel: 'Batal',
      submit: 'Simpan',
      selectCorporate: 'Pilih Perusahaan',
      close: 'Tutup',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      deleteTitle: 'Hapus departemen?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data terkait departemen ini akan dihapus.',
      deleteConfirm: 'Ya, Hapus Departemen',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Departemen berhasil ditambahkan',
      successUpdate: 'Departemen berhasil diperbarui',
      successDelete: 'Departemen berhasil dihapus',
      errorSave: 'Gagal menyimpan departemen',
      errorDelete: 'Gagal menghapus departemen',
      errorFetch: 'Gagal memuat data departemen',
      errorNetwork: 'Kesalahan jaringan',
    },
  },
  en: {
    title: 'Department Management',
    subtitle: 'Manage departments for each corporate entity.',
    addNew: 'Add Department',
    searchPlaceholder: 'Search name or code...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      code: 'Code',
      name: 'Department Name',
      corporate: 'Corporate',
      head: 'Dept Head',
      status: 'Status',
      actions: 'Actions',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Data',
      emptyDesc: 'No departments registered yet.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    modal: {
      createTitle: 'Add New Department',
      editTitle: 'Edit Department',
      viewTitle: 'Department Detail',
      corporate: 'Corporate',
      code: 'Code',
      name: 'Name',
      head: 'Department Head',
      description: 'Description',
      cancel: 'Cancel',
      submit: 'Save',
      selectCorporate: 'Select Corporate',
      close: 'Close',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      deleteTitle: 'Delete department?',
      deleteDesc: 'This action cannot be undone. Department related data will be deleted.',
      deleteConfirm: 'Yes, Delete Department',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Department added successfully',
      successUpdate: 'Department updated successfully',
      successDelete: 'Department deleted successfully',
      errorSave: 'Failed to save department',
      errorDelete: 'Failed to delete department',
      errorFetch: 'Failed to load department data',
      errorNetwork: 'Network error',
    },
  },
};
