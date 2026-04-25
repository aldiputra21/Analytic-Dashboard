import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'id';

interface Translations {
  [key: string]: string;
}

const en: Translations = {
  'nav.dashboard': 'Dashboard',
  'nav.benchmarking': 'Benchmarking',
  'nav.trends': 'Trend Analysis',
  'nav.reports': 'Reports',
  'nav.alerts': 'Alerts',
  'nav.mafinda-data-entry': 'Data Entry',
  'nav.mafinda-management': 'Management',
  'nav.crm-dashboard': 'CRM',
  'nav.crm-opportunities': 'Opportunities',
  'nav.crm-customers': 'Customers',
  'nav.crm-proposals': 'Proposals',
  'nav.crm-contracts': 'Contracts',
  'nav.crm-approvals': 'Approvals',
  'nav.crm-reimburse': 'Reimbursements',
  'nav.subsidiaries': 'Subsidiaries',
  'nav.users': 'Users',
  'nav.thresholds': 'Thresholds',
  'nav.audit-log': 'Audit Log',
  'nav.cost-control-dashboard': 'Cost Control Dashboard',
  'nav.cost-control-master': 'Master Cost Center',
  'nav.cost-control-budget': 'Budget Target Input',
  'nav.cost-control-revenue': 'Revenue Realization',
  'nav.cost-control-cost': 'Cost Realization',
  'group.main': 'Analytics',
  'group.data': 'Data Input',
  'group.mafinda': 'CFD Config',
  'group.crm': 'CRM',
  'group.cost-control': 'Cost Control',
  'group.admin': 'Administration',
  'role.owner': 'Owner',
  'role.bod': 'Board of Directors',
  'role.subsidiary_manager': 'Subsidiary Manager',
  'header.alertSingular': 'Alert',
  'header.alertPlural': 'Alerts',
  'sidebar.logout': 'Logout',
  'sidebar.subtitle': 'Corporate Finance Dashboard'
};

const id: Translations = {
  'nav.dashboard': 'Dasbor',
  'nav.benchmarking': 'Tolak Ukur',
  'nav.trends': 'Analisis Tren',
  'nav.reports': 'Laporan',
  'nav.alerts': 'Peringatan',
  'nav.mafinda-data-entry': 'Entri Data',
  'nav.mafinda-management': 'Manajemen',
  'nav.crm-dashboard': 'CRM',
  'nav.crm-opportunities': 'Peluang',
  'nav.crm-customers': 'Pelanggan',
  'nav.crm-proposals': 'Proposal',
  'nav.crm-contracts': 'Kontrak',
  'nav.crm-approvals': 'Persetujuan',
  'nav.crm-reimburse': 'Reimburse',
  'nav.subsidiaries': 'Anak Perusahaan',
  'nav.users': 'Pengguna',
  'nav.thresholds': 'Batas Ambang',
  'nav.audit-log': 'Log Audit',
  'nav.cost-control-dashboard': 'Dashboard Cost Control',
  'nav.cost-control-master': 'Master Cost Center',
  'nav.cost-control-budget': 'Input Target Budget',
  'nav.cost-control-revenue': 'Realisasi Revenue',
  'nav.cost-control-cost': 'Realisasi Biaya',
  'group.main': 'Analitik',
  'group.data': 'Input Data',
  'group.mafinda': 'Konfigurasi CFD',
  'group.crm': 'CRM',
  'group.cost-control': 'Cost Control',
  'group.admin': 'Admin',
  'role.owner': 'Pemilik',
  'role.bod': 'Dewan Direksi',
  'role.subsidiary_manager': 'Manajer Cabang',
  'header.alertSingular': 'Peringatan',
  'header.alertPlural': 'Peringatan',
  'sidebar.logout': 'Keluar',
  'sidebar.subtitle': 'Dasbor Keuangan Perusahaan'
};

const dictionaries: Record<Language, Translations> = { en, id };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('id'); // Default ke ID

  const t = (key: string, fallback?: string): string => {
    return dictionaries[language][key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
