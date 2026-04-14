// Data Archival Service
// PostgreSQL implementation — stub: no frs_financial_data_archive table in new schema.
// PostgreSQL supports native table partitioning for time-series archival.
// TODO: Implement partitioning-based archival if needed.

export interface ArchivalResult {
  archivedCount: number;
  errors: string[];
}

/**
 * Archives old financial data.
 * Currently a no-op: PostgreSQL archival via table partitioning not yet implemented.
 */
export async function archiveOldFinancialData(): Promise<ArchivalResult> {
  // No-op — archival will use PostgreSQL native partitioning when implemented
  return { archivedCount: 0, errors: [] };
}

/**
 * Gets archived financial data.
 * Currently returns empty array: archive table not yet implemented.
 */
export async function getArchivedData(
  _filters: {
    corporateId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<unknown[]> {
  return [];
}
