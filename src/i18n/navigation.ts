// i18n/navigation.ts - Sidebar and navigation translations
import { Locale } from './commons';

export interface NavigationCopy {
  groups: {
    main: string;
    data: string;
    corporateManagement: string;
    crm: string;
    admin: string;
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
      data: 'Input Data',
      corporateManagement: 'Pengelolaan Perusahaan',
      crm: 'CRM',
      admin: 'Admin',
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
      targets: 'Target',
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
      data: 'Data Entry',
      corporateManagement: 'Corporate Management',
      crm: 'CRM',
      admin: 'Admin',
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
      targets: 'Targets',
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
