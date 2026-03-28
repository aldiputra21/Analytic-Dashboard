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
    console.log('✓ CRM schema initialized');
  } catch (err) {
    console.error('✗ Failed to initialize CRM schema:', err);
    throw err;
  }
}
