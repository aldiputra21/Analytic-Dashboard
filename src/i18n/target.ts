// i18n/target.ts
import { Locale } from './commons';

export interface TargetCopy {
  title: string;
  subtitle: string;
  addNew: string;
  searchPlaceholder: string;
  tableHead: {
    entity: string;
    type: string;
    year: string;
  };
  types: {
    project: string;
    department: string;
  };
  filter: {
    allDepartments: string;
    allCorporates: string;
  };
  status: {
    empty: string;
    emptyDesc: string;
  };
  fields: {
    corporate: string;
    department: string;
    project: string;
    year: string;
    relatedToProject: string;
    revenueTarget: string;
    costTarget: string;
    month: string;
    amount: string;
    costCenter: string;
    notes: string;
    totalRevenue: string;
    totalCost: string;
  };
  modal: {
    createTitle: string;
    editTitle: string;
    viewTitle: string;
    contextTitle: string;
    contextDesc: string;
    selectEntity: string;
    revenueTitle: string;
    costTitle: string;
    addRow: string;
    notes: string;
    notesPlaceholder: string;
    total: string;
  };
  alerts: {
    deleteTitle: string;
    deleteDesc: string;
    duplicateMonthRevenue: string;
    duplicateMonthCost: string;
  };
  validation: {
    corporateRequired: string;
    departmentRequired: string;
    projectRequired: string;
    revenueZero: string;
    costZero: string;
    costCenterRequired: string;
    invalidValue: string;
  };
}

export const targetI18n: Record<Locale, TargetCopy> = {
  id: {
    title: 'Proyeksi Keuangan',
    subtitle: 'Kelola proyeksi pendapatan dan biaya operasional per periode.',
    addNew: 'Buat Proyeksi Baru',
    searchPlaceholder: 'Cari departemen atau proyek...',
    tableHead: {
      entity: 'Entitas',
      type: 'Tipe',
      year: 'Tahun Fiskal',
    },
    types: {
      project: 'Proyek',
      department: 'Departemen',
    },
    filter: {
      allDepartments: 'Semua Departemen',
      allCorporates: 'Semua Perusahaan',
    },
    status: {
      empty: 'Tidak ada data target',
      emptyDesc: 'Belum ada data target yang terdaftar untuk periode ini.',
    },
    fields: {
      corporate: 'Perusahaan',
      department: 'Departemen',
      project: 'Proyek',
      year: 'Tahun Proyeksi',
      relatedToProject: 'Terkait Proyek?',
      revenueTarget: 'Proyeksi Pendapatan',
      costTarget: 'Proyeksi Biaya',
      month: 'Bulan',
      amount: 'Nilai (Rp)',
      costCenter: 'Cost Center',
      notes: 'Catatan',
      totalRevenue: 'Total Tahunan Pendapatan',
      totalCost: 'Total Tahunan Biaya',
    },
    modal: {
      createTitle: 'Input Proyeksi Tahunan',
      editTitle: 'Edit Data Proyeksi',
      viewTitle: 'Detail Proyeksi Keuangan',
      contextTitle: 'Konteks Proyeksi',
      contextDesc: 'TENTUKAN DEPARTEMEN, TAHUN, DAN ASOSIASI PROYEK OPSIONAL.',
      selectEntity: 'Pilih entitas...',
      revenueTitle: 'Pendapatan',
      costTitle: 'Biaya',
      addRow: 'Tambah Baris',
      notes: 'Catatan (Opsional)',
      notesPlaceholder: 'Catatan tambahan untuk proyeksi tahunan ini...',
      total: 'Total Keseluruhan',
    },
    alerts: {
      deleteTitle: 'Hapus data proyeksi?',
      deleteDesc: 'Tindakan ini akan menghapus seluruh rincian proyeksi pendapatan dan biaya untuk entitas ini di tahun fiskal yang dipilih.',
      duplicateMonthRevenue: 'Terdapat duplikasi bulan pada rincian pendapatan',
      duplicateMonthCost: 'Terdapat duplikasi bulan pada rincian biaya',
    },
    validation: {
      corporateRequired: 'Perusahaan wajib dipilih',
      departmentRequired: 'Departemen wajib dipilih',
      projectRequired: 'Proyek wajib dipilih',
      revenueZero: 'Total pendapatan tidak boleh nol',
      costZero: 'Total biaya tidak boleh nol',
      costCenterRequired: 'Cost Center wajib dipilih',
      invalidValue: 'Nilai tidak valid',
    },
  },
  en: {
    title: 'Financial Projections',
    subtitle: 'Manage revenue and operational cost projections per period.',
    addNew: 'Create New Projection',
    searchPlaceholder: 'Search department or project...',
    tableHead: {
      entity: 'Entity',
      type: 'Type',
      year: 'Fiscal Year',
    },
    types: {
      project: 'Project',
      department: 'Department',
    },
    filter: {
      allDepartments: 'All Departments',
      allCorporates: 'All Corporates',
    },
    status: {
      empty: 'No target data found',
      emptyDesc: 'No target data has been registered for this period.',
    },
    fields: {
      corporate: 'Corporate',
      department: 'Department',
      project: 'Project',
      year: 'Fiscal Year',
      relatedToProject: 'Related to Project?',
      revenueTarget: 'Revenue Projection',
      costTarget: 'Cost Projection',
      month: 'Month',
      amount: 'Amount (IDR)',
      costCenter: 'Cost Center',
      notes: 'Notes',
      totalRevenue: 'Annual Revenue Total',
      totalCost: 'Annual Cost Total',
    },
    modal: {
      createTitle: 'Create New Projection',
      editTitle: 'Edit Projection Data',
      viewTitle: 'Financial Projection Details',
      contextTitle: 'Projection Context',
      contextDesc: 'Define the department, project (optional), and fiscal year for this target.',
      selectEntity: 'Select entity...',
      revenueTitle: 'Revenue Projection',
      costTitle: 'Cost Projection (Expenses)',
      addRow: 'Add Row',
      notes: 'Notes',
      notesPlaceholder: 'Add optional notes here...',
      total: 'Grand Total',
    },
    alerts: {
      deleteTitle: 'Delete projection data?',
      deleteDesc: 'This action will delete all revenue and cost projection details for this entity in the selected fiscal year.',
      duplicateMonthRevenue: 'Duplicate month found in revenue details',
      duplicateMonthCost: 'Duplicate month found in cost details',
    },
    validation: {
      corporateRequired: 'Corporate is required',
      departmentRequired: 'Department is required',
      projectRequired: 'Project is required',
      revenueZero: 'Total revenue cannot be zero',
      costZero: 'Total cost cannot be zero',
      costCenterRequired: 'Cost Center is required',
      invalidValue: 'Invalid value',
    },
  },
};
