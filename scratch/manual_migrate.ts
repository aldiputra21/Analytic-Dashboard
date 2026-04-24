
import 'dotenv/config';
import { db } from '../src/db/connection';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('🚀 Manually migrating weekly_cash_flows column...');
  try {
    const tables = ['weekly_cash_flows', 'balance_sheets', 'income_statements'];

    for (const table of tables) {
      console.log(`📦 Correcting table cfd.${table}...`);
      
      // 0. Truncate table to avoid FK violations during migration
      console.log(`   Truncating cfd.${table}...`);
      await db.execute(sql.raw(`TRUNCATE TABLE cfd.${table} CASCADE;`));

      // 1. Rename column if it still exists as department_id
      const checkDept = await db.execute(sql.raw(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'cfd' AND table_name = '${table}' AND column_name = 'department_id';
      `));
      if (checkDept.rows.length > 0) {
        console.log(`   Renaming department_id to corporate_id...`);
        await db.execute(sql.raw(`ALTER TABLE cfd.${table} RENAME COLUMN department_id TO corporate_id;`));
      }

      // 2. Drop old FK pointing to departments.id
      // The FK name might vary, so we find it first
      const fkRes = await db.execute(sql.raw(`
        SELECT conname FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE n.nspname = 'cfd' AND cl.relname = '${table}' AND c.contype = 'f' AND conname LIKE '%department_id%';
      `));

      for (const fk of fkRes.rows as any[]) {
        console.log(`   Dropping old FK: ${fk.conname}...`);
        await db.execute(sql.raw(`ALTER TABLE cfd.${table} DROP CONSTRAINT "${fk.conname}";`));
      }

      // 3. Add new FK pointing to public.corporates.id
      console.log(`   Adding new FK to public.corporates(id)...`);
      await db.execute(sql.raw(`
        ALTER TABLE cfd.${table} 
        ADD CONSTRAINT "${table}_corporate_id_fkey" 
        FOREIGN KEY (corporate_id) REFERENCES public.corporates(id);
      `)).catch(e => {
        if (e.code === '42710') console.log('   ℹ️ FK already exists.');
        else throw e;
      });
      
      console.log(`   ✅ Success for cfd.${table}.`);
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
