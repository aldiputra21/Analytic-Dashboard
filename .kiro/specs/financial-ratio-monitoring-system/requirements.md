# Requirements Document

## Introduction

Sistem Monitoring Analisis Rasio Keuangan untuk Perusahaan Holding adalah platform terpusat yang memungkinkan pemilik dan Board of Directors (BOD) untuk memantau, menganalisis, dan membandingkan kinerja keuangan hingga 5 anak perusahaan secara real-time. Sistem ini menyediakan dashboard terstandarisasi, early warning system, benchmarking antar perusahaan, dan konsolidasi data keuangan tingkat holding untuk mendukung pengambilan keputusan strategis.

## Glossary

- **Holding_System**: Sistem monitoring rasio keuangan untuk perusahaan holding
- **Subsidiary**: Anak perusahaan yang berada di bawah perusahaan holding (maksimal 5 entitas)
- **Financial_Ratio**: Metrik keuangan terstandarisasi (ROA, ROE, NPM, DER, Current Ratio, Quick Ratio, Cash Ratio, OCF Ratio, DSCR)
- **Dashboard**: Antarmuka visual untuk monitoring dan analisis data keuangan
- **Early_Warning_System**: Sistem peringatan otomatis untuk kondisi keuangan yang berisiko
- **Consolidated_Report**: Laporan keuangan gabungan dari seluruh anak perusahaan
- **BOD**: Board of Directors - pengguna dengan akses penuh untuk analisis strategis
- **Owner**: Pemilik perusahaan dengan akses tertinggi ke seluruh data dan konfigurasi
- **Health_Score**: Skor agregat yang menggambarkan kesehatan keuangan perusahaan (0-100)
- **Benchmark**: Perbandingan kinerja antar anak perusahaan atau dengan standar industri
- **Period**: Periode pelaporan keuangan (bulanan, kuartalan, atau tahunan)
- **Threshold**: Batas nilai rasio keuangan yang menentukan status kesehatan (healthy, moderate, risky)
- **Data_Validator**: Komponen yang memvalidasi integritas dan konsistensi data keuangan
- **Access_Control**: Sistem manajemen hak akses berbasis role dan level organisasi
- **Trend_Analyzer**: Komponen yang menganalisis tren historis rasio keuangan
- **Alert_Engine**: Mesin yang menghasilkan notifikasi berdasarkan kondisi threshold

## Requirements

### Requirement 1: Multi-Subsidiary Management

**User Story:** Sebagai Owner, saya ingin mengelola hingga 5 anak perusahaan dalam sistem, sehingga saya dapat memantau seluruh portofolio perusahaan holding dalam satu platform.

#### Acceptance Criteria

1. THE Holding_System SHALL support registration of up to 5 Subsidiary entities
2. WHEN a new Subsidiary is registered, THE Holding_System SHALL capture company profile data including name, industry sector, fiscal year start date, currency, and tax rate
3. THE Holding_System SHALL assign a unique identifier to each Subsidiary
4. WHEN a Subsidiary is created, THE Holding_System SHALL set default Threshold values based on industry best practices
5. THE Holding_System SHALL allow Owner to activate or deactivate Subsidiary status
6. THE Holding_System SHALL prevent deletion of Subsidiary entities that have historical financial data

### Requirement 2: Financial Data Input and Validation

**User Story:** Sebagai BOD, saya ingin memasukkan data keuangan untuk setiap anak perusahaan, sehingga sistem dapat menghitung rasio keuangan secara otomatis.

#### Acceptance Criteria

1. WHEN financial data is submitted, THE Data_Validator SHALL verify that all required fields are present (revenue, net_profit, operating_cash_flow, cash, current_assets, current_liabilities, total_assets, total_equity, total_liabilities)
2. THE Data_Validator SHALL reject financial data entries where total_assets does not equal total_equity plus total_liabilities within 0.01% tolerance
3. WHEN financial data is validated, THE Holding_System SHALL automatically calculate all Financial_Ratio metrics (ROA, ROE, NPM, DER, Current Ratio, Quick Ratio, Cash Ratio, OCF Ratio, DSCR)
4. THE Holding_System SHALL support bulk import of financial data via CSV or Excel format
5. IF imported data contains validation errors, THEN THE Holding_System SHALL generate an error report identifying specific rows and fields with issues
6. THE Holding_System SHALL associate each financial data entry with a specific Subsidiary and Period
7. THE Holding_System SHALL prevent duplicate entries for the same Subsidiary and Period combination

### Requirement 3: Standardized Financial Ratio Calculation

**User Story:** Sebagai BOD, saya ingin sistem menghitung rasio keuangan secara konsisten menggunakan formula standar, sehingga perbandingan antar perusahaan valid dan reliable.

#### Acceptance Criteria

1. THE Holding_System SHALL calculate ROA as (Net Profit / Total Assets) × 100
2. THE Holding_System SHALL calculate ROE as (Net Profit / Total Equity) × 100
3. THE Holding_System SHALL calculate NPM as (Net Profit / Revenue) × 100
4. THE Holding_System SHALL calculate DER as Total Liabilities / Total Equity
5. THE Holding_System SHALL calculate Current Ratio as Current Assets / Current Liabilities
6. THE Holding_System SHALL calculate Quick Ratio as (Current Assets - Inventory) / Current Liabilities
7. THE Holding_System SHALL calculate Cash Ratio as Cash / Current Liabilities
8. THE Holding_System SHALL calculate OCF Ratio as Operating Cash Flow / Current Liabilities
9. THE Holding_System SHALL calculate DSCR as Operating Cash Flow / (Interest Expense + Short-term Debt + Current Portion of Long-term Debt)
10. IF any denominator in ratio calculations equals zero, THEN THE Holding_System SHALL return null for that ratio and log a warning

### Requirement 4: Multi-Company Dashboard Visualization

**User Story:** Sebagai Owner, saya ingin melihat dashboard yang menampilkan kinerja keuangan seluruh anak perusahaan secara bersamaan, sehingga saya dapat dengan cepat mengidentifikasi perusahaan yang berkinerja baik atau bermasalah.

#### Acceptance Criteria

1. THE Dashboard SHALL display Financial_Ratio metrics for all active Subsidiary entities simultaneously
2. THE Dashboard SHALL provide company selector to filter view by individual Subsidiary or view all companies
3. THE Dashboard SHALL use consistent color coding for each Subsidiary across all visualizations
4. THE Dashboard SHALL display Health_Score gauge for each Subsidiary with visual indicators (0-50: red/risky, 51-75: yellow/moderate, 76-100: green/healthy)
5. THE Dashboard SHALL show trend charts for revenue, profit, and key Financial_Ratio metrics over the selected Period range
6. THE Dashboard SHALL display year-over-year growth percentages for revenue and profit
7. THE Dashboard SHALL provide comparative bar charts showing Financial_Ratio values across all Subsidiary entities side-by-side
8. THE Dashboard SHALL refresh data automatically when new financial data is entered
9. THE Dashboard SHALL display the last update timestamp for each Subsidiary's financial data

### Requirement 5: Early Warning System

**User Story:** Sebagai BOD, saya ingin menerima peringatan otomatis ketika rasio keuangan melewati batas threshold yang ditentukan, sehingga saya dapat mengambil tindakan korektif sebelum masalah menjadi serius.

#### Acceptance Criteria

1. WHEN a Financial_Ratio value falls below or exceeds its defined Threshold, THE Alert_Engine SHALL generate a risk alert
2. THE Alert_Engine SHALL classify alerts into three severity levels: High (critical threshold breach), Medium (moderate threshold breach), and Low (approaching threshold)
3. THE Early_Warning_System SHALL detect negative Operating Cash Flow and generate a High severity alert
4. THE Early_Warning_System SHALL detect DER exceeding 2.0x and generate a High severity alert
5. THE Early_Warning_System SHALL detect Current Ratio below 1.0x and generate a High severity alert
6. THE Early_Warning_System SHALL detect NPM below 5% and generate a Medium severity alert
7. THE Early_Warning_System SHALL detect consecutive declining trends in profitability ratios over 3 periods and generate a Medium severity alert
8. THE Dashboard SHALL display active alerts with visual indicators (icon, color, count badge)
9. THE Dashboard SHALL provide an expandable alert panel showing detailed alert information including affected Subsidiary, metric name, current value, threshold value, and severity level
10. THE Holding_System SHALL allow Owner to configure custom Threshold values for each Subsidiary

### Requirement 6: Performance Benchmarking

**User Story:** Sebagai Owner, saya ingin membandingkan kinerja keuangan antar anak perusahaan, sehingga saya dapat mengidentifikasi best practices dan area yang memerlukan improvement.

#### Acceptance Criteria

1. THE Holding_System SHALL calculate relative performance rankings for each Financial_Ratio across all active Subsidiary entities
2. THE Dashboard SHALL display a performance ranking table showing each Subsidiary's position (1st, 2nd, 3rd, etc.) for key Financial_Ratio metrics
3. THE Dashboard SHALL highlight the leading Subsidiary for each Financial_Ratio category with a visual badge
4. THE Dashboard SHALL calculate and display the percentage difference between each Subsidiary's ratio and the best-performing Subsidiary's ratio
5. THE Holding_System SHALL calculate portfolio-wide average values for each Financial_Ratio
6. THE Dashboard SHALL display variance from portfolio average for each Subsidiary's Financial_Ratio values
7. WHERE industry benchmark data is available, THE Holding_System SHALL compare Subsidiary performance against industry standards
8. THE Holding_System SHALL generate a quarterly benchmarking report comparing all Subsidiary entities across all Financial_Ratio metrics

### Requirement 7: Consolidated Financial Reporting

**User Story:** Sebagai Owner, saya ingin melihat laporan keuangan konsolidasi tingkat holding, sehingga saya dapat memahami kinerja keseluruhan grup perusahaan.

#### Acceptance Criteria

1. THE Holding_System SHALL aggregate financial data from all active Subsidiary entities to produce Consolidated_Report
2. THE Holding_System SHALL eliminate inter-company transactions when calculating consolidated revenue and profit
3. THE Holding_System SHALL calculate consolidated Financial_Ratio metrics using aggregated financial statement data
4. THE Consolidated_Report SHALL display total group revenue, net profit, total assets, total equity, and total liabilities
5. THE Consolidated_Report SHALL show contribution percentage of each Subsidiary to total group revenue and profit
6. THE Consolidated_Report SHALL provide drill-down capability to view individual Subsidiary details from consolidated view
7. THE Holding_System SHALL generate consolidated reports for monthly, quarterly, and annual Period types
8. THE Holding_System SHALL export Consolidated_Report in PDF and Excel formats

### Requirement 8: Historical Trend Analysis

**User Story:** Sebagai BOD, saya ingin menganalisis tren historis rasio keuangan, sehingga saya dapat mengidentifikasi pola dan membuat proyeksi untuk perencanaan strategis.

#### Acceptance Criteria

1. THE Trend_Analyzer SHALL maintain historical Financial_Ratio data for all Subsidiary entities for a minimum of 5 years
2. THE Dashboard SHALL display line charts showing Financial_Ratio trends over selectable time periods (3 months, 6 months, 1 year, 3 years, 5 years)
3. THE Trend_Analyzer SHALL calculate moving averages for Financial_Ratio metrics over 3-month and 12-month periods
4. THE Trend_Analyzer SHALL identify and flag significant trend changes (>20% increase or decrease over 3 consecutive periods)
5. THE Dashboard SHALL display year-over-year comparison charts for the same Period across different years
6. THE Holding_System SHALL calculate compound annual growth rate (CAGR) for revenue and profit over multi-year periods
7. THE Dashboard SHALL provide seasonality analysis for Subsidiary entities with monthly data spanning multiple years
8. THE Trend_Analyzer SHALL detect cyclical patterns in Financial_Ratio data and highlight them in visualizations

### Requirement 9: Role-Based Access Control

**User Story:** Sebagai Owner, saya ingin mengatur hak akses pengguna berdasarkan role dan level organisasi, sehingga setiap pengguna hanya dapat mengakses data yang sesuai dengan tanggung jawab mereka.

#### Acceptance Criteria

1. THE Access_Control SHALL support three primary user roles: Owner, BOD, and Subsidiary_Manager
2. THE Access_Control SHALL grant Owner role full access to all Subsidiary data, system configuration, and user management
3. THE Access_Control SHALL grant BOD role read access to all Subsidiary data and Consolidated_Report, but no configuration access
4. THE Access_Control SHALL grant Subsidiary_Manager role access only to their assigned Subsidiary's data
5. THE Access_Control SHALL allow Owner to create, modify, and deactivate user accounts
6. THE Access_Control SHALL require strong password policy (minimum 12 characters, including uppercase, lowercase, number, and special character)
7. THE Access_Control SHALL enforce session timeout after 30 minutes of inactivity
8. THE Access_Control SHALL log all user authentication attempts and access to sensitive financial data
9. THE Access_Control SHALL allow Owner to assign multiple Subsidiary access permissions to a single user account
10. IF a user attempts to access data outside their permission scope, THEN THE Access_Control SHALL deny access and log the attempt

### Requirement 10: Data Export and Reporting

**User Story:** Sebagai BOD, saya ingin mengekspor data keuangan dan laporan analisis dalam berbagai format, sehingga saya dapat menggunakan data tersebut untuk presentasi dan analisis lebih lanjut.

#### Acceptance Criteria

1. THE Holding_System SHALL export Financial_Ratio data in CSV, Excel, and PDF formats
2. THE Holding_System SHALL export Dashboard visualizations as PNG or SVG image files
3. THE Holding_System SHALL generate executive summary reports in PDF format with company branding
4. WHEN exporting data, THE Holding_System SHALL include metadata (export date, Period range, user who generated the export)
5. THE Holding_System SHALL allow users to schedule automated report generation on monthly, quarterly, or annual basis
6. THE Holding_System SHALL email scheduled reports to designated recipients
7. THE Holding_System SHALL maintain an export history log showing who exported what data and when
8. THE Holding_System SHALL apply Access_Control permissions to export functionality (users can only export data they have permission to view)

### Requirement 11: Data Integrity and Audit Trail

**User Story:** Sebagai Owner, saya ingin sistem mencatat semua perubahan data keuangan, sehingga saya dapat melacak siapa yang memasukkan atau mengubah data dan kapan perubahan tersebut terjadi.

#### Acceptance Criteria

1. THE Holding_System SHALL record an audit log entry for every financial data insert, update, or delete operation
2. THE audit log entry SHALL capture user ID, timestamp, affected Subsidiary, Period, changed fields, old values, and new values
3. THE Holding_System SHALL prevent modification of historical financial data older than the current fiscal year without Owner approval
4. WHEN historical data is modified, THE Holding_System SHALL require a justification comment and flag the entry as "Restated"
5. THE Holding_System SHALL recalculate all dependent Financial_Ratio values when underlying financial data is modified
6. THE Holding_System SHALL maintain data versioning for financial entries, allowing users to view previous versions
7. THE Holding_System SHALL provide an audit trail report showing all changes to a specific Subsidiary's data within a date range
8. THE Holding_System SHALL detect and alert on unusual data patterns (e.g., values that differ by >50% from previous Period without explanation)

### Requirement 12: System Performance and Scalability

**User Story:** Sebagai pengguna sistem, saya ingin Dashboard memuat dengan cepat dan responsif, sehingga saya dapat mengakses informasi keuangan tanpa penundaan yang mengganggu.

#### Acceptance Criteria

1. THE Dashboard SHALL load initial view within 2 seconds for datasets containing up to 5 Subsidiary entities with 5 years of monthly data
2. THE Holding_System SHALL respond to user interactions (filtering, period selection, company selection) within 500 milliseconds
3. THE Holding_System SHALL support concurrent access by up to 20 users without performance degradation
4. THE Holding_System SHALL cache frequently accessed Financial_Ratio calculations to improve response time
5. WHEN bulk data import is in progress, THE Holding_System SHALL process at least 1000 financial data rows per minute
6. THE Holding_System SHALL provide progress indicators for long-running operations (bulk import, report generation, consolidation)
7. THE Holding_System SHALL implement database indexing on Subsidiary ID, Period, and timestamp fields to optimize query performance
8. THE Holding_System SHALL archive financial data older than 10 years to maintain optimal database performance

### Requirement 13: Mobile Responsiveness

**User Story:** Sebagai BOD, saya ingin mengakses Dashboard dari perangkat mobile, sehingga saya dapat memantau kinerja keuangan perusahaan kapan saja dan di mana saja.

#### Acceptance Criteria

1. THE Dashboard SHALL adapt layout automatically for screen sizes ranging from 320px to 2560px width
2. THE Dashboard SHALL display simplified visualizations on mobile devices (screen width <768px) optimized for touch interaction
3. THE Dashboard SHALL provide swipe gestures for navigating between Subsidiary views on mobile devices
4. THE Dashboard SHALL maintain full functionality on tablets (screen width 768px-1024px) with touch-optimized controls
5. THE Dashboard SHALL load within 3 seconds on mobile devices with 4G network connection
6. THE Dashboard SHALL use responsive charts that scale appropriately for different screen sizes
7. THE Dashboard SHALL provide a mobile-optimized alert notification system with push notification support

### Requirement 14: Data Backup and Recovery

**User Story:** Sebagai Owner, saya ingin sistem secara otomatis membuat backup data keuangan, sehingga data perusahaan terlindungi dari kehilangan akibat kegagalan sistem atau kesalahan manusia.

#### Acceptance Criteria

1. THE Holding_System SHALL perform automated daily backups of all financial data and system configuration
2. THE Holding_System SHALL retain daily backups for 30 days, weekly backups for 12 weeks, and monthly backups for 7 years
3. THE Holding_System SHALL encrypt backup files using AES-256 encryption
4. THE Holding_System SHALL store backups in a geographically separate location from the primary database
5. THE Holding_System SHALL verify backup integrity by performing test restores on a monthly basis
6. THE Holding_System SHALL provide Owner with ability to initiate manual backup at any time
7. THE Holding_System SHALL complete full database restore within 4 hours in the event of system failure
8. THE Holding_System SHALL log all backup and restore operations with timestamp and status

### Requirement 15: Customizable Threshold Configuration

**User Story:** Sebagai Owner, saya ingin mengatur threshold rasio keuangan yang berbeda untuk setiap anak perusahaan, sehingga early warning system dapat disesuaikan dengan karakteristik bisnis masing-masing perusahaan.

#### Acceptance Criteria

1. THE Holding_System SHALL allow Owner to define custom Threshold values for each Financial_Ratio metric per Subsidiary
2. THE Holding_System SHALL provide default Threshold values based on industry sector when a new Subsidiary is created
3. THE Holding_System SHALL validate that healthy Threshold values are more favorable than moderate Threshold values
4. WHEN Threshold values are modified, THE Alert_Engine SHALL re-evaluate all current Financial_Ratio values against new thresholds
5. THE Holding_System SHALL maintain a history of Threshold changes with timestamp and user who made the change
6. THE Holding_System SHALL allow Owner to reset Threshold values to industry defaults
7. THE Holding_System SHALL display current Threshold values on Dashboard visualizations as reference lines
8. THE Holding_System SHALL support different Threshold values for different Period types (monthly thresholds may differ from annual thresholds)

