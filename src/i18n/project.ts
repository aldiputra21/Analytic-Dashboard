// i18n/project.ts
import { Locale } from './commons';

export interface ProjectCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  tableHead: {
    code: string;
    name: string;
    department: string;
    duration: string;
    status: string;
  };
  filter: {
    allDepartments: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    corporate: string;
    department: string;
    selectCorporate: string;
    selectDepartment: string;
    code: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
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
    corporateRequired: string;
    departmentRequired: string;
    codeMin: string;
    nameMin: string;
    startDateRequired: string;
    endDateRequired: string;
  };
}

export const projectI18n: Record<Locale, ProjectCopy> = {
  id: {
    title: 'Manajemen Proyek',
    subtitle: 'Kelola proyek-proyek perusahaan dan alokasi departemennya.',
    addNew: 'Tambah Proyek',
    searchPlaceholder: 'Cari kode atau nama proyek...',
    tableHead: {
      code: 'Kode',
      name: 'Nama Proyek',
      department: 'Departemen',
      duration: 'Durasi',
      status: 'Status',
    },
    filter: {
      allDepartments: 'Semua Departemen',
    },
    status: {
      empty: 'Tidak ada data proyek',
      emptyDesc: 'Belum ada data proyek yang terdaftar atau tidak ditemukan.',
    },
    modal: {
      createTitle: 'Tambah Proyek Baru',
      editTitle: 'Edit Data Proyek',
      viewTitle: 'Detail Proyek',
      corporate: 'Perusahaan',
      department: 'Departemen',
      selectCorporate: 'Pilih Perusahaan',
      selectDepartment: 'Pilih Departemen',
      code: 'Kode Proyek',
      name: 'Nama Proyek',
      description: 'Deskripsi Proyek',
      startDate: 'Tanggal Mulai',
      endDate: 'Tanggal Selesai',
    },
    alerts: {
      deleteTitle: 'Hapus proyek?',
      deleteDesc: 'Tindakan ini tidak dapat dibatalkan. Data proyek akan dihapus permanen.',
      successSave: 'Proyek berhasil ditambahkan',
      successUpdate: 'Proyek berhasil diperbarui',
      successDelete: 'Proyek berhasil dihapus',
      errorSave: 'Gagal menyimpan proyek',
      errorDelete: 'Gagal menghapus proyek',
    },
    validation: {
      corporateRequired: 'Perusahaan harus dipilih',
      departmentRequired: 'Departemen harus dipilih',
      codeMin: 'Kode minimal 2 karakter',
      nameMin: 'Nama minimal 3 karakter',
      startDateRequired: 'Tanggal mulai harus diisi',
      endDateRequired: 'Tanggal selesai harus diisi',
    },
  },
  en: {
    title: 'Project Management',
    subtitle: 'Manage company projects and their department allocations.',
    addNew: 'Add New Project',
    searchPlaceholder: 'Search project code or name...',
    tableHead: {
      code: 'Code',
      name: 'Project Name',
      department: 'Department',
      duration: 'Duration',
      status: 'Status',
    },
    filter: {
      allDepartments: 'All Departments',
    },
    status: {
      empty: 'No projects found',
      emptyDesc: 'No projects have been registered yet or no results found.',
    },
    modal: {
      createTitle: 'Add New Project',
      editTitle: 'Edit Project Data',
      viewTitle: 'Project Details',
      corporate: 'Corporate',
      department: 'Department',
      selectCorporate: 'Select Corporate',
      selectDepartment: 'Select Department',
      code: 'Project Code',
      name: 'Project Name',
      description: 'Project Description',
      startDate: 'Start Date',
      endDate: 'End Date',
    },
    alerts: {
      deleteTitle: 'Delete project?',
      deleteDesc: 'This action cannot be undone. Project data will be permanently deleted.',
      successSave: 'Project added successfully',
      successUpdate: 'Project updated successfully',
      successDelete: 'Project deleted successfully',
      errorSave: 'Failed to save project',
      errorDelete: 'Failed to delete project',
    },
    validation: {
      corporateRequired: 'Corporate must be selected',
      departmentRequired: 'Department must be selected',
      codeMin: 'Code must be at least 2 characters',
      nameMin: 'Name must be at least 3 characters',
      startDateRequired: 'Start date is required',
      endDateRequired: 'End date is required',
    },
  },
};
