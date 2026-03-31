import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Initializes the CRM database schema by running the migration SQL.
 * Safe to call multiple times — uses CREATE TABLE IF NOT EXISTS.
 *
 * @param db - The SQLite database instance (shared with MAFINDA)
 */
export function initCRMSchema(db: Database.Database): void {
  try {
    const migrationPath = join(__dirname, 'migrations', '001_crm_schema.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    db.exec(sql);

    // Migration 004: Add parent_customer_id column if not exists
    const columns = db.prepare("PRAGMA table_info(crm_customers)").all() as { name: string }[];
    const hasParent = columns.some(c => c.name === 'parent_customer_id');
    if (!hasParent) {
      const migration004 = readFileSync(join(__dirname, 'migrations', '004_crm_customer_hierarchy.sql'), 'utf-8');
      db.exec(migration004);
      console.log('✓ CRM customer hierarchy migration applied');
    }

    console.log('✓ CRM schema initialized');
  } catch (err) {
    console.error('✗ Failed to initialize CRM schema:', err);
    throw err;
  }
}
