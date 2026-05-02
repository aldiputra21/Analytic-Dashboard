// i18n/dashboard.ts - Translations for FRS Dashboard
import { Locale } from './commons';

export interface DashboardCopy {
  title: string;
  loading: string;
  refresh: string;
  healthScores: string;
  healthScoresDesc: string;
  ratioTrends: string;
  ratioComparison: string;
  opFinancialPerformance: string;
  opFinancialPerformanceDesc: string;
  periodMonthly: string;
  periodQuarterly: string;
  periodAnnual: string;
  cfdDataLoadError: string;
  noSubsidiaries: string;
  noSubsidiariesDesc: string;
  noData: string;
  target: string;
  comparison: string;
  periodLabel: string;
  yoy: string;
  notAvailable: string;
  allCompanies: string;
  selectCompany: string;
  inactive: string;
  periods: Record<string, string>;
  healthScore: string;
  mainFilters: {
    year: string;
    periodType: string;
    quarter: string;
    semester: string;
  };
}

export const dashboardI18n: Record<Locale, DashboardCopy> = {
  id: {
    title: 'Dashboard Keuangan',
    loading: 'Memuat dashboard...',
    refresh: 'Segarkan',
    healthScores: 'Skor Kesehatan Keuangan',
    healthScoresDesc: 'Status kesehatan anak perusahaan berdasarkan rasio tertimbang',
    ratioTrends: 'Tren Rasio',
    ratioComparison: 'Perbandingan Rasio',
    opFinancialPerformance: 'Kinerja Keuangan Operasional',
    opFinancialPerformanceDesc: 'Revenue, arus kas, komposisi aset & liabilitas',
    periodMonthly: 'Bulanan',
    periodQuarterly: 'Kuartalan',
    periodAnnual: 'Tahunan',
    cfdDataLoadError: 'Sebagian data CFD gagal dimuat',
    noSubsidiaries: 'Tidak ada anak perusahaan',
    noSubsidiariesDesc: 'Tambahkan anak perusahaan untuk mulai memantau rasio keuangan',
    noData: 'Tidak ada data tersedia',
    target: 'Target',
    comparison: 'Perbandingan Anak Perusahaan',
    periodLabel: 'Periode',
    yoy: 'YoY',
    notAvailable: 'T/A',
    allCompanies: 'Semua Perusahaan',
    selectCompany: 'Pilih Perusahaan',
    inactive: 'Tidak Aktif',
    periods: {
      '3m': '3 Bulan',
      '6m': '6 Bulan',
      '1y': '1 Tahun',
      '3y': '3 Tahun',
      '5y': '5 Tahun',
    },
    healthScore: 'Skor Kesehatan',
    mainFilters: {
      year: 'Tahun',
      periodType: 'Tipe Periode',
      quarter: 'Kuartal',
      semester: 'Semester',
    },
  },
  en: {
    title: 'Financial Dashboard',
    loading: 'Loading dashboard...',
    refresh: 'Refresh',
    healthScores: 'Financial Health Scores',
    healthScoresDesc: 'Subsidiary health status based on weighted ratios',
    ratioTrends: 'Ratio Trends',
    ratioComparison: 'Ratio Comparison',
    opFinancialPerformance: 'Operational Financial Performance',
    opFinancialPerformanceDesc: 'Revenue, cash flow, asset & liability composition',
    periodMonthly: 'Monthly',
    periodQuarterly: 'Quarterly',
    periodAnnual: 'Annual',
    cfdDataLoadError: 'Some CFD data failed to load',
    noSubsidiaries: 'No subsidiaries found',
    noSubsidiariesDesc: 'Add subsidiaries to start monitoring financial ratios',
    noData: 'No data available',
    target: 'Target',
    comparison: 'Subsidiary Comparison',
    periodLabel: 'Period',
    yoy: 'YoY',
    notAvailable: 'N/A',
    allCompanies: 'All Companies',
    selectCompany: 'Select Company',
    inactive: 'Inactive',
    periods: {
      '3m': '3M',
      '6m': '6M',
      '1y': '1Y',
      '3y': '3Y',
      '5y': '5Y',
    },
    healthScore: 'Health Score',
    mainFilters: {
      year: 'Year',
      periodType: 'Period Type',
      quarter: 'Quarter',
      semester: 'Semester',
    },
  },
};
