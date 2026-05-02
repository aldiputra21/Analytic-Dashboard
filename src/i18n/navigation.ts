// i18n/navigation.ts - Sidebar and navigation translations
import { Locale } from './commons';

export interface NavigationCopy {
  groups: {
    main: string;
    financialStatements: string;
    cashFlow: string;
    corporateManagement: string;
    businessManagement: string;
    crm: string;
    systemAdmin: string;
  };
  menus: {
    dashboard: string;
    benchmarking: string;
    trends: string;
    reports: string;
    alerts: string;
    realizations: string;
    bankLoans: string;
    corporates: string;
    costCenters: string;
    departments: string;
    projects: string;
    targets: string;
    cashFlowProjections: string;
    users: string;
    roles: string;
    permissions: string;
    thresholds: string;
    auditLog: string;
    masterBank: string;
    corporateSectors: string;
    currencies: string;
    costCenterCategories: string;
    notificationConfigs: string;
    systemConfigs: string;
    crm: {
      dashboard: string;
      opportunities: string;
      customers: string;
      proposals: string;
      contracts: string;
      approvals: string;
      reimburse: string;
    };
  };
  user: {
    logout: string;
    profile: string;
    alertsHeader: string;
    breadcrumbCrm: string;
  };
}

export const navigationI18n: Record<Locale, NavigationCopy> = {
  id: {
    groups: {
      main: 'Analitik',
      financialStatements: 'Laporan Keuangan',
      cashFlow: 'Arus Kas',
      corporateManagement: 'Pengelolaan Perusahaan',
      businessManagement: 'Pengelolaan Bisnis',
      crm: 'CRM',
      systemAdmin: 'Pengelolaan & Monitoring Sistem',
    },
    menus: {
      dashboard: 'Dashboard',
      benchmarking: 'Benchmarking',
      trends: 'Analisis Tren',
      reports: 'Laporan',
      alerts: 'Pemberitahuan',
      realizations: 'Realisasi',
      bankLoans: 'Pinjaman Bank',
      corporates: 'Perusahaan',
      costCenters: 'Cost Center',
      departments: 'Departemen',
      projects: 'Proyek',
      targets: 'Proyeksi Laba Rugi',
      cashFlowProjections: 'Proyeksi Arus Kas',
      users: 'Pengguna',
      roles: 'Peran',
      permissions: 'Izin',
      thresholds: 'Ambang Batas',
      auditLog: 'Log Audit',
      masterBank: 'Master Bank',
      corporateSectors: 'Sektor Perusahaan',
      currencies: 'Mata Uang',
      costCenterCategories: 'Kategori Cost Center',
      notificationConfigs: 'Konfigurasi Notifikasi',
      systemConfigs: 'Konfigurasi Sistem',
      crm: {
        dashboard: 'Dashboard',
        opportunities: 'Peluang',
        customers: 'Pelanggan',
        proposals: 'Proposal',
        contracts: 'Kontrak',
        approvals: 'Persetujuan',
        reimburse: 'Reimburse',
      },
    },
    user: {
      logout: 'Keluar',
      profile: 'Profil',
      alertsHeader: '{count} Pemberitahuan',
      breadcrumbCrm: 'CRM › {page}',
    },
  },
  en: {
    groups: {
      main: 'Analytics',
      financialStatements: 'Financial Statements',
      cashFlow: 'Cash Flow',
      corporateManagement: 'Corporate Management',
      businessManagement: 'Business Management',
      crm: 'CRM',
      systemAdmin: 'System Management & Monitoring',
    },
    menus: {
      dashboard: 'Dashboard',
      benchmarking: 'Benchmarking',
      trends: 'Trend Analysis',
      reports: 'Reports',
      alerts: 'Alerts',
      realizations: 'Realizations',
      bankLoans: 'Bank Loans',
      corporates: 'Corporates',
      costCenters: 'Cost Center',
      departments: 'Departments',
      projects: 'Projects',
      targets: 'Income Statement Projection',
      cashFlowProjections: 'Cash Flow Projection',
      users: 'Users',
      roles: 'Roles',
      permissions: 'Permissions',
      thresholds: 'Thresholds',
      auditLog: 'Audit Log',
      masterBank: 'Master Bank',
      corporateSectors: 'Corporate Sectors',
      currencies: 'Currencies',
      costCenterCategories: 'Cost Center Categories',
      notificationConfigs: 'Notification Config',
      systemConfigs: 'System Config',
      crm: {
        dashboard: 'Dashboard',
        opportunities: 'Opportunities',
        customers: 'Customers',
        proposals: 'Proposals',
        contracts: 'Contracts',
        approvals: 'Approvals',
        reimburse: 'Reimburse',
      },
    },
    user: {
      logout: 'Logout',
      profile: 'Profile',
      alertsHeader: '{count} Alerts',
      breadcrumbCrm: 'CRM › {page}',
    },
  },
};
