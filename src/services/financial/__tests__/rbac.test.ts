import { describe, it, expect } from 'vitest';
import { hasPermission } from '../../../middleware/frsRbac';
import Database from 'better-sqlite3';
import { initFinancialRatioSchema } from '../../../db/initFinancialRatio';
import { checkSubsidiaryAccess } from '../../../middleware/frsRbac';

describe('hasPermission', () => {
  it('owner has full access to all resources', () => {
    expect(hasPermission('owner', 'subsidiaries', 'read')).toBe(true);
    expect(hasPermission('owner', 'subsidiaries', 'write')).toBe(true);
    expect(hasPermission('owner', 'subsidiaries', 'delete')).toBe(true);
    expect(hasPermission('owner', 'users', 'manage_users')).toBe(true);
    expect(hasPermission('owner', 'thresholds', 'configure')).toBe(true);
  });

  it('bod has read-only access, no user management', () => {
    expect(hasPermission('bod', 'subsidiaries', 'read')).toBe(true);
    expect(hasPermission('bod', 'financial_data', 'read')).toBe(true);
    expect(hasPermission('bod', 'users', 'manage_users')).toBe(false);
    expect(hasPermission('bod', 'thresholds', 'configure')).toBe(false);
    expect(hasPermission('bod', 'subsidiaries', 'delete')).toBe(false);
  });

  it('subsidiary_manager has limited access', () => {
    expect(hasPermission('subsidiary_manager', 'financial_data', 'read')).toBe(true);
    expect(hasPermission('subsidiary_manager', 'financial_data', 'write')).toBe(true);
    expect(hasPermission('subsidiary_manager', 'users', 'manage_users')).toBe(false);
    expect(hasPermission('subsidiary_manager', 'subsidiaries', 'delete')).toBe(false);
  });
});

describe('checkSubsidiaryAccess', () => {
  it('returns false when user has no access', () => {
    const db = new Database(':memory:');
    initFinancialRatioSchema(db);
    expect(checkSubsidiaryAccess(db, 'user1', 'sub1')).toBe(false);
    db.close();
  });

  it('returns true when access is granted', () => {
    const db = new Database(':memory:');
    initFinancialRatioSchema(db);

    // Create a subsidiary and user, then grant access
    db.prepare(`INSERT INTO subsidiaries (id, name, industry_sector, fiscal_year_start_month, currency, tax_rate, created_by)
      VALUES ('sub1', 'Test Sub', 'Manufacturing', 1, 'IDR', 0.25, 'owner1')`).run();
    db.prepare(`INSERT INTO frs_users (id, username, email, password_hash, role, full_name)
      VALUES ('user1', 'mgr1', 'mgr1@test.com', 'hash', 'subsidiary_manager', 'Manager One')`).run();
    db.prepare(`INSERT INTO frs_user_subsidiary_access (id, user_id, subsidiary_id, granted_by)
      VALUES ('acc1', 'user1', 'sub1', 'owner1')`).run();

    expect(checkSubsidiaryAccess(db, 'user1', 'sub1')).toBe(true);
    db.close();
  });
});
