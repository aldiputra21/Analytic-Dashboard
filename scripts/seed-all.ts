// scripts/seed-all.ts — Run all seed scripts in sequence
// Run with: npx tsx scripts/seed-all.ts
//
// Order:
//   1. seed-public  — roles, users, permissions, corporates, departments, projects
//   2. seed-cfd     — additional corporates (SUB3/4/5), cash flows, targets, financial statements
//   3. seed-crm     — customers, contacts, opportunities, proposals, contracts

import { execSync } from 'child_process';

const scripts = [
  'scripts/seed-public.ts',
  'scripts/seed-cfd.ts',
  'scripts/seed-crm.ts',
];

console.log('🚀 Running all seed scripts...\n');

for (const script of scripts) {
  console.log(`${'─'.repeat(60)}`);
  console.log(`▶ ${script}`);
  console.log(`${'─'.repeat(60)}`);
  execSync(`npx tsx ${script}`, { stdio: 'inherit' });
  console.log();
}

console.log('✅ All seed scripts completed successfully!');
