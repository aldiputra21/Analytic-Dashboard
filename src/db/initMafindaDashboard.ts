import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Initializes the MAFINDA Dashboard Enhancement database schema.
 * Safe to call multiple times — uses CREATE TABLE IF NOT EXISTS.
 * Requirements: 7.6, 7.7, 7.8, 8.7, 8.8, 8.9
 */
export function initMafindaDashboardSchema(db: Database.Database): void {
  try {
    const migrationPath = join(__dirname, 'migrations', '003_mafinda_dashboard_schema.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    db.exec(sql);
    console.log('✓ MAFINDA Dashboard schema initialized');
  } catch (err) {
    console.error('✗ Failed to initialize MAFINDA Dashboard schema:', err);
    throw err;
  }
}
