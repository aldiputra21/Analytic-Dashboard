import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Initializes the Financial Ratio Monitoring System database schema.
 * Safe to call multiple times — uses CREATE TABLE IF NOT EXISTS.
 * Requirements: 11.1, 12.7
 */
export function initFinancialRatioSchema(db: Database.Database): void {
  try {
    const migrationPath = join(__dirname, 'migrations', '002_financial_ratio_schema.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    db.exec(sql);
    console.log('✓ Financial Ratio schema initialized');
    seedInitialOwner(db);
  } catch (err) {
    console.error('✗ Failed to initialize Financial Ratio schema:', err);
    throw err;
  }
}

/**
 * Seeds the initial owner user if no users exist.
 * Requirements: 9.1
 */
function seedInitialOwner(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM frs_users').get() as { count: number };
  if (count.count > 0) return;

  const ownerId = `usr_${Date.now()}`;
  const passwordHash = bcrypt.hashSync('Admin@123456', 10);

  db.prepare(`
    INSERT INTO frs_users (id, username, email, password_hash, role, full_name, is_active)
    VALUES (?, ?, ?, ?, 'owner', ?, 1)
  `).run(ownerId, 'owner', 'owner@holding.com', passwordHash, 'System Owner');

  console.log('✓ Initial owner user seeded (username: owner, password: Admin@123456)');
}
