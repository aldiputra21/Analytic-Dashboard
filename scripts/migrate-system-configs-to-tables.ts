// scripts/migrate-system-configs-to-tables.ts
// Migrates data from system_configs JSON keys to dedicated master tables.
//
// Keys migrated:
//   - corporate_sectors  → public.corporate_sectors
//   - currencies         → public.currencies
//   - cost_center_categories → public.cost_center_categories
//
// Run with: npx tsx scripts/migrate-system-configs-to-tables.ts

import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/connection';
import {
  systemConfigs,
  corporateSectors,
  currencies,
  costCenterCategories,
} from '../src/db/schema/public';

const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

// ── Type definitions for system_configs JSON shapes ─────────────────────────

interface SectorEntry {
  code: string;
  label: { id: string; en: string };
}

interface CurrencyEntry {
  code: string;
  label: string;
}

interface CostCenterCategoryEntry {
  code: string;
  label: { id: string; en: string };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function readConfig<T>(key: string): Promise<T[] | null> {
  const [row] = await db
    .select({ value: systemConfigs.value })
    .from(systemConfigs)
    .where(eq(systemConfigs.key, key))
    .limit(1);

  if (!row) {
    console.warn(`   ⚠️  Key "${key}" not found in system_configs — skipping.`);
    return null;
  }

  return row.value as T[];
}

// ── Migration functions ───────────────────────────────────────────────────────

async function migrateCorporateSectors(): Promise<number> {
  console.log('\n📂 Migrating corporate_sectors...');
  const data = await readConfig<SectorEntry>('corporate_sectors');
  if (!data || data.length === 0) return 0;

  let migrated = 0;
  for (const entry of data) {
    const result = await db
      .insert(corporateSectors)
      .values({
        code: entry.code,
        labelId: entry.label.id,
        labelEn: entry.label.en,
        status: 'active',
        createdBy: SYSTEM_ACTOR_ID,
      })
      .onConflictDoNothing({ target: corporateSectors.code })
      .returning({ id: corporateSectors.id });

    if (result.length > 0) migrated++;
  }

  console.log(`   ✅ ${migrated} of ${data.length} records migrated (skipped ${data.length - migrated} duplicates)`);
  return migrated;
}

async function migrateCurrencies(): Promise<number> {
  console.log('\n💱 Migrating currencies...');
  const data = await readConfig<CurrencyEntry>('currencies');
  if (!data || data.length === 0) return 0;

  let migrated = 0;
  for (const entry of data) {
    const result = await db
      .insert(currencies)
      .values({
        code: entry.code,
        label: entry.label,
        status: 'active',
        createdBy: SYSTEM_ACTOR_ID,
      })
      .onConflictDoNothing({ target: currencies.code })
      .returning({ id: currencies.id });

    if (result.length > 0) migrated++;
  }

  console.log(`   ✅ ${migrated} of ${data.length} records migrated (skipped ${data.length - migrated} duplicates)`);
  return migrated;
}

async function migrateCostCenterCategories(): Promise<number> {
  console.log('\n🗂️  Migrating cost_center_categories...');
  const data = await readConfig<CostCenterCategoryEntry>('cost_center_categories');
  if (!data || data.length === 0) return 0;

  let migrated = 0;
  for (const entry of data) {
    const result = await db
      .insert(costCenterCategories)
      .values({
        code: entry.code,
        labelId: entry.label.id,
        labelEn: entry.label.en,
        status: 'active',
        createdBy: SYSTEM_ACTOR_ID,
      })
      .onConflictDoNothing({ target: costCenterCategories.code })
      .returning({ id: costCenterCategories.id });

    if (result.length > 0) migrated++;
  }

  console.log(`   ✅ ${migrated} of ${data.length} records migrated (skipped ${data.length - migrated} duplicates)`);
  return migrated;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting migration: system_configs → master tables');

  const sectorsCount = await migrateCorporateSectors();
  const currenciesCount = await migrateCurrencies();
  const categoriesCount = await migrateCostCenterCategories();

  const total = sectorsCount + currenciesCount + categoriesCount;
  console.log(`\n🎉 Migration complete! Total records migrated: ${total}`);
  console.log('   - corporate_sectors:      ' + sectorsCount);
  console.log('   - currencies:             ' + currenciesCount);
  console.log('   - cost_center_categories: ' + categoriesCount);

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
