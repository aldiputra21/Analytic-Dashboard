# Manual Data Input Guide

## Overview
Menu Input Data Manual memungkinkan pengguna untuk memasukkan data laporan keuangan secara manual melalui form yang terstruktur dengan 3 kategori utama: Laba/Rugi, Neraca, dan Arus Kas.

## Fitur Utama

### 1. Company & Period Selection
- **Perusahaan**: Dropdown untuk memilih perusahaan (ASI, TSI, SUB3, SUB4, SUB5)
- **Tahun**: Input tahun (2020-2030)
- **Bulan**: Dropdown bulan dalam Bahasa Indonesia

### 2. Tab Laba/Rugi (Income Statement)
Form input untuk:
- Pendapatan (Revenue)
- Harga Pokok Penjualan (COGS)
- Laba Kotor (Gross Profit)
- Biaya Operasional (Operating Expenses)
- EBIT (Earnings Before Interest and Tax)
- Beban Bunga (Interest Expense)
- Pajak (Tax)
- Laba Bersih (Net Profit)

### 3. Tab Neraca (Balance Sheet)
Form input dengan grouping detail:

#### ASET LANCAR
- Kas
- Deposito
- Piutang Usaha
- Piutang Lainnya
- Uang Muka
- Pekerjaan dlm Proses
- Pjk Dibyr Dimuka
- Beban Dibyr Dimuka
- **Aset Lancar** (subtotal)

#### ASET TIDAK LANCAR
- Aset Tetap
- Aset Tak Berwujud
- Aset Lain
- **Aset Tak Lancar** (subtotal)

#### TOTAL ASET

#### KEWAJIBAN JANGKA PENDEK
- Utang Usaha
- Utang Pajak
- Utang Pembiayaan
- Beban YMHD
- Utang Bank (< 1thn)
- **Jumlah Kwjbn J.Pendek** (subtotal)

#### KEWAJIBAN JANGKA PANJANG
- Utang Pmg Saham
- Beban YMHD
- Utang Bank J.Pnjang
- Utang Pembiayaan
- Utang Lainnya
- **Jumlah Kwjbn J. Panjang** (subtotal)

#### JUMLAH KEWAJIBAN

#### EKUITAS
- Modal Saham
- Laba Ditahan Ditentukan
- Laba Ditahan Blm Ditentukan
- L/R Tahun Berjalan
- **Jumlah Ekuitas** (subtotal)

#### JUMLAH KEWAJIBAN & EKUITAS

**Balance Check**: Sistem otomatis memvalidasi bahwa Total Aset = Jumlah Kewajiban & Ekuitas
- ✓ Hijau: Neraca seimbang
- ⚠ Merah: Neraca tidak seimbang

**Visual Grouping**:
- Setiap section memiliki border dan background color berbeda
- Subtotal fields memiliki border yang lebih tebal
- Total fields memiliki highlight color (indigo untuk aset, red untuk kewajiban, green untuk ekuitas, purple untuk total)
- Icons untuk setiap section (Wallet, Building2, AlertCircle, AlertTriangle, ShieldCheck)

### 4. Tab Arus Kas (Cash Flow)
Form input untuk:
- Arus Kas Operasi (Operating Cash Flow)
- Arus Kas Investasi (Investing Cash Flow)
- Arus Kas Pendanaan (Financing Cash Flow)
- Arus Kas Bersih (Net Cash Flow)

### 5. Upload File Option
- Support untuk Excel (.xlsx, .xls) dan CSV
- Fitur ini akan segera tersedia untuk parsing otomatis

## Cara Penggunaan

### Step 1: Pilih Perusahaan dan Periode
1. Buka menu "Input Data" di sidebar
2. Pilih perusahaan dari dropdown
3. Masukkan tahun dan pilih bulan

### Step 2: Input Data per Tab
1. Klik tab yang sesuai (Laba/Rugi, Neraca, atau Arus Kas)
2. Masukkan nilai untuk setiap field
3. Untuk tab Neraca, pastikan balance check menunjukkan status hijau

### Step 3: Submit Data
1. Klik tombol "Simpan Data"
2. Sistem akan menyimpan data ke database
3. Dashboard akan otomatis refresh dengan data baru
4. Rasio keuangan akan dihitung otomatis

## Data Processing

### Auto-Calculation
Setelah data disimpan, sistem otomatis menghitung:
- ROA (Return on Assets)
- ROE (Return on Equity)
- NPM (Net Profit Margin)
- DER (Debt to Equity Ratio)
- Current Ratio
- Quick Ratio
- Cash Ratio
- OCF Ratio
- DSCR (Debt Service Coverage Ratio)

### Field Mapping
Data dari form Neraca dipetakan ke database sebagai berikut:
- **total_assets**: Total Aset
- **total_equity**: Jumlah Ekuitas
- **total_liabilities**: Jumlah Kewajiban
- **current_assets**: Aset Lancar
- **current_liabilities**: Jumlah Kewajiban Jangka Pendek
- **quick_assets**: Aset Lancar - Pekerjaan dalam Proses
- **cash**: Kas
- **short_term_debt**: Utang Bank (< 1thn)
- **long_term_debt**: Utang Bank Jangka Panjang

## API Endpoint

### POST /api/upload
Endpoint untuk menyimpan data manual input.

**Request Body:**
```json
{
  "company_id": "ASI",
  "period": "2026-03",
  "revenue": 1500000,
  "net_profit": 225000,
  "total_assets": 6000000,
  "total_equity": 3500000,
  "total_liabilities": 2500000,
  "current_assets": 1800000,
  "current_liabilities": 1000000,
  "quick_assets": 1260000,
  "cash": 360000,
  "operating_cash_flow": 150000,
  "ar_aging_90_plus": 0,
  "interest_expense": 50000,
  "short_term_debt": 300000,
  "long_term_debt": 1750000
}
```

**Response:**
```json
{
  "success": true
}
```

## Validasi

### Client-Side Validation
- Perusahaan harus dipilih sebelum submit
- Semua input harus berupa angka valid
- Balance Sheet harus seimbang (Assets = Liabilities + Equity)

### Server-Side Processing
- Data disimpan dengan INSERT OR REPLACE (update jika period sudah ada)
- Otomatis trigger recalculation untuk semua financial ratios

## UI/UX Features

### Visual Feedback
- Loading state saat submit ("Menyimpan...")
- Disabled state untuk tombol submit jika company belum dipilih
- Color-coded tabs dengan icons
- Balance check indicator untuk Neraca

### Form Design
- Responsive grid layout (1 column mobile, 2 columns desktop)
- Focus states dengan indigo ring
- Placeholder "0" untuk semua numeric inputs
- Indonesian month names untuk better UX

## Future Enhancements

### Planned Features
1. **File Upload Parser**: Otomatis parse Excel/CSV files
2. **Data Validation Rules**: Custom validation per company
3. **Bulk Import**: Import multiple periods sekaligus
4. **Template Download**: Download Excel template untuk upload
5. **Edit History**: Track changes untuk audit trail
6. **Formula Calculator**: Auto-calculate derived fields (e.g., Gross Profit = Revenue - COGS)

## Technical Implementation

### Component Structure
```
ManualDataInput
├── Company & Period Selection
├── Tab Navigation (Income, Balance, Cashflow)
├── Form Fields per Tab
├── Balance Check (Neraca only)
├── File Upload Option
└── Submit Button
```

### State Management
- `activeTab`: Current active tab
- `selectedCompany`: Selected company ID
- `year`, `month`: Period selection
- `incomeData`: Income statement form data
- `balanceData`: Balance sheet form data
- `cashflowData`: Cash flow form data
- `isSubmitting`: Loading state

### Integration
- Uses existing `/api/upload` endpoint
- Integrates with existing financial_statements table
- Auto-triggers ratio calculation
- Refreshes dashboard after successful submit

## Troubleshooting

### Common Issues

**Issue**: Tombol "Simpan Data" disabled
- **Solution**: Pastikan perusahaan sudah dipilih

**Issue**: Neraca tidak seimbang
- **Solution**: Periksa kembali Total Aset = Total Liabilitas + Ekuitas

**Issue**: Data tidak muncul di dashboard
- **Solution**: Refresh halaman atau periksa filter date range

**Issue**: Upload file tidak bekerja
- **Solution**: Fitur ini masih dalam development, gunakan manual input

## Related Files
- `src/App.tsx`: ManualDataInput component
- `src/types.ts`: Type definitions (IncomeStatementInput, BalanceSheetInput, CashFlowInput)
- `server.ts`: API endpoint `/api/upload`
- `ENHANCEMENT_SUMMARY.md`: Complete enhancement documentation
