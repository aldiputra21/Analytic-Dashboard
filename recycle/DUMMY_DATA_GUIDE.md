# Dummy Data Guide

## Overview

Sistem Financial Ratio Monitoring dilengkapi dengan comprehensive dummy data untuk testing dan demonstration purposes.

## Data Coverage

### Time Period
- **Start Date:** 2024-01-01
- **End Date:** 2026-12-31
- **Total Periods:** 36 months (3 years)
- **Frequency:** Monthly data

### Companies

| Company ID | Company Name | Industry | Color | Characteristics |
|------------|--------------|----------|-------|-----------------|
| ASI | PT Asia Serv Indonesia | Industrial | #0f172a (Dark Slate) | Steady growth, stable margins |
| TSI | PT Titian Servis Indonesia | Services | #334155 (Slate) | Moderate growth, consistent performance |
| SUB3 | PT Subsidiary Three | Technology | #7c3aed (Purple) | High growth, volatile margins |
| SUB4 | PT Subsidiary Four | Manufacturing | #059669 (Green) | Stable, predictable performance |
| SUB5 | PT Subsidiary Five | Retail | #dc2626 (Red) | Volatile, seasonal patterns |

### Total Records
- **5 companies** × **36 periods** = **180 financial records**

## Data Generation Logic

### Revenue Patterns

#### ASI (Industrial)
```typescript
baseRevenue = 1,000,000 + (monthIndex * 50,000) + random(0-100,000)
profitMargin = 15% + random(0-5%)
```
- Steady linear growth
- Consistent profit margins
- Low volatility

#### TSI (Services)
```typescript
baseRevenue = 800,000 + (monthIndex * 60,000) + random(0-80,000)
profitMargin = 12% + random(0-4%)
```
- Moderate growth rate
- Stable margins
- Medium volatility

#### SUB3 (Technology)
```typescript
baseRevenue = 600,000 + (monthIndex * 80,000) + random(0-120,000)
profitMargin = 18% + random(0-6%)
```
- High growth trajectory
- Higher profit margins
- High volatility (tech sector)

#### SUB4 (Manufacturing)
```typescript
baseRevenue = 1,200,000 + (monthIndex * 40,000) + random(0-60,000)
profitMargin = 10% + random(0-3%)
```
- Slow but steady growth
- Lower margins (capital intensive)
- Low volatility

#### SUB5 (Retail)
```typescript
baseRevenue = 900,000 + (monthIndex * 55,000) + random(0-150,000)
profitMargin = 8% + random(0-5%)
```
- Moderate growth
- Lower margins (competitive sector)
- Very high volatility (seasonal)

## Financial Metrics

### Balance Sheet Items

Each company has realistic balance sheet proportions:

**Assets:**
- Total Assets = Base + (monthIndex × growth_factor)
- Current Assets ≈ 30% of Total Assets
- Quick Assets ≈ 80% of Current Assets
- Cash ≈ 40% of Current Assets

**Liabilities:**
- Total Liabilities = Total Assets - Total Equity
- Current Liabilities ≈ 20% of Total Assets
- Short-term Debt ≈ 25% of Current Liabilities
- Long-term Debt ≈ 40% of Total Liabilities

**Equity:**
- Total Equity ≈ 60% of Total Assets (healthy leverage)

### Cash Flow

**Operating Cash Flow:**
- OCF = Revenue × (7% - 12%) depending on company
- Generally positive and growing
- Correlates with profitability

### Debt Metrics

**Interest Expense:**
- Fixed amounts per company
- Reflects debt levels

**Debt Structure:**
- Mix of short-term and long-term debt
- Realistic debt-to-equity ratios

## Calculated Ratios

The system automatically calculates these ratios from the raw data:

### Profitability Ratios
- **ROA** (Return on Assets) = (Net Profit / Total Assets) × 100
- **ROE** (Return on Equity) = (Net Profit / Total Equity) × 100
- **NPM** (Net Profit Margin) = (Net Profit / Revenue) × 100

### Leverage Ratios
- **DER** (Debt-to-Equity Ratio) = Total Liabilities / Total Equity

### Liquidity Ratios
- **Current Ratio** = Current Assets / Current Liabilities
- **Quick Ratio** = Quick Assets / Current Liabilities
- **Cash Ratio** = Cash / Current Liabilities
- **OCF Ratio** = Operating Cash Flow / Current Liabilities

### Solvency Ratios
- **DSCR** (Debt Service Coverage Ratio) = OCF / (Interest + Short-term Debt)

## Expected Ratio Ranges

### ASI (Industrial)
- ROA: 3-5%
- ROE: 8-12%
- NPM: 15-20%
- DER: 0.6-0.8x
- Current Ratio: 1.8-2.2x

### TSI (Services)
- ROA: 2.5-4%
- ROE: 7-10%
- NPM: 12-16%
- DER: 0.7-0.9x
- Current Ratio: 1.3-1.7x

### SUB3 (Technology)
- ROA: 4-7%
- ROE: 10-15%
- NPM: 18-24%
- DER: 0.5-0.7x
- Current Ratio: 1.6-2.0x

### SUB4 (Manufacturing)
- ROA: 2-3%
- ROE: 5-8%
- NPM: 10-13%
- DER: 0.7-0.9x
- Current Ratio: 1.7-2.1x

### SUB5 (Retail)
- ROA: 2-4%
- ROE: 6-10%
- NPM: 8-13%
- DER: 0.7-0.9x
- Current Ratio: 1.5-1.9x

## Seeding the Database

### Automatic Seeding
Database is automatically seeded when server starts if empty.

### Manual Seeding
```bash
npx tsx seed-data.ts
```

This will:
1. Add missing companies (SUB3, SUB4, SUB5)
2. Clear old financial data
3. Generate 180 new records (36 months × 5 companies)
4. Verify data integrity

### Verification
After seeding, check:
```bash
# View record count
sqlite3 finance.db "SELECT COUNT(*) FROM financial_statements;"

# View latest periods
sqlite3 finance.db "SELECT company_id, MAX(period) FROM financial_statements GROUP BY company_id;"

# View sample data
sqlite3 finance.db "SELECT * FROM financial_statements WHERE period = '2026-02' LIMIT 5;"
```

## Testing Scenarios

### Scenario 1: Full Date Range
- **Filter:** 2024-01 to 2026-12
- **Expected:** All 180 records visible
- **Companies:** All 5 companies

### Scenario 2: Recent Year
- **Filter:** 2025-01 to 2026-02
- **Expected:** 70 records (14 months × 5 companies)
- **Use Case:** Current year analysis

### Scenario 3: Single Company
- **Filter:** ASI only, 2025-01 to 2026-02
- **Expected:** 14 records
- **Use Case:** Deep dive analysis

### Scenario 4: Quarter Analysis
- **Filter:** 2025-Q1 (2025-01 to 2025-03)
- **Expected:** 15 records (3 months × 5 companies)
- **Use Case:** Quarterly review

### Scenario 5: Year-over-Year
- **Filter:** 2024-01 to 2024-12 vs 2025-01 to 2025-12
- **Expected:** Compare growth trends
- **Use Case:** Annual performance review

## Data Quality

### Consistency Checks
✅ All periods have data for all 5 companies
✅ No missing months in the range
✅ Financial statements balance (Assets = Equity + Liabilities)
✅ Ratios are within realistic ranges
✅ Growth trends are consistent

### Validation Rules
- Revenue > 0
- Net Profit can be negative (but rare in dummy data)
- Total Assets = Total Equity + Total Liabilities
- Current Assets < Total Assets
- Current Liabilities < Total Liabilities
- Cash < Current Assets

## Customization

### Modify Growth Rates
Edit `seed-data.ts`:
```typescript
// Increase growth rate
const baseRevASI = 1000000 + (idx * 100000); // was 50000

// Change volatility
+ (Math.random() * 200000) // was 100000
```

### Add More Companies
```typescript
const newCompany = {
  id: "SUB6",
  name: "PT Subsidiary Six",
  color: "#f59e0b",
  industry: "Finance"
};
```

### Extend Time Range
```typescript
const startDate = new Date('2023-01-01'); // was 2024-01-01
const endDate = new Date('2027-12-31');   // was 2026-12-31
```

## Troubleshooting

### Issue: No data showing in dashboard
**Solution:** Check date range filter matches data period (2024-01 to 2026-12)

### Issue: Missing companies
**Solution:** Run seed script to add SUB3, SUB4, SUB5
```bash
npx tsx seed-data.ts
```

### Issue: Inconsistent data
**Solution:** Clear and regenerate
```bash
# Stop server first
npx tsx seed-data.ts
```

### Issue: Database locked
**Solution:** Stop the server before running seed script
```bash
# Stop server (Ctrl+C)
npx tsx seed-data.ts
# Restart server
npm run dev
```

## API Endpoints

### Get All Ratios
```
GET /api/ratios?companyId=both
```
Returns all 180 calculated ratios

### Get Company Ratios
```
GET /api/ratios?companyId=ASI
```
Returns 36 ratios for ASI

### Get Financial Statements
```
GET /api/financials?companyId=TSI
```
Returns raw financial data for TSI

## Performance Notes

- **180 records** load in < 100ms
- Client-side filtering is instant
- No pagination needed for this dataset size
- Suitable for demo and testing

## Future Enhancements

### Planned Features
1. ⏳ Seasonal patterns for retail (SUB5)
2. ⏳ Economic cycle simulation
3. ⏳ Industry-specific events
4. ⏳ Merger/acquisition scenarios
5. ⏳ Crisis simulation (2024-Q2)

### Data Expansion
1. ⏳ Add 5 more companies (total 10)
2. ⏳ Extend to 5 years of data
3. ⏳ Add quarterly aggregations
4. ⏳ Add budget vs actual data
5. ⏳ Add forecast data

## Best Practices

### For Testing
- ✅ Use full date range for comprehensive testing
- ✅ Test each company individually
- ✅ Test "ALL" companies view
- ✅ Test edge cases (single month, single company)
- ✅ Verify calculations manually for sample records

### For Demos
- ✅ Start with "ALL" companies view
- ✅ Show recent 12 months (2025-03 to 2026-02)
- ✅ Highlight growth trends
- ✅ Compare high-growth (SUB3) vs stable (SUB4)
- ✅ Show filtering capabilities

### For Development
- ✅ Keep seed script updated
- ✅ Document any data structure changes
- ✅ Test with fresh database regularly
- ✅ Validate ratio calculations
- ✅ Check for data anomalies
