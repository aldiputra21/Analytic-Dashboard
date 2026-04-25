// i18n/reports.ts - Translations for Benchmarking, Trends, and Consolidated Reports
import { Locale } from './commons';

export interface ReportsCopy {
  benchmarking: {
    title: string;
    vsIndustry: string;
    hideIndustry: string;
    subsidiary: string;
    value: string;
    rank: string;
    gapBest: string;
    vsPortfolioAvg: string;
    vsIndustryAvg: string;
    portfolioAvg: string;
    empty: string;
    emptyDesc: string;
    best: string;
    ranks: Record<number, string>;
    ratioLabels: Record<string, string>;
  };
  trends: {
    title: string;
    subtitle: string;
    significantChanges: string;
    movingAvg: string;
    loading: string;
    empty: string;
    emptyDesc: string;
    footer: string;
    periods: Record<string, string>;
    ratioLabels: Record<string, string>;
  };
  consolidated: {
    title: string;
    subtitle: string;
    periodType: string;
    startDate: string;
    endDate: string;
    generate: string;
    generating: string;
    failed: string;
    empty: string;
    emptyDesc: string;
    groupTotals: string;
    subsidiariesCount: string;
    revenue: string;
    netProfit: string;
    totalAssets: string;
    totalEquity: string;
    totalLiabilities: string;
    ratios: string;
    contributions: string;
    revenueContrib: string;
    profitContrib: string;
    periods: {
      monthly: string;
      quarterly: string;
      annual: string;
    };
    ratioLabels: Record<string, string>;
  };
}

export const reportsI18n: Record<Locale, ReportsCopy> = {
  id: {
    benchmarking: {
      title: 'Benchmarking Performa',
      vsIndustry: 'vs Industri',
      hideIndustry: 'Sembunyikan Industri',
      subsidiary: 'Anak Perusahaan',
      value: 'Nilai',
      rank: 'Peringkat',
      gapBest: 'Selisih dari Terbaik',
      vsPortfolioAvg: 'vs Rata-rata Portofolio',
      vsIndustryAvg: 'vs Industri',
      portfolioAvg: 'Rata-rata Portofolio',
      empty: 'Tidak ada data benchmark',
      emptyDesc: 'Pastikan laporan keuangan sudah diunggah untuk periode yang dipilih.',
      best: 'Terbaik',
      ranks: {
        1: 'Ke-1',
        2: 'Ke-2',
        3: 'Ke-3',
        suffix: 'Ke-',
      },
      ratioLabels: {
        roa: 'ROA (%)',
        roe: 'ROE (%)',
        npm: 'NPM (%)',
        der: 'DER',
        currentRatio: 'Rasio Lancar',
        quickRatio: 'Rasio Cepat',
        cashRatio: 'Rasio Kas',
        ocfRatio: 'Rasio OCF',
        dscr: 'DSCR',
      },
    },
    trends: {
      title: 'Analisis Tren',
      subtitle: 'Visualisasi performa historis',
      significantChanges: 'perubahan signifikan',
      movingAvg: 'MA 3 Bulan',
      loading: 'Memuat tren...',
      empty: 'Tidak Ada Data Tren',
      emptyDesc: 'Data historis tidak tersedia untuk periode yang dipilih.',
      footer: 'Visualisasi data menggunakan interpolasi kubik untuk transisi tren yang halus.',
      periods: {
        '3m': '3 Bulan',
        '6m': '6 Bulan',
        '1y': '1 Tahun',
        '3y': '3 Tahun',
        '5y': '5 Tahun',
      },
      ratioLabels: {
        roa: 'ROA (%)',
        roe: 'ROE (%)',
        npm: 'NPM (%)',
        der: 'DER',
        currentRatio: 'Rasio Lancar',
        quickRatio: 'Rasio Cepat',
        cashRatio: 'Rasio Kas',
        ocfRatio: 'Rasio OCF',
        dscr: 'DSCR',
      },
    },
    consolidated: {
      title: 'Laporan Konsolidasi',
      subtitle: 'Performa agregat di seluruh anak perusahaan',
      periodType: 'Tipe Periode',
      startDate: 'Tanggal Mulai',
      endDate: 'Tanggal Selesai',
      generate: 'Buat Laporan',
      generating: 'Memproses...',
      failed: 'Gagal Membuat Laporan',
      empty: 'Laporan Belum Dibuat',
      emptyDesc: 'Pilih rentang tanggal dan klik buat laporan untuk menyusun laporan grup konsolidasi.',
      groupTotals: 'Total Grup',
      subsidiariesCount: 'Anak Perusahaan',
      revenue: 'Pendapatan',
      netProfit: 'Laba Bersih',
      totalAssets: 'Total Aset',
      totalEquity: 'Total Ekuitas',
      totalLiabilities: 'Total Liabilitas',
      ratios: 'Rasio Konsolidasi',
      contributions: 'Kontribusi Anak Perusahaan',
      revenueContrib: 'Kontrib. Pendapatan',
      profitContrib: 'Kontrib. Laba',
      periods: {
        monthly: 'Bulanan',
        quarterly: 'Triwulanan',
        annual: 'Tahunan',
      },
      ratioLabels: {
        roa: 'ROA (%)',
        roe: 'ROE (%)',
        npm: 'NPM (%)',
        der: 'DER',
        healthScore: 'Skor Kesehatan',
        currentRatio: 'Rasio Lancar',
        quickRatio: 'Rasio Cepat',
        cashRatio: 'Rasio Kas',
        ocfRatio: 'Rasio OCF',
        dscr: 'DSCR',
      },
    },
  },
  en: {
    benchmarking: {
      title: 'Performance Benchmarking',
      vsIndustry: 'vs Industry',
      hideIndustry: 'Hide Industry',
      subsidiary: 'Subsidiary',
      value: 'Value',
      rank: 'Rank',
      gapBest: 'Gap from Best',
      vsPortfolioAvg: 'vs Portfolio Avg',
      vsIndustryAvg: 'vs Industry',
      portfolioAvg: 'Portfolio Average',
      empty: 'No benchmark data available',
      emptyDesc: 'Please ensure financial statements are uploaded for the selected period.',
      best: 'Best',
      ranks: {
        1: '1st',
        2: '2nd',
        3: '3rd',
        suffix: 'th',
      },
      ratioLabels: {
        roa: 'ROA (%)',
        roe: 'ROE (%)',
        npm: 'NPM (%)',
        der: 'DER',
        currentRatio: 'Current Ratio',
        quickRatio: 'Quick Ratio',
        cashRatio: 'Cash Ratio',
        ocfRatio: 'OCF Ratio',
        dscr: 'DSCR',
      },
    },
    trends: {
      title: 'Trend Analysis',
      subtitle: 'Historical performance visualization',
      significantChanges: 'significant change',
      movingAvg: '3M MA',
      loading: 'Loading trends...',
      empty: 'No Trend Data',
      emptyDesc: 'Historical data is not available for the selected period.',
      footer: 'Data visualization uses cubic interpolation for smooth trend transitions.',
      periods: {
        '3m': '3M',
        '6m': '6M',
        '1y': '1Y',
        '3y': '3Y',
        '5y': '5Y',
      },
      ratioLabels: {
        roa: 'ROA (%)',
        roe: 'ROE (%)',
        npm: 'NPM (%)',
        der: 'DER',
        currentRatio: 'Current Ratio',
        quickRatio: 'Quick Ratio',
        cashRatio: 'Cash Ratio',
        ocfRatio: 'OCF Ratio',
        dscr: 'DSCR',
      },
    },
    consolidated: {
      title: 'Consolidated Report',
      subtitle: 'Aggregated performance across all subsidiaries',
      periodType: 'Period Type',
      startDate: 'Start Date',
      endDate: 'End Date',
      generate: 'Generate Report',
      generating: 'Generating...',
      failed: 'Generation Failed',
      empty: 'No Report Generated',
      emptyDesc: 'Select a date range and click generate to build the consolidated group statement.',
      groupTotals: 'Group Totals',
      subsidiariesCount: 'Subsidiaries',
      revenue: 'Revenue',
      netProfit: 'Net Profit',
      totalAssets: 'Total Assets',
      totalEquity: 'Total Equity',
      totalLiabilities: 'Total Liabilities',
      ratios: 'Consolidated Ratios',
      contributions: 'Subsidiary Contributions',
      revenueContrib: 'Revenue Contrib.',
      profitContrib: 'Profit Contrib.',
      periods: {
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        annual: 'Annual',
      },
      ratioLabels: {
        roa: 'ROA (%)',
        roe: 'ROE (%)',
        npm: 'NPM (%)',
        der: 'DER',
        healthScore: 'Health Score',
        currentRatio: 'Current Ratio',
        quickRatio: 'Quick Ratio',
        cashRatio: 'Cash Ratio',
        ocfRatio: 'OCF Ratio',
        dscr: 'DSCR',
      },
    },
  },
};
