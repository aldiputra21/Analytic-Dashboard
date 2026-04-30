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
    duplicateMonth: string;
  };
}

export const targetI18n: Record<Locale, TargetCopy> = {
  id: {
    title: 'Target Finansial',
    subtitle: 'Kelola target pendapatan dan biaya operasional per periode.',
    addNew: 'Buat Target Baru',
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
      year: 'Tahun Target',
      relatedToProject: 'Terkait Proyek?',
      revenueTarget: 'Target Pendapatan',
      costTarget: 'Target Biaya',
      month: 'Bulan',
      amount: 'Nilai (Rp)',
      costCenter: 'Cost Center',
      notes: 'Catatan',
      totalRevenue: 'Total Tahunan Pendapatan',
      totalCost: 'Total Tahunan Biaya',
    },
    modal: {
      createTitle: 'Input Target Tahunan',
      editTitle: 'Edit Data Target',
      viewTitle: 'Detail Target Finansial',
      contextTitle: 'Konteks Target',
      contextDesc: 'TENTUKAN DEPARTEMEN, TAHUN, DAN ASOSIASI PROYEK OPSIONAL.',
      selectEntity: 'Pilih entitas...',
      revenueTitle: 'Pendapatan',
      costTitle: 'Biaya',
      addRow: 'Tambah Baris',
      notes: 'Catatan (Opsional)',
      notesPlaceholder: 'Catatan tambahan untuk target tahunan ini...',
      total: 'Total Keseluruhan',
    },
    alerts: {
      deleteTitle: 'Hapus data target?',
      deleteDesc: 'Tindakan ini akan menghapus seluruh rincian target pendapatan dan biaya untuk entitas ini di tahun fiskal yang dipilih.',
      duplicateMonth: 'Terdapat duplikasi bulan pada rincian target',
    },
  },
  en: {
    title: 'Financial Targets',
    subtitle: 'Manage revenue and operational cost targets per period.',
    addNew: 'Create New Target',
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
      revenueTarget: 'Revenue Target',
      costTarget: 'Cost Target',
      month: 'Month',
      amount: 'Amount (IDR)',
      costCenter: 'Cost Center',
      notes: 'Notes',
      totalRevenue: 'Annual Revenue Total',
      totalCost: 'Annual Cost Total',
    },
    modal: {
      createTitle: 'Create New Target',
      editTitle: 'Edit Target Data',
      viewTitle: 'Financial Target Details',
      contextTitle: 'Target Context',
      contextDesc: 'Define the department, project (optional), and fiscal year for this target.',
      selectEntity: 'Select entity...',
      revenueTitle: 'Revenue Target',
      costTitle: 'Cost Target (Expenses)',
      addRow: 'Add Row',
      notes: 'Notes',
      notesPlaceholder: 'Add optional notes here...',
      total: 'Grand Total',
    },
    alerts: {
      deleteTitle: 'Delete target data?',
      deleteDesc: 'This action will delete all revenue and cost target details for this entity in the selected fiscal year.',
      duplicateMonth: 'Duplicate month found in target details',
    },
  },
};
