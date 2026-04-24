// i18n/target.ts
import { Locale } from './balance-sheet';

export interface TargetCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  apply: string;
  clear: string;
  tableHead: {
    entity: string;
    type: string;
    description: string;
    year: string;
    actions: string;
  };
  status: {
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
  fields: {
    type: string;
    department: string;
    project: string;
    year: string;
    month: string;
    revenue: string;
    cost: string;
    revenueTarget: string;
    costTarget: string;
  };
  types: {
    department: string;
    project: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    cancel: string;
    submit: string;
    selectEntity: string;
    selectYear: string;
    addRow: string;
    total: string;
    relatedToProject: string;
    notes: string;
    notesPlaceholder: string;
    contextTitle: string;
    contextDesc: string;
  };
  filter: {
    allDepartments: string;
    allProjects: string;
  };
  months: string[];
  alerts: {
    errorRequired: string;
    deleteTitle: string;
    deleteDesc: string;
    deleteConfirm: string;
    deleteCancel: string;
    deleteDeleting: string;
    successDelete: string;
    errorDelete: string;
    successSave: string;
    errorSave: string;
    errorFetch: string;
    errorNetwork: string;
    duplicateMonth: string;
  };
}

export const targetI18n: Record<Locale, TargetCopy> = {
  id: {
    title: 'Manajemen Target',
    subtitle: 'Atur target pendapatan dan biaya tahunan untuk departemen atau proyek.',
    addNew: 'Input Target Baru',
    searchPlaceholder: 'Cari proyek...',
    apply: 'Terapkan',
    clear: 'Bersihkan',
    tableHead: {
      entity: 'Entitas',
      type: 'Tipe',
      description: 'Keterangan',
      year: 'Tahun',
      actions: 'Aksi',
    },
    status: {
      loading: 'Memuat Data...',
      submitting: 'Menyimpan...',
      empty: 'Data Target Kosong',
      emptyDesc: 'Belum ada target yang diatur atau hasil pencarian tidak ditemukan.',
    },
    pagination: {
      showing: 'Menampilkan',
      of: 'dari',
      entries: 'entri',
      rowsPerPage: 'Baris per halaman',
    },
    fields: {
      type: 'Tipe Target',
      department: 'Departemen',
      project: 'Proyek',
      year: 'Tahun Target',
      month: 'Bulan',
      revenue: 'Target Pendapatan',
      cost: 'Target Biaya',
      revenueTarget: 'Pendapatan',
      costTarget: 'Biaya',
    },
    types: {
      department: 'Departemen',
      project: 'Proyek',
    },
    modal: {
      createTitle: 'Input Target Tahunan',
      editTitle: 'Ubah Target Tahunan',
      viewTitle: 'Detail Target',
      cancel: 'Batal',
      submit: 'Simpan',
      selectEntity: 'Pilih Departemen/Proyek',
      selectYear: 'Pilih Tahun',
      addRow: 'Tambah Baris',
      total: 'Total Tahunan',
      relatedToProject: 'Terkait Proyek?',
      notes: 'Catatan (Opsional)',
      notesPlaceholder: 'Catatan tambahan untuk target tahunan ini...',
      contextTitle: 'Konteks Target',
      contextDesc: 'Tentukan departemen, tahun, dan asosiasi proyek opsional.',
    },
    filter: {
      allDepartments: 'Semua Departemen',
      allProjects: 'Semua Proyek',
    },
    months: [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ],
    alerts: {
      errorRequired: 'Mohon lengkapi semua field yang wajib diisi',
      deleteTitle: 'Hapus Target Tahunan?',
      deleteDesc: 'Semua target pendapatan dan biaya untuk entitas dan tahun ini akan dihapus.',
      deleteConfirm: 'Ya, Hapus Target Tahunan',
      deleteCancel: 'Batal',
      deleteDeleting: 'Menghapus...',
      successDelete: 'Target berhasil dihapus',
      errorDelete: 'Gagal menghapus target',
      successSave: 'Target berhasil disimpan',
      errorSave: 'Gagal menyimpan target',
      errorFetch: 'Gagal memuat data target',
      errorNetwork: 'Gagal menghubungkan ke server',
      duplicateMonth: 'Bulan sudah ada dalam daftar',
    },
  },
  en: {
    title: 'Target Management',
    subtitle: 'Set annual revenue and cost targets for departments or projects.',
    addNew: 'Input New Target',
    searchPlaceholder: 'Search project...',
    apply: 'Apply',
    clear: 'Clear',
    tableHead: {
      entity: 'Entity',
      type: 'Type',
      description: 'Description',
      year: 'Year',
      actions: 'Actions',
    },
    status: {
      loading: 'Loading Data...',
      submitting: 'Saving...',
      empty: 'No Target Data',
      emptyDesc: 'No targets set yet or no results found for your search.',
    },
    pagination: {
      showing: 'Showing',
      of: 'of',
      entries: 'entries',
      rowsPerPage: 'Rows per page',
    },
    fields: {
      type: 'Target Type',
      department: 'Department',
      project: 'Project',
      year: 'Target Year',
      month: 'Month',
      revenue: 'Revenue Target',
      cost: 'Cost Target',
      revenueTarget: 'Revenue',
      costTarget: 'Cost',
    },
    types: {
      department: 'Department',
      project: 'Project',
    },
    modal: {
      createTitle: 'Input Annual Target',
      editTitle: 'Edit Annual Target',
      viewTitle: 'Target Details',
      cancel: 'Cancel',
      submit: 'Save',
      selectEntity: 'Select Department/Project',
      selectYear: 'Select Year',
      addRow: 'Add Row',
      total: 'Annual Total',
      relatedToProject: 'Related to Project?',
      notes: 'Notes (Optional)',
      notesPlaceholder: 'Additional notes for this annual target...',
      contextTitle: 'Target Context',
      contextDesc: 'Identify the department, year, and optional project association.',
    },
    filter: {
      allDepartments: 'All Departments',
      allProjects: 'All Projects',
    },
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    alerts: {
      errorRequired: 'Please fill in all required fields',
      deleteTitle: 'Delete Annual Target?',
      deleteDesc: 'All revenue and cost targets for this entity and year will be deleted.',
      deleteConfirm: 'Yes, Delete Annual Target',
      deleteCancel: 'Cancel',
      deleteDeleting: 'Deleting...',
      successDelete: 'Target deleted successfully',
      errorDelete: 'Failed to delete target',
      successSave: 'Target saved successfully',
      errorSave: 'Failed to save target',
      errorFetch: 'Failed to load target data',
      errorNetwork: 'Failed to connect to server',
      duplicateMonth: 'Month already exists in the list',
    },
  },
};
