// i18n/mafinda.ts - Translations for MAFINDA Dashboard and widgets
import { Locale } from './commons';

export interface MafindaCopy {
  dashboard: {
    title: string;
    description: string;
    period: string;
    periodType: string;
    historicalMonths: string;
    refresh: string;
    dataLoadError: string;
    allDepartments: string;
    allProjects: string;
    noData: string;
    noDataDesc: string;
    vsPrevPeriod: string;
    revenue: string;
    operationalCost: string;
    netProfit: string;
    totalAssets: string;
    totalEquity: string;
    totalLiabilities: string;
    assetComposition: string;
    equityLiabilityComposition: string;
    historicalTrend: string;
    revenueTarget: string;
    departmentPerformance: string;
    assetLabels: {
      current: string;
      fixed: string;
      other: string;
    };
    liabilityLabels: {
      current: string;
      longTerm: string;
      equity: string;
    };
    equityLabels: {
      current: string;
    };
    equityComponentLabels: {
      paidInCapital: string;
      retainedEarnings: string;
      other: string;
    };
    liabilityComponentLabels: {
      shortTerm: string;
      longTerm: string;
    };
    fields: {
      totalAssets: string;
      totalEquity: string;
      totalLiabilities: string;
      fixedAssets: string;
      otherAssets: string;
      retainedEarnings: string;
      otherEquity: string;
      longTerm: string;
      currentLiabilities: string;
      vsCurrentAssets: string;
      period: string;
      achievement: string;
      balanceSheetSummary: string;
      solvent: string;
      highLeverage: string;
      target: string;
      realization: string;
      fromTotal: string;
      overallAchievement: string;
      gap: string;
      total: string;
    };
    statusLabels: {
      achieved: string;
      onTrack: string;
      attention: string;
      belowTarget: string;
    };
    sortLabels: {
      achievement: string;
      realization: string;
      name: string;
    };
    viewLabels: {
      cards: string;
      table: string;
    };
    cashFlow: {
      title: string;
      cashIn: string;
      cashOut: string;
      net: string;
      totalNet: string;
      empty: string;
    };
    ranges: {
      months3: string;
      months6: string;
      year1: string;
      year2: string;
    };
    alerts: {
      limitedData: string;
    };
  };
  filters: {
    year: string;
    periodType: string;
    quarter: string;
    semester: string;
    month: string;
    quarterly: string;
    semiannual: string;
    quarters: {
      q1: string;
      q2: string;
      q3: string;
      q4: string;
    };
    semesters: {
      s1: string;
      s2: string;
    };
  };
  trends: {
    revenueProfit: string;
    assetLiability: string;
    yearlyTrend: string;
  };
  targetManager: {
    title: string;
    targetCount: string;
    department: string;
    project: string;
    setTarget: string;
    editTarget: string;
    noTargets: string;
    noTargetsDesc: string;
    entity: string;
    type: string;
    period: string;
    kind: string;
    revenueTarget: string;
    opsCostTarget: string;
    entityType: string;
    selectEntity: string;
    periodKind: string;
    monthly: string;
    quarterly: string;
    annual: string;
    update: string;
    revenueError: string;
    opsCostError: string;
    saveSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    saveError: string;
    deleteError: string;
    actions: string;
  };
  management: {
    title: string;
    subtitle: string;
    tabs: {
      departments: string;
      projects: string;
      targets: string;
    };
    errorLoad: string;
  };
}

export const mafindaI18n: Record<Locale, MafindaCopy> = {
  id: {
    dashboard: {
      title: 'Kinerja Keuangan Operasional',
      description: 'Revenue, arus kas, komposisi aset & liabilitas',
      period: 'Periode',
      periodType: 'Tipe Periode',
      historicalMonths: 'Rentang Historis',
      refresh: 'Segarkan',
      dataLoadError: 'Gagal memuat data dashboard',
      allDepartments: 'Semua Departemen',
      allProjects: 'Semua Proyek',
      noData: 'Tidak ada data untuk filter yang dipilih',
      noDataDesc: 'Coba pilih periode lain atau input data terlebih dahulu.',
      vsPrevPeriod: 'vs periode sebelumnya',
      revenue: 'Total Revenue',
      operationalCost: 'Biaya Operasional',
      netProfit: 'Laba Bersih',
      totalAssets: 'Total Aset',
      totalEquity: 'Total Ekuitas',
      totalLiabilities: 'Total Liabilitas',
      assetComposition: 'Komposisi Aset',
      equityLiabilityComposition: 'Komposisi Ekuitas & Liabilitas',
      historicalTrend: 'Tren Data Keuangan Historis',
      revenueTarget: 'Pencapaian Target Revenue',
      departmentPerformance: 'Pencapaian Performa Departemen',
      assetLabels: {
        current: 'Aset Lancar',
        fixed: 'Aset Tetap',
        other: 'Aset Lainnya',
      },
      liabilityLabels: {
        current: 'Liabilitas Lancar',
        longTerm: 'Liabilitas Jangka Panjang',
        equity: 'Ekuitas',
      },
      equityLabels: {
        current: 'Modal Disetor',
      },
      equityComponentLabels: {
        paidInCapital: 'Modal Disetor',
        retainedEarnings: 'Laba Ditahan',
        other: 'Ekuitas Lainnya',
      },
      liabilityComponentLabels: {
        shortTerm: 'Liabilitas Jangka Pendek',
        longTerm: 'Liabilitas Jangka Panjang',
      },
      fields: {
        totalAssets: 'Total Aset',
        totalEquity: 'Total Ekuitas',
        totalLiabilities: 'Total Liabilitas',
        fixedAssets: 'Aset Tetap',
        otherAssets: 'Aset Lainnya',
        retainedEarnings: 'Laba Ditahan',
        otherEquity: 'Ekuitas Lainnya',
        longTerm: 'Jangka Panjang',
        currentLiabilities: 'Liabilitas Lancar',
        vsCurrentAssets: 'vs Aset Lancar',
        period: 'Periode',
        achievement: 'Pencapaian',
        balanceSheetSummary: 'Ringkasan Posisi Keuangan',
        solvent: 'Solvent',
        highLeverage: 'Leverage Tinggi',
        target: 'Target',
        realization: 'Realisasi',
        fromTotal: '{pct}% dari total',
        overallAchievement: 'Achievement Keseluruhan',
        gap: 'Gap',
        total: 'TOTAL',
      },
      statusLabels: {
        achieved: 'Tercapai',
        onTrack: 'On Track',
        attention: 'Perlu Perhatian',
        belowTarget: 'Di Bawah Target',
      },
      sortLabels: {
        achievement: 'Achievement',
        realization: 'Realisasi',
        name: 'Nama',
      },
      viewLabels: {
        cards: 'Cards',
        table: 'Table',
      },
      cashFlow: {
        title: 'Arus Kas',
        cashIn: 'Kas Masuk',
        cashOut: 'Kas Keluar',
        net: 'Netto',
        totalNet: 'Total Arus Kas',
        empty: 'Tidak ada data arus kas untuk periode yang dipilih.',
      },
      ranges: {
        months3: '3 Bulan',
        months6: '6 Bulan',
        year1: '1 Tahun',
        year2: '2 Tahun',
      },
      alerts: {
        limitedData: 'Data terbatas — hanya {count} periode tersedia. Menampilkan data yang ada.',
      },
    },
    filters: {
      year: 'Tahun',
      periodType: 'Tipe Periode',
      quarter: 'Kuartal',
      semester: 'Semester',
      month: 'Bulan',
      quarterly: 'Kuartalan',
      semiannual: 'Semesteran',
      quarters: {
        q1: 'K1',
        q2: 'K2',
        q3: 'K3',
        q4: 'K4',
      },
      semesters: {
        s1: 'S1',
        s2: 'S2',
      },
    },
    trends: {
      revenueProfit: 'Tren Pendapatan & Laba Bersih',
      assetLiability: 'Tren Aset & Liabilitas',
      yearlyTrend: 'Perbandingan Tahunan (5 Tahun)',
    },
    targetManager: {
      title: 'Target Keuangan',
      targetCount: 'target',
      department: 'Departemen',
      project: 'Proyek',
      setTarget: 'Tetapkan Target',
      editTarget: 'Edit Target',
      noTargets: 'Belum ada target',
      noTargetsDesc: 'Tetapkan target keuangan pertama.',
      entity: 'Entitas',
      type: 'Tipe',
      period: 'Periode',
      kind: 'Jenis',
      revenueTarget: 'Target Revenue',
      opsCostTarget: 'Target Biaya Ops',
      entityType: 'Tipe Entitas',
      selectEntity: 'Pilih...',
      periodKind: 'Jenis Periode',
      monthly: 'Bulanan',
      quarterly: 'Kuartalan',
      annual: 'Tahunan',
      update: 'Perbarui',
      revenueError: 'Target revenue harus berupa angka non-negatif',
      opsCostError: 'Target biaya operasional harus berupa angka non-negatif',
      saveSuccess: 'Target berhasil disimpan',
      updateSuccess: 'Target berhasil diperbarui',
      deleteSuccess: 'Target berhasil dihapus',
      saveError: 'Gagal menyimpan target',
      deleteError: 'Gagal menghapus target',
      actions: 'Aksi',
    },
    management: {
      title: 'Manajemen Proyek & Target',
      subtitle: 'Kelola departemen, proyek, dan target',
      tabs: {
        departments: 'Departemen',
        projects: 'Proyek',
        targets: 'Target',
      },
      errorLoad: 'Gagal memuat data',
    },
  },
  en: {
    dashboard: {
      title: 'Operational Financial Performance',
      description: 'Revenue, cash flow, asset & liability composition',
      period: 'Period',
      periodType: 'Period Type',
      historicalMonths: 'Historical Range',
      refresh: 'Refresh',
      dataLoadError: 'Failed to load dashboard data',
      allDepartments: 'All Departments',
      allProjects: 'All Projects',
      noData: 'No data for the selected filters',
      noDataDesc: 'Try selecting another period or input data first.',
      vsPrevPeriod: 'vs previous period',
      revenue: 'Total Revenue',
      operationalCost: 'Operational Cost',
      netProfit: 'Net Profit',
      totalAssets: 'Total Assets',
      totalEquity: 'Total Equity',
      totalLiabilities: 'Total Liabilities',
      assetComposition: 'Asset Composition',
      equityLiabilityComposition: 'Equity & Liability Composition',
      historicalTrend: 'Historical Financial Trend',
      revenueTarget: 'Revenue Target Achievement',
      departmentPerformance: 'Department Performance Achievement',
      assetLabels: {
        current: 'Current Assets',
        fixed: 'Fixed Assets',
        other: 'Other Assets',
      },
      liabilityLabels: {
        current: 'Current Liabilities',
        longTerm: 'Long-term Liabilities',
        equity: 'Equity',
      },
      equityLabels: {
        current: 'Paid-in Capital',
      },
      equityComponentLabels: {
        paidInCapital: 'Paid-in Capital',
        retainedEarnings: 'Retained Earnings',
        other: 'Other Equity',
      },
      liabilityComponentLabels: {
        shortTerm: 'Short-term Liabilities',
        longTerm: 'Long-term Liabilities',
      },
      fields: {
        totalAssets: 'Total Assets',
        totalEquity: 'Total Equity',
        totalLiabilities: 'Total Liabilities',
        fixedAssets: 'Fixed Assets',
        otherAssets: 'Other Assets',
        retainedEarnings: 'Retained Earnings',
        otherEquity: 'Other Equity',
        longTerm: 'Long-term',
        currentLiabilities: 'Current Liabilities',
        vsCurrentAssets: 'vs Current Assets',
        period: 'Period',
        achievement: 'Achievement',
        balanceSheetSummary: 'Financial Position Summary',
        solvent: 'Solvent',
        highLeverage: 'High Leverage',
        target: 'Target',
        realization: 'Realization',
        fromTotal: '{pct}% of total',
        overallAchievement: 'Overall Achievement',
        gap: 'Gap',
        total: 'TOTAL',
      },
      statusLabels: {
        achieved: 'Achieved',
        onTrack: 'On Track',
        attention: 'Needs Attention',
        belowTarget: 'Below Target',
      },
      sortLabels: {
        achievement: 'Achievement',
        realization: 'Realization',
        name: 'Name',
      },
      viewLabels: {
        cards: 'Cards',
        table: 'Table',
      },
      cashFlow: {
        title: 'Cash Flow',
        cashIn: 'Cash In',
        cashOut: 'Cash Out',
        net: 'Net',
        totalNet: 'Net Cash Flow (total period)',
        empty: 'No cash flow data for selected filters.',
      },
      ranges: {
        months3: '3 Months',
        months6: '6 Months',
        year1: '1 Year',
        year2: '2 Years',
      },
      alerts: {
        limitedData: 'Limited data — only {count} periods available. Showing existing data.',
      },
    },
    filters: {
      year: 'Year',
      periodType: 'Period Type',
      quarter: 'Quarter',
      semester: 'Semester',
      month: 'Month',
      quarterly: 'Quarterly',
      semiannual: 'Semiannual',
      quarters: {
        q1: 'Q1',
        q2: 'Q2',
        q3: 'Q3',
        q4: 'Q4',
      },
      semesters: {
        s1: 'S1',
        s2: 'S2',
      },
    },
    trends: {
      revenueProfit: 'Revenue & Net Profit Trend',
      assetLiability: 'Asset & Liability Trend',
      yearlyTrend: '5-Year Annual Comparison',
    },
    targetManager: {
      title: 'Financial Targets',
      targetCount: 'targets',
      department: 'Department',
      project: 'Project',
      setTarget: 'Set Target',
      editTarget: 'Edit Target',
      noTargets: 'No targets yet',
      noTargetsDesc: 'Set your first financial target.',
      entity: 'Entity',
      type: 'Type',
      period: 'Period',
      kind: 'Kind',
      revenueTarget: 'Revenue Target',
      opsCostTarget: 'Ops Cost Target',
      entityType: 'Entity Type',
      selectEntity: 'Select...',
      periodKind: 'Period Kind',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annual: 'Annual',
      update: 'Update',
      revenueError: 'Revenue target must be a non-negative number',
      opsCostError: 'Operational cost target must be a non-negative number',
      saveSuccess: 'Target saved successfully',
      updateSuccess: 'Target updated successfully',
      deleteSuccess: 'Target deleted successfully',
      saveError: 'Failed to save target',
      deleteError: 'Failed to delete target',
      actions: 'Actions',
    },
    management: {
      title: 'Projects & Targets Management',
      subtitle: 'Manage departments, projects, and targets',
      tabs: {
        departments: 'Departments',
        projects: 'Projects',
        targets: 'Targets',
      },
      errorLoad: 'Failed to load data',
    },
  },
};
