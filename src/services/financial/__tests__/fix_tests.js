import fs from 'fs';

const filePath = 'd:\\Projects\\Financial Dashboard\\source-code\\src\\services\\financial\\__tests__\\pbt.properties.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix generateConsolidatedReport('2025-01')
content = content.replace(/generateConsolidatedReport\('2025-01'\)/g, "generateConsolidatedReport('2025-01', { scope: 'system', corporateIds: [] })");

// Fix generateConsolidatedReport('2025-12') - for line 639 (if it was already changed by me to a weird state, let's catch it)
content = content.replace(/generateConsolidatedReport\({ scope: 'system', corporateIds: \[\], departmentIds: \[\] \}, '2025-12'\)/g, "generateConsolidatedReport('2025-12', { scope: 'system', corporateIds: [] })");

// Fix getIndustryBenchmarkComparison with departmentIds
content = content.replace(/getIndustryBenchmarkComparison\({ scope: 'system', corporateIds: \[\], departmentIds: \[\] }\)/g, "getIndustryBenchmarkComparison({ scope: 'system', corporateIds: [] })");

fs.writeFileSync(filePath, content);
console.log('Fixed pbt.properties.test.ts');
