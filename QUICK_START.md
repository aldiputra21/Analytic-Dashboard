# CFD — Quick Start Guide

## 🚀 Start in 2 Minutes

```bash
# 1. Install dependencies
npm install

# 2. Copy env and set DATABASE_URL
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection string

# 3. Push schema & seed data
npx drizzle-kit push
npx tsx init-and-seed.ts
npx tsx seed-data.ts
npx tsx seed-crm.ts

# 4. Start
npm run dev
```

Buka browser: **http://localhost:5000**

## 👤 Login Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Owner | `owner@holding.com` | `owner123` | Full access (FRS) |
| Admin | `admin@cfd.local` | `changeme` | Full access (CFD) |
| Banking | `banking@cfd.local` | `changeme` | Input cash flow |
| Finance | `finance@cfd.local` | `changeme` | Approve data |

## 📋 Demo Checklist

1. ✅ Setup database & seed data (steps above)
2. ✅ Login as Admin
3. ✅ View Dashboard (Analitik tab)
4. ✅ Input cash flow data (Input Data tab)
5. ✅ Manage departments/projects (CFD tab)
6. ✅ Explore CRM pipeline (CRM tab)

## 🎯 Key Features

- **FRS Dashboard**: Financial ratios, health score, alerts, benchmarking
- **Financial Management**: Cash flow, income statement, balance sheet input
- **CRM Pipeline**: Lead → Qualification → Tender → Proposal → Negotiation → Contract
- **Reports**: Trend analysis, consolidated reports, Excel/PDF export

## 🆕 Implementation Notes

- Excel processing now uses `exceljs`.
- Bulk import accepts `.csv` and `.xlsx` files (`.xls` is not supported).
- Notification inbox supports realtime via SSE with polling fallback.
- Permission checks use normalized permission mapping and `authz_version`-based session invalidation.
- Detail referensi: `docs/changelog/2026-04-17-security-notification-permission-refactor.md`.

## 🆘 Troubleshooting

**Server won't start?**
```bash
# Check DATABASE_URL is set correctly in .env.local
# Test connection:
npx tsx -e "import './src/db/connection'; console.log('DB OK')"
```

**No data showing?**
```bash
npx tsx init-and-seed.ts
npx tsx seed-data.ts
npx tsx seed-crm.ts
```

**Schema out of sync?**
```bash
npx drizzle-kit push
```
