// i18n/project.ts
import { Locale } from './commons';

export interface ProjectCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    code: string;
    name: string;
    department: string;
    duration: string;
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
  filter: {
    allDepartments: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    corporate: string;
    department: string;
    code: string;
    name: string;
    startDate: string;
    endDate: string;
    description: string;
    status: string;
    cancel: string;
    submit: string;
    selectCorporate: string;
    selectDepartment: string;
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
  validation: {
    corporateRequired: string;
    departmentRequired: string;
    codeMin: string;
    nameMin: string;
    startDateRequired: string;
  };
}

export const projectI18n: Record<Locale, ProjectCopy> = {
  id: {
    title: 'Pengelolaan Proyek',
    subtitle: 'Kelola dan pantau proyek operasional.',
    addNew: 'Tambah Proyek',
    searchPlaceholder: 'Cari nama atau kode...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      code: 'Kode Proyek',
      name: 'Nama Proyek',
      department: 'Departemen',
      duration: 'Durasi',
      status: 'Status',
      actions: 'Aksi',
    },
    status: {
      active: 'Aktif',
      inactive: 'Nonaktif',
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Kosong',
      emptyDesc: 'Belum ada proyek yang terdaftar.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    filter: {
      allDepartments: 'Semua Departemen',
    },
    modal: {
      createTitle: 'Tambah Proyek Baru',
      editTitle: 'Edit Proyek',
      viewTitle: 'Detail Proyek',
      corporate: 'Perusahaan',
      department: 'Departemen',
      code: 'Kode Proyek',
      name: 'Nama Proyek',
      startDate: 'Tanggal Mulai',
      endDate: 'Tanggal Selesai',
      description: 'Deskripsi',
      status: 'Status',
      cancel: 'Batal',
      submit: 'Simpan',
      selectCorporate: 'Pilih Perusahaan',
      selectDepartment: 'Pilih Departemen',
      close: 'Tutup',
    },
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      deleteTitle: 'Hapus proyek?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data terkait proyek ini akan dihapus.',
      deleteConfirm: 'Ya, Hapus Proyek',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successSave: 'Proyek berhasil ditambahkan',
      successUpdate: 'Proyek berhasil diperbarui',
      successDelete: 'Proyek berhasil dihapus',
      errorSave: 'Gagal menyimpan proyek',
      errorDelete: 'Gagal menghapus proyek',
      errorFetch: 'Gagal memuat data proyek',
      errorNetwork: 'Kesalahan jaringan',
    },
    validation: {
      corporateRequired: 'Perusahaan wajib dipilih',
      departmentRequired: 'Departemen wajib dipilih',
      codeMin: 'Kode minimal 2 karakter',
      nameMin: 'Nama minimal 3 karakter',
      startDateRequired: 'Tanggal mulai wajib diisi',
    },
  },
  en: {
    title: 'Project Management',
    subtitle: 'Track and manage operational projects.',
    addNew: 'Add Project',
    searchPlaceholder: 'Search name or code...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      code: 'Project Code',
      name: 'Project Name',
      department: 'Department',
      duration: 'Duration',
      status: 'Status',
      actions: 'Actions',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Data',
      emptyDesc: 'No projects registered yet.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    filter: {
      allDepartments: 'All Departments',
    },
    modal: {
      createTitle: 'Add New Project',
      editTitle: 'Edit Project',
      viewTitle: 'Project Detail',
      corporate: 'Corporate',
      department: 'Department',
      code: 'Project Code',
      name: 'Project Name',
      startDate: 'Start Date',
      endDate: 'End Date',
      description: 'Description',
      status: 'Status',
      cancel: 'Cancel',
      submit: 'Save',
      selectCorporate: 'Select Corporate',
      selectDepartment: 'Select Department',
      close: 'Close',
    },
    alerts: {
      errorRequired: 'Please fill in all required fields',
      deleteTitle: 'Delete project?',
      deleteDesc: 'This action cannot be undone. Project related data will be deleted.',
      deleteConfirm: 'Yes, Delete Project',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successSave: 'Project added successfully',
      successUpdate: 'Project updated successfully',
      successDelete: 'Project deleted successfully',
      errorSave: 'Failed to save project',
      errorDelete: 'Failed to delete project',
      errorFetch: 'Failed to load project data',
      errorNetwork: 'Network error',
    },
    validation: {
      corporateRequired: 'Corporate is required',
      departmentRequired: 'Department is required',
      codeMin: 'Code must be at least 2 characters',
      nameMin: 'Name must be at least 3 characters',
      startDateRequired: 'Start date is required',
    },
  },
};
