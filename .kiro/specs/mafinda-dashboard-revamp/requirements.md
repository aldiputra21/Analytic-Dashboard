# Requirements Document

## Introduction

MAFINDA (Management Finance Dashboard) adalah sistem dashboard keuangan yang direvamp untuk perusahaan holding dengan fokus pada monitoring cash flow mingguan, pencapaian target per divisi dan proyek, serta analisis rasio keuangan yang lebih komprehensif. Sistem ini mendukung input data periode-based (bukan bulan), tracking saldo kas mingguan (W1-W5), monitoring achievement departemen, dan approval workflow untuk data keuangan.

## Glossary

- **MAFINDA**: Management Finance Dashboard - sistem monitoring keuangan terintegrasi
- **Company**: Perusahaan dalam holding (maksimal 5 entitas)
- **Division**: Divisi dalam perusahaan (ONM untuk Operational, WS, dll)
- **Project**: Proyek yang dikelola oleh divisi tertentu
- **Period**: Periode pelaporan keuangan (menggantikan konsep bulan)
- **Week**: Minggu dalam bulan (W1, W2, W3, W4, W5)
- **Cash_Flow**: Arus kas yang terdiri dari revenue, cash in, dan cash out
- **Target**: Target keuangan yang ditetapkan per proyek atau divisi
- **Achievement**: Pencapaian aktual dibandingkan dengan target (dalam persentase)
- **Banking_Officer**: User role yang bertanggung jawab untuk input dan update saldo kas
- **Finance_Analyst**: User role yang bertanggung jawab untuk input dan update target
- **Approval_System**: Sistem persetujuan untuk data keuangan yang diinput
- **Laba_Rugi**: Laporan laba rugi per kuartal
- **Neraca**: Laporan neraca per kuartal
- **Current_Ratio**: Rasio lancar (aset lancar / kewajiban lancar)
- **DER**: Debt to Equity Ratio (total kewajiban / ekuitas)
- **ROA**: Return on Assets (laba bersih / total aset)
- **Deviation**: Deviasi antara pencapaian aktual dengan target
- **Revenue_Projection**: Proyeksi revenue berdasarkan target yang ditetapkan
- **Cost_Control**: Kontrol biaya operasional (7 kategori yang sering bocor)
- **Cash_Position**: Posisi kas akhir pada periode tertentu
- **Department_Performance**: Kinerja departemen berdasarkan achievement
- **Financial_Ratio_Group**: Kelompok rasio keuangan (likuiditas, profitabilitas, leverage)

## Requirements

### Requirement 1: Division and Project Management

**User Story:** Sebagai Finance Analyst, saya ingin mengelola divisi dan proyek dalam sistem, sehingga saya dapat mengorganisir data keuangan berdasarkan struktur organisasi.

#### Acceptance Criteria

1. THE MAFINDA SHALL support creation of Division entities with unique identifiers and names
2. WHEN a Division is created, THE MAFINDA SHALL associate it with a specific Company
3. THE MAFINDA SHALL support creation of Project entities with unique identifiers, names, and descriptions
4. WHEN a Project is created, THE MAFINDA SHALL associate it with a specific Division
5. THE MAFINDA SHALL allow Finance_Analyst to assign multiple Projects to a single Division
6. THE MAFINDA SHALL display hierarchical structure of Company → Division → Project
7. THE MAFINDA SHALL prevent deletion of Division entities that have associated Projects
8. THE MAFINDA SHALL prevent deletion of Project entities that have financial data

### Requirement 2: Period-Based Financial Data Input

**User Story:** Sebagai Finance Analyst, saya ingin memasukkan data laba rugi dan neraca berdasarkan periode (bukan bulan), sehingga sistem lebih fleksibel untuk berbagai siklus pelaporan.

#### Acceptance Criteria

1. WHEN inputting Laba_Rugi data, THE MAFINDA SHALL accept period identifier instead of month
2. THE MAFINDA SHALL automatically generate prefix for Laba_Rugi entries based on period
3. WHEN inputting Neraca data, THE MAFINDA SHALL accept period identifier instead of month
4. THE MAFINDA SHALL support quarterly reporting for both Laba_Rugi and Neraca
5. THE MAFINDA SHALL validate that period identifiers follow a consistent format
6. THE MAFINDA SHALL prevent duplicate entries for the same Company and Period combination

### Requirement 3: Enhanced Balance Sheet Structure

**User Story:** Sebagai Finance Analyst, saya ingin struktur neraca yang lebih lengkap dengan field tambahan, sehingga data keuangan lebih akurat dan komprehensif.

#### Acceptance Criteria

1. WHEN inputting Neraca data, THE MAFINDA SHALL include "Lain-lain" field under Kewajiban Jangka Pendek
2. WHEN inputting Neraca data, THE MAFINDA SHALL include "Deviden" field under Ekuitas
3. THE MAFINDA SHALL validate that total aset equals total kewajiban plus ekuitas within 0.01% tolerance
4. THE MAFINDA SHALL calculate Current_Asset (aset lancar) automatically from balance sheet components
5. THE MAFINDA SHALL calculate Current_Liability (kewajiban lancar) automatically from balance sheet components

### Requirement 4: Weekly Cash Flow Tracking

**User Story:** Sebagai Banking Officer, saya ingin memasukkan dan memperbarui data cash flow secara mingguan, sehingga monitoring arus kas lebih real-time dan akurat.

#### Acceptance Criteria

1. THE MAFINDA SHALL support weekly cash balance input for W1, W2, W3, W4, and W5
2. WHEN inputting weekly cash flow, THE MAFINDA SHALL capture revenue, cash in, and cash out values
3. THE MAFINDA SHALL allow Banking_Officer to update cash flow data for any week within the current month
4. THE MAFINDA SHALL display monthly cash flow summary using the latest week's data
5. THE MAFINDA SHALL maintain historical records of all weekly cash flow updates
6. THE MAFINDA SHALL associate each weekly cash flow entry with a specific Project and Division

### Requirement 5: Cash Flow Target Monitoring with Color Indicators

**User Story:** Sebagai Finance Analyst, saya ingin melihat indikator warna untuk cash in dan cash out berdasarkan target, sehingga saya dapat dengan cepat mengidentifikasi performa yang baik atau buruk.

#### Acceptance Criteria

1. WHEN cash in value exceeds target, THE MAFINDA SHALL display the value with green color indicator
2. WHEN cash in value is below or equal to target, THE MAFINDA SHALL display the value with red color indicator
3. WHEN cash out value is below target, THE MAFINDA SHALL display the value with green color indicator
4. WHEN cash out value is equal to or exceeds target, THE MAFINDA SHALL display the value with red color indicator
5. THE MAFINDA SHALL calculate deviation percentage between actual and target values
6. THE MAFINDA SHALL display deviation values alongside color indicators

### Requirement 6: Project Target Management

**User Story:** Sebagai Finance Analyst, saya ingin menetapkan target keuangan per proyek, sehingga saya dapat mengukur pencapaian setiap proyek terhadap target yang ditetapkan.

#### Acceptance Criteria

1. THE MAFINDA SHALL allow Finance_Analyst to input target values for each Project
2. WHEN setting targets, THE MAFINDA SHALL capture revenue target, cash in target, and cash out target
3. THE MAFINDA SHALL associate targets with specific Period and Project combinations
4. THE MAFINDA SHALL allow Finance_Analyst to update target values before the period ends
5. THE MAFINDA SHALL prevent modification of targets after the period has ended without approval
6. THE MAFINDA SHALL calculate aggregated targets at Division level from all Projects within that Division

### Requirement 7: Approval Workflow for Financial Data

**User Story:** Sebagai Finance Analyst, saya ingin sistem approval untuk data keuangan yang diinput, sehingga data yang ditampilkan di dashboard sudah terverifikasi dan akurat.

#### Acceptance Criteria

1. WHEN financial data is submitted, THE MAFINDA SHALL set its status to "Pending Approval"
2. THE MAFINDA SHALL notify designated approvers when new data requires approval
3. THE Approval_System SHALL allow authorized users to approve or reject submitted data
4. WHEN data is rejected, THE Approval_System SHALL require rejection reason and notify the submitter
5. THE MAFINDA SHALL only include approved data in dashboard calculations and reports
6. THE MAFINDA SHALL maintain audit trail of all approval actions with timestamp and approver identity
7. THE MAFINDA SHALL allow Finance_Analyst to view approval status of submitted data

### Requirement 8: Revenue Projection Based on Targets

**User Story:** Sebagai Finance Analyst, saya ingin melihat proyeksi revenue berdasarkan target yang ditetapkan, sehingga saya dapat merencanakan strategi keuangan ke depan.

#### Acceptance Criteria

1. THE MAFINDA SHALL calculate Revenue_Projection based on target values and historical achievement rates
2. THE MAFINDA SHALL display projected revenue for upcoming periods (next 3 months minimum)
3. THE MAFINDA SHALL adjust projections based on current period achievement trends
4. THE MAFINDA SHALL provide confidence intervals for revenue projections
5. THE MAFINDA SHALL allow Finance_Analyst to adjust projection parameters (growth rate, seasonality factors)
6. THE MAFINDA SHALL display variance between projected and actual revenue when actual data becomes available

### Requirement 9: Weekly Cash Flow Projection

**User Story:** Sebagai Banking Officer, saya ingin melihat proyeksi cash flow mingguan yang diupdate setiap minggu, sehingga saya dapat mengantisipasi kebutuhan kas di minggu-minggu mendatang.

#### Acceptance Criteria

1. THE MAFINDA SHALL calculate weekly cash flow projections for W1 through W5 of the current month
2. WHEN weekly actual data is entered, THE MAFINDA SHALL update projections for remaining weeks
3. THE MAFINDA SHALL use historical patterns and current trends to generate projections
4. THE MAFINDA SHALL display projected vs actual cash flow comparison for completed weeks
5. THE MAFINDA SHALL highlight weeks where projected cash position falls below minimum threshold
6. THE MAFINDA SHALL allow Banking_Officer to manually adjust projection assumptions

### Requirement 10: Cost Control Monitoring

**User Story:** Sebagai Finance Analyst, saya ingin memantau 7 kategori cost control yang sering bocor, sehingga saya dapat mengidentifikasi dan mengatasi pemborosan biaya.

#### Acceptance Criteria

1. THE MAFINDA SHALL track 7 predefined Cost_Control categories
2. WHEN actual costs exceed budgeted costs for any category, THE MAFINDA SHALL generate alert
3. THE MAFINDA SHALL calculate variance percentage for each Cost_Control category
4. THE MAFINDA SHALL display trend analysis for each cost category over time
5. THE MAFINDA SHALL rank cost categories by variance magnitude (highest overspend first)
6. THE MAFINDA SHALL allow Finance_Analyst to add notes and action plans for cost overruns
7. THE MAFINDA SHALL display cumulative cost variance across all 7 categories

### Requirement 11: Role-Based Access for Banking Officer and Finance Analyst

**User Story:** Sebagai system administrator, saya ingin mengatur hak akses berbeda untuk Banking Officer dan Finance Analyst, sehingga setiap user hanya dapat mengakses fungsi yang sesuai dengan tanggung jawabnya.

#### Acceptance Criteria

1. THE MAFINDA SHALL support Banking_Officer role with permissions to input and update cash balance data
2. THE MAFINDA SHALL support Finance_Analyst role with permissions to input and update target data
3. THE MAFINDA SHALL restrict Banking_Officer from modifying target values
4. THE MAFINDA SHALL restrict Finance_Analyst from modifying approved cash balance data
5. THE MAFINDA SHALL allow both roles to view dashboard and reports within their assigned Companies
6. THE MAFINDA SHALL log all data modifications with user role information
7. THE MAFINDA SHALL enforce role-based access control at API endpoint level

### Requirement 12: Dashboard 1 - Cash Position Overview

**User Story:** Sebagai Banking Officer, saya ingin melihat posisi kas akhir dan waktu update terakhir di dashboard utama, sehingga saya dapat dengan cepat mengetahui kondisi kas terkini.

#### Acceptance Criteria

1. THE MAFINDA SHALL display Cash_Position (posisi kas akhir) prominently on Dashboard 1
2. THE MAFINDA SHALL display last update timestamp for cash position data
3. THE MAFINDA SHALL calculate cash position from latest weekly cash flow data
4. THE MAFINDA SHALL display cash position for all Companies in the holding
5. THE MAFINDA SHALL provide drill-down capability to view detailed cash flow breakdown
6. THE MAFINDA SHALL refresh cash position automatically when new data is entered

### Requirement 13: Dashboard 2 - Key Financial Metrics

**User Story:** Sebagai Finance Analyst, saya ingin melihat metrik keuangan kunci dengan indikator warna, sehingga saya dapat dengan cepat menilai kesehatan keuangan perusahaan.

#### Acceptance Criteria

1. THE MAFINDA SHALL display total assets and Current_Asset (aset lancar) on Dashboard 2
2. THE MAFINDA SHALL display total liabilities and Current_Liability (kewajiban lancar) on Dashboard 2
3. THE MAFINDA SHALL display net profit (laba setelah pajak) on Dashboard 2
4. THE MAFINDA SHALL calculate and display Current_Ratio instead of ROA
5. WHEN Current_Ratio is below 1.0, THE MAFINDA SHALL display it with red color indicator
6. THE MAFINDA SHALL calculate and display DER (Debt to Equity Ratio)
7. WHEN DER is above 2.0, THE MAFINDA SHALL display it with red color indicator
8. THE MAFINDA SHALL display last update timestamp for each metric independently
9. THE MAFINDA SHALL display all metrics for selected Company or consolidated view

### Requirement 14: Dashboard 3 - Department Performance Ranking

**User Story:** Sebagai Finance Analyst, saya ingin melihat ranking performa departemen, sehingga saya dapat mengidentifikasi departemen terbaik dan yang perlu improvement.

#### Acceptance Criteria

1. THE MAFINDA SHALL calculate Department_Performance based on Achievement percentage
2. THE MAFINDA SHALL display the Division with highest achievement on Dashboard 3
3. THE MAFINDA SHALL display the Division with lowest achievement on Dashboard 3
4. THE MAFINDA SHALL show achievement percentage for both highest and lowest performing Divisions
5. THE MAFINDA SHALL provide link to detailed performance breakdown for each Division
6. THE MAFINDA SHALL update rankings automatically when new achievement data is available

### Requirement 15: Dashboard 4 - Overall Achievement Gauge

**User Story:** Sebagai Finance Analyst, saya ingin melihat achievement keseluruhan semua departemen dalam bentuk speedometer, sehingga saya dapat dengan cepat menilai performa agregat.

#### Acceptance Criteria

1. THE MAFINDA SHALL display overall Achievement for all Divisions using speedometer chart
2. WHEN Achievement is below 25%, THE MAFINDA SHALL display red color indicator
3. WHEN Achievement is between 25% and 75%, THE MAFINDA SHALL display yellow color indicator
4. WHEN Achievement is above 75%, THE MAFINDA SHALL display green color indicator
5. THE MAFINDA SHALL calculate overall achievement as weighted average of all Division achievements
6. THE MAFINDA SHALL display achievement value as percentage on the speedometer
7. THE MAFINDA SHALL provide tooltip showing breakdown by Division when hovering over the gauge

### Requirement 16: Dashboard 6 - Financial Ratio Groups

**User Story:** Sebagai Finance Analyst, saya ingin melihat rasio keuangan yang dikelompokkan berdasarkan kategori, sehingga analisis lebih terstruktur dan mudah dipahami.

#### Acceptance Criteria

1. THE MAFINDA SHALL display financial ratios grouped by Financial_Ratio_Group categories
2. THE MAFINDA SHALL group ratios into: Liquidity Ratios, Profitability Ratios, and Leverage Ratios
3. THE MAFINDA SHALL display group title "Financial Ratio" on Dashboard 6
4. THE MAFINDA SHALL show all ratios within each group with current values
5. THE MAFINDA SHALL provide visual indicators (color coding) for ratio health status
6. THE MAFINDA SHALL display trend arrows (up/down) for each ratio compared to previous period

### Requirement 17: Dashboard 7 - Historical Cash In and Cash Out

**User Story:** Sebagai Finance Analyst, saya ingin melihat historical cash in dan cash out per bulan dengan filter departemen dan proyek, sehingga saya dapat menganalisis pola arus kas.

#### Acceptance Criteria

1. THE MAFINDA SHALL display historical cash in and cash out data on Dashboard 7
2. WHEN displaying monthly data, THE MAFINDA SHALL use the latest week's input for that month
3. THE MAFINDA SHALL provide filter by Division to show Division-specific cash flow
4. THE MAFINDA SHALL provide filter by Project to show Project-specific cash flow
5. THE MAFINDA SHALL display data in line chart or bar chart format
6. THE MAFINDA SHALL show at least 12 months of historical data
7. THE MAFINDA SHALL allow users to export historical cash flow data

### Requirement 18: Dashboard 8 & 9 - Asset and Equity Composition

**User Story:** Sebagai Finance Analyst, saya ingin melihat komposisi aset dan ekuitas dalam bentuk pie chart, sehingga saya dapat memahami distribusi keuangan dengan lebih visual.

#### Acceptance Criteria

1. THE MAFINDA SHALL display asset composition using pie chart on Dashboard 8
2. THE MAFINDA SHALL break down assets into categories (current assets, fixed assets, other assets)
3. THE MAFINDA SHALL display equity composition using pie chart on Dashboard 9
4. THE MAFINDA SHALL break down equity into categories (modal, laba ditahan, deviden)
5. THE MAFINDA SHALL show percentage and absolute values for each pie slice
6. THE MAFINDA SHALL provide interactive tooltips showing detailed breakdown on hover
7. THE MAFINDA SHALL use consistent color scheme across both pie charts

### Requirement 19: Corporate Color Scheme

**User Story:** Sebagai user, saya ingin dashboard menggunakan warna sesuai corporate identity, sehingga tampilan konsisten dengan branding perusahaan.

#### Acceptance Criteria

1. THE MAFINDA SHALL apply corporate color scheme to all dashboard elements
2. THE MAFINDA SHALL use corporate colors for charts, graphs, and visual indicators
3. THE MAFINDA SHALL maintain sufficient contrast for accessibility compliance
4. THE MAFINDA SHALL use corporate colors consistently across all dashboard pages
5. THE MAFINDA SHALL allow system administrator to configure corporate color palette
6. THE MAFINDA SHALL preview color changes before applying them system-wide

### Requirement 20: Application Branding as MAFINDA

**User Story:** Sebagai user, saya ingin aplikasi memiliki branding "MAFINDA" yang jelas, sehingga identitas sistem mudah dikenali.

#### Acceptance Criteria

1. THE MAFINDA SHALL display "MAFINDA" as application name in header/navigation
2. THE MAFINDA SHALL show full name "Management Finance Dashboard" as subtitle or tooltip
3. THE MAFINDA SHALL use MAFINDA branding in login page
4. THE MAFINDA SHALL include MAFINDA logo in all generated reports and exports
5. THE MAFINDA SHALL display MAFINDA branding in email notifications
6. THE MAFINDA SHALL use "MAFINDA" in browser tab title and favicon
