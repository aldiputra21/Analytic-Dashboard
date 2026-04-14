import { sql } from 'drizzle-orm';
import { db } from './src/db/connection';
import { V_FINANCIAL_SUMMARY_SQL } from './src/db/views/financialSummary';
import { V_FINANCIAL_RATIOS_SQL } from './src/db/views/financialRatios';
import { FN_CALCULATE_OCF_RATIOS_SQL } from './src/db/functions/calculateOcfRatios';

async function main() {
  await db.execute(sql.raw(FN_CALCULATE_OCF_RATIOS_SQL));
  await db.execute(sql.raw(V_FINANCIAL_SUMMARY_SQL));
  await db.execute(sql.raw(V_FINANCIAL_RATIOS_SQL));
  console.log('Applied: cfd.fn_calculate_ocf_ratios, cfd.v_financial_summary, cfd.v_financial_ratios');
}

main().catch((err) => {
  console.error('Failed to apply financial views/functions:', err);
  process.exit(1);
});
