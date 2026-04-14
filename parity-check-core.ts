import { db } from './src/db/connection';
import { users } from './src/db/schema/public';
import { issueToken } from './src/services/financial/authService';
import { sql } from 'drizzle-orm';

const baseUrl = process.env.PARITY_BASE_URL ?? 'http://127.0.0.1:5000';

function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isClose(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

async function getOwnerToken(): Promise<string> {
  const [u] = await db.select({ id: users.id, email: users.email }).from(users).limit(1);
  if (!u) {
    throw new Error('No users found for token generation');
  }
  return issueToken({ userId: u.id, username: u.email, role: 'owner' });
}

async function getJson(path: string, token?: string): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${baseUrl}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} ${path}: ${body}`);
  }
  return res.json();
}

async function main() {
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
  const token = await getOwnerToken();

  // 1) Ratios endpoint parity (latest row)
  const apiRatios = await getJson('/api/frs/ratios?limit=1', token) as Array<Record<string, unknown>>;
  const dbRatiosRows = (await db.execute(sql`
    SELECT * FROM cfd.v_financial_ratios
    ORDER BY period DESC
    LIMIT 1
  `)).rows as Array<Record<string, unknown>>;

  if (apiRatios.length === 0 && dbRatiosRows.length === 0) {
    checks.push({ name: 'ratios', ok: true, detail: 'both empty' });
  } else if (apiRatios.length === 1 && dbRatiosRows.length === 1) {
    const a = apiRatios[0];
    const d = dbRatiosRows[0];

    const samePeriod = String(a.period ?? '') === String(d.period ?? '');
    const sameCorporate = String(a.corporateId ?? '') === String(d.corporate_id ?? '');
    const sameRoa = isClose(num(a.roa), num(d.roa));
    const sameRoe = isClose(num(a.roe), num(d.roe));
    const sameDer = isClose(num(a.der), num(d.der));

    const ok = samePeriod && sameCorporate && sameRoa && sameRoe && sameDer;
    checks.push({
      name: 'ratios',
      ok,
      detail: `period=${samePeriod}, corporate=${sameCorporate}, roa=${sameRoa}, roe=${sameRoe}, der=${sameDer}`,
    });
  } else {
    checks.push({ name: 'ratios', ok: false, detail: 'API/DB row count mismatch' });
  }

  // 2) Alerts endpoint parity (active count)
  const apiAlerts = await getJson('/api/frs/alerts?status=active', token) as Array<unknown>;
  const dbAlerts = (await db.execute(sql`
    SELECT COUNT(*)::int AS c
    FROM cfd.alerts
    WHERE status = 'active'
  `)).rows as Array<{ c: number }>;
  const alertsOk = apiAlerts.length === Number(dbAlerts[0]?.c ?? 0);
  checks.push({
    name: 'alerts',
    ok: alertsOk,
    detail: `api=${apiAlerts.length}, db=${Number(dbAlerts[0]?.c ?? 0)}`,
  });

  // 3) Reports endpoint parity (consolidated totals for latest period)
  const latestPeriodRows = (await db.execute(sql`
    SELECT MAX(period) AS p FROM cfd.v_financial_summary
  `)).rows as Array<{ p: string | null }>;
  const period = latestPeriodRows[0]?.p;

  if (!period) {
    checks.push({ name: 'reports', ok: true, detail: 'no financial summary data' });
  } else {
    const apiReport = await getJson(`/api/frs/reports/consolidated?period=${period}`, token) as Record<string, unknown>;
    const apiCons = apiReport.consolidated as Record<string, unknown>;

    const dbConsRows = (await db.execute(sql`
      SELECT
        COALESCE(SUM(vs.revenue::numeric), 0)::float8 AS revenue,
        COALESCE(SUM(vs.net_profit::numeric), 0)::float8 AS net_profit,
        COALESCE(SUM(vs.cash::numeric), 0)::float8 AS cash,
        COALESCE(SUM(vs.current_assets::numeric), 0)::float8 AS current_assets,
        COALESCE(SUM(vs.total_assets::numeric), 0)::float8 AS total_assets,
        COALESCE(SUM(vs.current_liabilities::numeric), 0)::float8 AS current_liabilities,
        COALESCE(SUM(vs.total_liabilities::numeric), 0)::float8 AS total_liabilities,
        COALESCE(SUM(vs.total_equity::numeric), 0)::float8 AS total_equity
      FROM cfd.v_financial_summary vs
      JOIN public.corporates c ON c.id = vs.corporate_id
      WHERE vs.period = ${period} AND c.is_active = true
    `)).rows as Array<Record<string, unknown>>;

    const d = dbConsRows[0] ?? {};
    const sameRevenue = isClose(num(apiCons.revenue), num(d.revenue));
    const sameProfit = isClose(num(apiCons.netProfit), num(d.net_profit));
    const sameAssets = isClose(num(apiCons.totalAssets), num(d.total_assets));
    const sameLiabilities = isClose(num(apiCons.totalLiabilities), num(d.total_liabilities));
    const sameEquity = isClose(num(apiCons.totalEquity), num(d.total_equity));
    const ok = sameRevenue && sameProfit && sameAssets && sameLiabilities && sameEquity;

    checks.push({
      name: 'reports',
      ok,
      detail: `period=${period}, revenue=${sameRevenue}, profit=${sameProfit}, assets=${sameAssets}, liabilities=${sameLiabilities}, equity=${sameEquity}`,
    });
  }

  // 4) Dashboard endpoint parity (asset composition aggregate)
  if (!period) {
    checks.push({ name: 'dashboard', ok: true, detail: 'no balance sheet data' });
  } else {
    const apiAsset = await getJson(`/api/dashboard/asset-composition?period=${period}`) as Record<string, unknown>;

    const dbAssetRows = (await db.execute(sql`
      SELECT
        COALESCE(SUM(bs.cash_and_bank + bs.accounts_receivable + bs.work_in_progress + bs.inventory + bs.prepaid_expenses), 0)::float8 AS current_assets,
        COALESCE(SUM(bs.land + bs.building + bs.equipment + bs.other_fixed_assets), 0)::float8 AS fixed_assets
      FROM cfd.balance_sheets bs
      WHERE bs.period = ${period}
    `)).rows as Array<Record<string, unknown>>;

    const d = dbAssetRows[0] ?? {};
    const currentOk = isClose(num(apiAsset.currentAssets), num(d.current_assets));
    const fixedOk = isClose(num(apiAsset.fixedAssets), num(d.fixed_assets));
    const totalOk = isClose(num(apiAsset.totalAssets), num(d.current_assets) + num(d.fixed_assets));

    checks.push({
      name: 'dashboard',
      ok: currentOk && fixedOk && totalOk,
      detail: `period=${period}, current=${currentOk}, fixed=${fixedOk}, total=${totalOk}`,
    });
  }

  const failed = checks.filter((c) => !c.ok);

  console.log('\n=== Core Endpoint Parity Check ===');
  for (const c of checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Parity check execution error:', err);
  process.exitCode = 1;
});
