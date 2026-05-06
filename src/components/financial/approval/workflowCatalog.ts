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
];

export const WORKFLOW_ACTIONS = ['create', 'edit', 'delete'] as const;
export type WorkflowAction = typeof WORKFLOW_ACTIONS[number];
