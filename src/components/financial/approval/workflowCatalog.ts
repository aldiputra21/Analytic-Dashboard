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
  // Tambahkan modul baru di sini saat onboarding:
  // {
  //   labelId: 'Laporan Laba Rugi',
  //   labelEn: 'Income Statement',
  //   module: 'cfd',
  //   entityType: 'income_statement',
  //   viewComponent: 'IncomeStatementApprovalForm',
  //   callbacks: {
  //     create: 'handleIncomeStatementCreate',
  //     edit: 'handleIncomeStatementEdit',
  //     delete: 'handleIncomeStatementDelete',
  //   },
  // },
];

export const WORKFLOW_ACTIONS = ['create', 'edit', 'delete'] as const;
export type WorkflowAction = typeof WORKFLOW_ACTIONS[number];
