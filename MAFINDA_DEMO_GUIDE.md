# MAFINDA Demo Guide

## Quick Start untuk Demo

### 1. Setup Database dengan Data Demo

Jalankan seed script untuk mengisi database dengan data demo:

```bash
npx tsx seed-mafinda-demo.ts
```

Script ini akan membuat:
- 12 bulan data historis (2024-01 sampai 2024-12)
- 5 projects dengan weekly cash flow (W1-W5)
- Targets untuk setiap project/period
- Beberapa pending approvals untuk demo approval workflow

### 2. Start Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

### 3. Login Credentials

Sistem memiliki 3 user default:

**Admin**
- Username: `admin`
- Password: `admin123`
- Access: Full access ke semua fitur

**Finance Analyst**
- Username: `finance`
- Password: `finance123`
- Access: Approve cash flow, manage targets, view dashboards

**Banking Officer**
- Username: `banking`
- Password: `banking123`
- Access: Input cash flow, view dashboards

## Demo Flow

### Scenario 1: Banking Officer Input Cash Flow

1. Login sebagai Banking Officer
2. Klik tab "Input Data"
3. Pilih project (contoh: "Project Alpha")
4. Pilih period (current month)
5. Pilih week (W3, W4, atau W5)
6. Input data:
   - Revenue: 10,000,000
   - Cash In: 8,000,000
   - Cash Out: 6,000,000
7. Klik "Submit for Approval"
8. Data akan masuk ke status "Pending Approval"

### Scenario 2: Finance Analyst Approval

1. Login sebagai Finance Analyst
2. Klik tab "Approval Center"
3. Lihat list pending approvals
4. Review data yang di-submit:
   - Project name
   - Period & Week
   - Revenue, Cash In, Cash Out amounts
5. Klik "Approve" untuk menyetujui
6. Atau klik "Reject" dan masukkan alasan penolakan
7. Setelah approved, data akan muncul di dashboard

### Scenario 3: View Dashboard

1. Klik tab "Dashboard"
2. Pilih company dari dropdown (ASI atau TSI)
3. Pilih period untuk melihat data periode tertentu
4. Dashboard menampilkan:
   - **Cash Position**: Total posisi kas dengan breakdown mingguan
   - **Achievement Gauge**: Speedometer menunjukkan overall achievement
   - **Department Performance**: Top dan lowest performing divisions

## Fitur-Fitur yang Bisa di-Demo

### 1. Dashboard Components

**Dashboard 1: Cash Position**
- Menampilkan total cash position
- Last updated timestamp
- Weekly breakdown per project
- Color-coded cash in (green) dan cash out (red)

**Dashboard 4: Achievement Gauge**
- Speedometer visualization
- Overall achievement percentage
- Color zones: Red (<25%), Yellow (25-75%), Green (>75%)
- Division breakdown dengan progress bars

**Dashboard 3: Department Performance**
- Top performer dengan achievement tertinggi
- Lowest performer yang perlu attention
- Target vs Actual comparison
- Achievement percentage

### 2. Weekly Cash Flow Input

**Features:**
- Project selection dropdown
- Period selector (month-based)
- Week selector (W1-W5)
- Input fields: Revenue, Cash In, Cash Out
- Notes field untuk keterangan tambahan
- Submit for approval workflow
- Form validation

**Business Rules:**
- Hanya Banking Officer yang bisa input
- Data masuk dengan status "Pending Approval"
- Tidak bisa edit setelah approved
- Unique constraint: 1 entry per project/period/week

### 3. Approval Workflow

**Features:**
- List semua pending approvals
- Filter by type (Cash Flow / Target)
- Show submitter name dan timestamp
- Display complete data untuk review
- Approve dengan notes
- Reject dengan reason
- Audit trail logging

**Business Rules:**
- Hanya Finance Analyst yang bisa approve
- Approved data langsung muncul di dashboard
- Rejected data bisa di-edit dan re-submit
- Audit log untuk semua approval actions

### 4. Period-Based Reporting

**Features:**
- Period selector (bukan month-based)
- Historical data untuk 12 bulan
- Filter by company
- Real-time data refresh

## Data Structure Demo

### Companies
- **ASI**: PT Asia Serv Indonesia
- **TSI**: PT Titian Servis Indonesia

### Divisions per Company
- **ONM**: Operational Division
- **WS**: Workshop Division

### Projects
- **ASI ONM**: Project Alpha, Project Beta
- **ASI WS**: Workshop Maintenance
- **TSI ONM**: Project Gamma
- **TSI WS**: Workshop Services

### Sample Data Ranges

**Revenue per Week**: Rp 8M - Rp 12M
**Cash In per Week**: Rp 6M - Rp 10M
**Cash Out per Week**: Rp 4M - Rp 8M
**Monthly Target**: Rp 50M - Rp 70M

## API Endpoints untuk Testing

### Get Cash Position
```bash
curl http://localhost:5000/api/dashboard/cash-position?companyId=ASI
```

### Get Achievement Gauge
```bash
curl http://localhost:5000/api/dashboard/achievement-gauge?companyId=ASI&period=2024-12
```

### Get Pending Approvals
```bash
curl http://localhost:5000/api/approvals/pending
```

### Submit Cash Flow
```bash
curl -X POST http://localhost:5000/api/cash-flow/weekly \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cf_test_1",
    "projectId": "PROJ_ASI_ONM_1",
    "period": "2024-12",
    "week": "W4",
    "revenue": 10000000,
    "cashIn": 8000000,
    "cashOut": 6000000,
    "notes": "Test data",
    "submittedBy": 1
  }'
```

### Approve Data
```bash
curl -X POST http://localhost:5000/api/approvals/cf_test_1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cash_flow",
    "approvedBy": 2,
    "notes": "Approved"
  }'
```

## Demo Tips

### 1. Persiapan Sebelum Demo
- Jalankan seed script untuk data lengkap
- Buka 2 browser windows (Banking Officer & Finance Analyst)
- Prepare beberapa sample data untuk input
- Test approval workflow terlebih dahulu

### 2. Highlight Points
- **Real-time workflow**: Submit → Approve → Dashboard update
- **Role-based access**: Different views untuk different roles
- **Period-based reporting**: Flexible period selection
- **Visual analytics**: Speedometer, progress bars, color indicators
- **Audit trail**: Complete logging untuk compliance

### 3. Common Questions & Answers

**Q: Kenapa menggunakan period bukan month?**
A: Untuk flexibility - bisa quarterly, custom periods, fiscal year yang berbeda

**Q: Bagaimana jika data di-reject?**
A: Banking Officer bisa edit dan re-submit dengan perbaikan

**Q: Apakah bisa multi-level approval?**
A: Saat ini single-level, tapi architecture support untuk multi-level di future

**Q: Bagaimana dengan data security?**
A: Role-based access control di API level, audit logging untuk semua changes

**Q: Apakah support mobile?**
A: UI responsive, tapi dedicated mobile app bisa di-develop di future

## Troubleshooting

### Database Issues
```bash
# Reset database
rm finance.db
npm run dev  # Will recreate with new schema
npx tsx seed-mafinda-demo.ts
```

### Port Already in Use
```bash
# Kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### No Data Showing
1. Check if seed script ran successfully
2. Verify company selection in dropdown
3. Check period selection
4. Open browser console for errors

## Next Steps After Demo

### Immediate Enhancements
1. Add more dashboard components (Dashboard 2, 6, 7, 8, 9)
2. Implement Target Management form
3. Add Balance Sheet & Income Statement forms
4. Create Cost Control monitoring
5. Add Revenue & Cash Flow projections

### Advanced Features
1. Email notifications untuk approvals
2. Export to Excel/PDF
3. Advanced analytics dengan charts
4. Mobile app
5. Real-time updates dengan WebSocket

## Support

Untuk pertanyaan atau issues:
1. Check MAFINDA_IMPLEMENTATION_PROGRESS.md
2. Review API documentation di server.ts
3. Check browser console untuk errors
4. Review database schema di server.ts

---

**Demo Version**: 1.0.0
**Last Updated**: 2024-01-15
**Status**: Ready for Demo
