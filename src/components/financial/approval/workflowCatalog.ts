// workflowCatalog.ts — Katalog modul yang sudah terintegrasi dengan approval system.
// Digunakan oleh ApprovalConfigManager untuk dropdown modul, auto-fill tipe entitas,
// callback handler, dan view component.
//
// Saat menambahkan modul baru ke FORM_REGISTRY, tambahkan juga entry di sini.

export interface WorkflowCatalogEntry {
  /** Label yang ditampilkan di dropdown modul */
  labelId: string;
  labelEn: string;
  /** Nilai module field di approval_workflows */
  module: string;
  /** Nilai entity_type field */
  entityType: string;
  /** View component key di FORM_REGISTRY */
  viewComponent: string;
  /** Callback handler keys per action */
  callbacks: {
    create?: string;
    edit?: string;
    delete?: string;
    upload?: string;
  };
}

export const WORKFLOW_CATALOG: WorkflowCatalogEntry[] = [
  {
    labelId: 'Neraca (Balance Sheet)',
    labelEn: 'Balance Sheet',
    module: 'cfd',
    entityType: 'balance_sheet',
    viewComponent: 'BalanceSheetApprovalForm',
    callbacks: {
      create: 'handleBalanceSheetCreate',
      edit: 'handleBalanceSheetEdit',
      delete: 'handleBalanceSheetDelete',
    },
  },

  // ── Modul Finansial ──────────────────────────────────────────────────────────

  {
    labelId: 'Laba Rugi',
    labelEn: 'Income Statement',
    module: 'cfd',
    entityType: 'income_statement',
    viewComponent: 'IncomeStatementApprovalForm',
    callbacks: {
      create: 'handleIncomeStatementCreate',
      edit: 'handleIncomeStatementEdit',
      delete: 'handleIncomeStatementDelete',
    },
  },
  {
    labelId: 'Proyeksi Laba Rugi',
    labelEn: 'Income Statement Projection',
    module: 'cfd',
    entityType: 'income_statement_projection',
    viewComponent: 'IncomeStatementProjectionApprovalForm',
    callbacks: {
      create: 'handleIncomeStatementProjectionCreate',
      edit: 'handleIncomeStatementProjectionEdit',
      delete: 'handleIncomeStatementProjectionDelete',
    },
  },
  {
    labelId: 'Arus Kas Mingguan',
    labelEn: 'Weekly Cash Flow',
    module: 'cfd',
    entityType: 'weekly_cash_flow',
    viewComponent: 'WeeklyCashFlowApprovalForm',
    callbacks: {
      create: 'handleWeeklyCashFlowCreate',
      edit: 'handleWeeklyCashFlowEdit',
      delete: 'handleWeeklyCashFlowDelete',
    },
  },
  {
    labelId: 'Realisasi',
    labelEn: 'Realization',
    module: 'cfd',
    entityType: 'realization',
    viewComponent: 'RealizationApprovalForm',
    callbacks: {
      create: 'handleRealizationCreate',
      edit: 'handleRealizationEdit',
      delete: 'handleRealizationDelete',
    },
  },
  {
    labelId: 'Proyeksi Arus Kas',
    labelEn: 'Cash Flow Projection',
    module: 'cfd',
    entityType: 'cash_flow_projection',
    viewComponent: 'CashFlowProjectionApprovalForm',
    callbacks: {
      create: 'handleCashFlowProjectionCreate',
      edit: 'handleCashFlowProjectionEdit',
      delete: 'handleCashFlowProjectionDelete',
    },
  },
  {
    labelId: 'Pinjaman Bank',
    labelEn: 'Bank Loan',
    module: 'cfd',
    entityType: 'bank_loan',
    viewComponent: 'BankLoanApprovalForm',
    callbacks: {
      create: 'handleBankLoanCreate',
      edit: 'handleBankLoanEdit',
      delete: 'handleBankLoanDelete',
    },
  },

  // ── Modul Master Data ────────────────────────────────────────────────────────

  {
    labelId: 'Perusahaan',
    labelEn: 'Corporate',
    module: 'cfd',
    entityType: 'corporate',
    viewComponent: 'CorporateApprovalForm',
    callbacks: {
      create: 'handleCorporateCreate',
      edit: 'handleCorporateEdit',
      delete: 'handleCorporateDelete',
    },
  },
  {
    labelId: 'Departemen',
    labelEn: 'Department',
    module: 'cfd',
    entityType: 'department',
    viewComponent: 'DepartmentApprovalForm',
    callbacks: {
      create: 'handleDepartmentCreate',
      edit: 'handleDepartmentEdit',
      delete: 'handleDepartmentDelete',
    },
  },
  {
    labelId: 'Cost Center',
    labelEn: 'Cost Center',
    module: 'cfd',
    entityType: 'cost_center',
    viewComponent: 'CostCenterApprovalForm',
    callbacks: {
      create: 'handleCostCenterCreate',
      edit: 'handleCostCenterEdit',
      delete: 'handleCostCenterDelete',
    },
  },
  {
    labelId: 'Proyek',
    labelEn: 'Project',
    module: 'cfd',
    entityType: 'project',
    viewComponent: 'ProjectApprovalForm',
    callbacks: {
      create: 'handleProjectCreate',
      edit: 'handleProjectEdit',
      delete: 'handleProjectDelete',
    },
  },

  // ── Upload Workflows ─────────────────────────────────────────────────────────

  // Financial Modules Upload (7)
  {
    labelId: 'Upload Neraca',
    labelEn: 'Balance Sheet Upload',
    module: 'cfd',
    entityType: 'balance_sheet_upload',
    viewComponent: 'BalanceSheetUploadApprovalForm',
    callbacks: {
      upload: 'handleBalanceSheetUpload',
    },
  },
  {
    labelId: 'Upload Laba Rugi',
    labelEn: 'Income Statement Upload',
    module: 'cfd',
    entityType: 'income_statement_upload',
    viewComponent: 'IncomeStatementUploadApprovalForm',
    callbacks: {
      upload: 'handleIncomeStatementUpload',
    },
  },
  {
    labelId: 'Upload Proyeksi Laba Rugi',
    labelEn: 'Income Statement Projection Upload',
    module: 'cfd',
    entityType: 'income_statement_projection_upload',
    viewComponent: 'IncomeStatementProjectionUploadApprovalForm',
    callbacks: {
      upload: 'handleIncomeStatementProjectionUpload',
    },
  },
  {
    labelId: 'Upload Arus Kas Mingguan',
    labelEn: 'Weekly Cash Flow Upload',
    module: 'cfd',
    entityType: 'weekly_cash_flow_upload',
    viewComponent: 'WeeklyCashFlowUploadApprovalForm',
    callbacks: {
      upload: 'handleWeeklyCashFlowUpload',
    },
  },
  {
    labelId: 'Upload Realisasi',
    labelEn: 'Realization Upload',
    module: 'cfd',
    entityType: 'realization_upload',
    viewComponent: 'RealizationUploadApprovalForm',
    callbacks: {
      upload: 'handleRealizationUpload',
    },
  },
  {
    labelId: 'Upload Proyeksi Arus Kas',
    labelEn: 'Cash Flow Projection Upload',
    module: 'cfd',
    entityType: 'cash_flow_projection_upload',
    viewComponent: 'CashFlowProjectionUploadApprovalForm',
    callbacks: {
      upload: 'handleCashFlowProjectionUpload',
    },
  },
  {
    labelId: 'Upload Pinjaman Bank',
    labelEn: 'Bank Loan Upload',
    module: 'cfd',
    entityType: 'bank_loan_upload',
    viewComponent: 'BankLoanUploadApprovalForm',
    callbacks: {
      upload: 'handleBankLoanUpload',
    },
  },

  // Master Data Modules Upload (4)
  {
    labelId: 'Upload Perusahaan',
    labelEn: 'Corporate Upload',
    module: 'cfd',
    entityType: 'corporate_upload',
    viewComponent: 'CorporateUploadApprovalForm',
    callbacks: {
      upload: 'handleCorporateUpload',
    },
  },
  {
    labelId: 'Upload Departemen',
    labelEn: 'Department Upload',
    module: 'cfd',
    entityType: 'department_upload',
    viewComponent: 'DepartmentUploadApprovalForm',
    callbacks: {
      upload: 'handleDepartmentUpload',
    },
  },
  {
    labelId: 'Upload Cost Center',
    labelEn: 'Cost Center Upload',
    module: 'cfd',
    entityType: 'cost_center_upload',
    viewComponent: 'CostCenterUploadApprovalForm',
    callbacks: {
      upload: 'handleCostCenterUpload',
    },
  },
  {
    labelId: 'Upload Proyek',
    labelEn: 'Project Upload',
    module: 'cfd',
    entityType: 'project_upload',
    viewComponent: 'ProjectUploadApprovalForm',
    callbacks: {
      upload: 'handleProjectUpload',
    },
  },
];

export const WORKFLOW_ACTIONS = ['create', 'edit', 'delete', 'upload'] as const;
export type WorkflowAction = typeof WORKFLOW_ACTIONS[number];
