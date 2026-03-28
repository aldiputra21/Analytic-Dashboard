# Implementation Plan: Financial Ratio Monitoring System

## Overview

Implementasi sistem monitoring rasio keuangan untuk perusahaan holding menggunakan React 18+, TypeScript, Tailwind CSS, Recharts di frontend, dan Node.js/Express dengan SQLite di backend. Rencana ini mengikuti 8 fase pengembangan yang didefinisikan dalam design document.

## Tasks

- [x] 1. Phase 1: Core Infrastructure - Project Setup and Database
  - [x] 1.1 Set up project structure, build configuration, and TypeScript
    - Initialize backend Express/TypeScript project with tsconfig.json and package.json
    - Configure ESLint, Prettier, and Jest for backend
    - Set up frontend Vite + React 18 + TypeScript project
    - Configure Tailwind CSS, fast-check, and testing libraries
    - Create directory structure: src/components/, src/hooks/, src/services/, src/types/
    - _Requirements: 12.1, 12.2_

  - [x] 1.2 Implement database schema and migrations
    - Create SQLite migration runner utility
    - Write migration 001_initial_schema.sql with all tables: subsidiaries, financial_data, calculated_ratios, thresholds, alerts, users, user_subsidiary_access, audit_log, scheduled_reports, financial_data_history
    - Create all indexes defined in design (composite indexes for common queries)
    - Write seed script for initial owner user
    - _Requirements: 11.1, 12.7_

  - [x] 1.3 Implement TypeScript type definitions
    - Create src/types/subsidiary.ts with Subsidiary, CreateSubsidiaryInput
    - Create src/types/financialData.ts with FinancialData, CreateFinancialDataInput, PeriodType
    - Create src/types/ratio.ts with CalculatedRatios, RatioName
    - Create src/types/alert.ts with Alert, AlertSeverity, AlertStatus
    - Create src/types/user.ts with User, UserRole, UserSubsidiaryAccess, AuditLog
    - Create src/types/threshold.ts with Threshold, ThresholdStatus
    - _Requirements: 2.3, 3.1_

  - [x] 1.4 Implement JWT authentication and base Express server
    - Create Express app with middleware: CORS, helmet, rate limiting, JSON body parser
    - Implement POST /api/auth/login with bcrypt password verification and JWT issuance
    - Implement POST /api/auth/logout with token invalidation
    - Implement GET /api/auth/me returning current user from JWT
    - Implement JWT middleware for protected routes
    - Implement session timeout logic (30 minutes inactivity)
    - _Requirements: 9.6, 9.7, 9.8_

  - [ ]* 1.5 Write property test for strong password validation
    - **Property 39: Strong Password Validation**
    - For any password string, validate it meets: min 12 chars, uppercase, lowercase, number, special char
    - **Validates: Requirements 9.6**

  - [x] 1.6 Implement RBAC middleware and permission system
    - Create permissions map for owner/bod/subsidiary_manager roles as defined in design
    - Implement authorize(resource, action) middleware
    - Implement checkSubsidiaryAccess(userId, subsidiaryId) for subsidiary_manager role
    - Log unauthorized access attempts to audit_log
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 1.7 Write property tests for access control
    - **Property 35: Owner Full Access Permission**
    - **Property 36: BOD Read-Only Access Permission**
    - **Property 37: Subsidiary Manager Limited Access**
    - **Property 42: Unauthorized Access Denial and Logging**
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.10**

  - [x] 1.8 Implement audit logging service
    - Create auditLog.create() function capturing all required fields per design
    - Integrate audit logging into auth endpoints (login/logout)
    - _Requirements: 9.8, 11.1, 11.2_

  - [ ]* 1.9 Write property test for audit log completeness
    - **Property 40: Comprehensive Audit Logging**
    - **Property 45: Audit Log Entry Completeness**
    - **Validates: Requirements 9.8, 11.1, 11.2**

  - [x] 1.10 Checkpoint - Ensure auth, RBAC, and DB migrations work
    - Ensure all tests pass, ask the user if questions arise.

- [x] 2. Phase 2: Subsidiary and Financial Data Management
  - [x] 2.1 Implement subsidiary CRUD API routes
    - POST /api/subsidiaries - create with max 5 limit enforcement
    - GET /api/subsidiaries - list all with active filter
    - GET /api/subsidiaries/:id - get details
    - PUT /api/subsidiaries/:id - update profile
    - PATCH /api/subsidiaries/:id/status - activate/deactivate
    - DELETE /api/subsidiaries/:id - delete with historical data protection
    - Assign unique UUID to each subsidiary on creation
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

  - [ ]* 2.2 Write property tests for subsidiary management
    - **Property 1: Subsidiary Unique Identifier Assignment** - For any set of created subsidiaries, all IDs must be unique
    - **Property 2: Subsidiary Profile Data Completeness** - For any registration, all required fields must be stored
    - **Property 4: Subsidiary Status Toggle Persistence** - For any subsidiary, toggling status must persist
    - **Property 5: Subsidiary Deletion Protection** - For any subsidiary with financial data, deletion must be rejected
    - **Validates: Requirements 1.2, 1.3, 1.5, 1.6**

  - [x] 2.3 Implement default threshold initialization on subsidiary creation
    - Create industry-sector-based default threshold values for all 9 ratios
    - Auto-create threshold records for all period types (monthly, quarterly, annual) on subsidiary creation
    - _Requirements: 1.4, 15.2_

  - [ ]* 2.4 Write property test for default threshold initialization
    - **Property 3: Default Threshold Initialization** - For any newly created subsidiary, default thresholds for all 9 ratios must be created
    - **Validates: Requirements 1.4, 15.2**

  - [x] 2.5 Implement financial data validation (Data_Validator)
    - Validate all required fields are present: revenue, net_profit, operating_cash_flow, cash, current_assets, current_liabilities, total_assets, total_equity, total_liabilities
    - Validate accounting equation: total_assets = total_equity + total_liabilities within 0.01% tolerance
    - Reject duplicate subsidiary-period combinations
    - _Requirements: 2.1, 2.2, 2.7_

  - [ ]* 2.6 Write property tests for financial data validation
    - **Property 6: Financial Data Validation** - For any submission, required fields and accounting equation must be validated
    - **Property 9: Financial Data Association** - For any entry, it must have valid subsidiaryId and period info
    - **Property 10: Subsidiary-Period Uniqueness** - For any duplicate subsidiary+period, submission must be rejected
    - **Validates: Requirements 2.1, 2.2, 2.6, 2.7**

  - [x] 2.7 Implement ratio calculation engine (src/services/ratioCalculator.ts)
    - Implement calculateRatios(data: FinancialData): CalculatedRatios using exact formulas from design
    - Handle zero denominators by returning null and logging a warning
    - Implement calculateHealthScore() with weighted scoring (0-100)
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 2.8 Write property tests for ratio calculation correctness
    - **Property 7: Automatic Ratio Calculation** - For any valid financial data, all 9 ratios must be calculated and stored
    - **Property 11: Financial Ratio Formula Correctness** - For any data with non-zero denominators, all ratios must match their standard formulas exactly
    - Use fc.record() to generate random valid financial data with non-zero denominators
    - **Validates: Requirements 2.3, 3.1-3.10**

  - [x] 2.9 Implement financial data CRUD API routes
    - POST /api/financial-data - create entry, trigger ratio calculation, trigger alert evaluation
    - GET /api/financial-data - query with filters (subsidiaryId, period, date range)
    - PUT /api/financial-data/:id - update with historical data protection and versioning
    - DELETE /api/financial-data/:id - delete with audit log
    - GET /api/financial-data/:id/history - get version history from financial_data_history
    - _Requirements: 2.3, 11.1, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 2.10 Write property tests for data versioning and modification protection
    - **Property 46: Historical Data Modification Protection** - For any data older than current fiscal year, non-owner modification must be rejected
    - **Property 47: Restatement Requirements** - For any approved historical modification, is_restated flag must be set and justification required
    - **Property 48: Cascading Ratio Recalculation** - For any financial data update, all dependent ratios must be recalculated
    - **Property 49: Financial Data Versioning** - For any modified entry, a history record must be created
    - **Validates: Requirements 11.3, 11.4, 11.5, 11.6**

  - [x] 2.11 Implement bulk import (CSV/Excel) via POST /api/financial-data/bulk
    - Parse CSV and Excel files using xlsx library
    - Validate each row against financial data rules
    - Generate error report identifying specific rows and fields with issues
    - Process valid rows and skip invalid ones
    - _Requirements: 2.4, 2.5_

  - [ ]* 2.12 Write property test for bulk import error reporting
    - **Property 8: Bulk Import Error Reporting** - For any import file with validation errors, the error report must identify specific row numbers and field names
    - **Validates: Requirements 2.5**

  - [x] 2.13 Implement user management API routes (Owner only)
    - POST /api/users - create user with strong password validation
    - GET /api/users - list users
    - PUT /api/users/:id - update user
    - PATCH /api/users/:id/status - activate/deactivate
    - POST /api/users/:id/subsidiary-access - assign subsidiary access
    - _Requirements: 9.1, 9.5, 9.9_

  - [ ]* 2.14 Write property tests for user management
    - **Property 38: Owner User Management Permission** - For any owner user, create/modify/deactivate user accounts must be permitted
    - **Property 41: Multiple Subsidiary Access Assignment** - For any user, multiple subsidiary access assignments must be stored correctly
    - **Validates: Requirements 9.5, 9.9**

  - [x] 2.15 Checkpoint - Ensure subsidiary, financial data, and user management work end-to-end
    - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Phase 3: Dashboard and Visualization
  - [x] 3.1 Implement dashboard layout and navigation (DashboardLayout.tsx)
    - Create main layout with sidebar navigation and header
    - Implement CompanySelector.tsx for filtering by individual subsidiary or all
    - Implement PeriodSelector.tsx for time period selection (3m, 6m, 1y, 3y, 5y)
    - Implement ProtectedRoute.tsx for access control on frontend routes
    - _Requirements: 4.2, 9.1_

  - [x] 3.2 Implement HealthScoreGauge.tsx component
    - Display health score 0-100 with color coding: red (0-50), yellow (51-75), green (76-100)
    - Use consistent color per subsidiary across all visualizations
    - _Requirements: 4.3, 4.4_

  - [ ]* 3.3 Write property tests for health score visual indicators
    - **Property 14: Health Score Visual Indicators** - For any health score value, the gauge must display the correct color indicator
    - **Property 13: Subsidiary Color Consistency** - For any subsidiary, its color must be consistent across all visualizations
    - **Validates: Requirements 4.3, 4.4**

  - [x] 3.4 Implement RatioCard.tsx and multi-subsidiary display
    - Display all 9 financial ratio metrics for each active subsidiary
    - Show current value, threshold reference lines, and status indicator
    - Display last update timestamp per subsidiary
    - _Requirements: 4.1, 4.9, 15.7_

  - [ ]* 3.5 Write property test for active subsidiaries display
    - **Property 12: Active Subsidiaries Display** - For any set of active subsidiaries, all must appear on the dashboard simultaneously
    - **Property 16: Last Update Timestamp Display** - For any subsidiary with data, the most recent timestamp must be shown
    - **Validates: Requirements 4.1, 4.9**

  - [x] 3.6 Implement TrendChart.tsx using Recharts
    - Line chart for revenue, profit, and key ratio trends over selected period
    - Display year-over-year growth percentages for revenue and profit
    - Support selectable time periods (3m, 6m, 1y, 3y, 5y)
    - _Requirements: 4.5, 4.6_

  - [ ]* 3.7 Write property test for year-over-year growth calculation
    - **Property 15: Year-over-Year Growth Calculation** - For any two consecutive years of data, YoY% = ((Current - Previous) / Previous) x 100
    - **Validates: Requirements 4.6**

  - [x] 3.8 Implement ComparisonChart.tsx using Recharts
    - Comparative bar charts showing ratio values across all subsidiaries side-by-side
    - Auto-refresh when new financial data is entered
    - _Requirements: 4.7, 4.8_

  - [x] 3.9 Implement AlertPanel.tsx
    - Display active alerts with icon, color, and count badge
    - Expandable panel showing: affected subsidiary, metric name, current value, threshold value, severity
    - _Requirements: 5.8, 5.9_

  - [x] 3.10 Implement GET /api/ratios endpoint with React Query hooks
    - Create useRatios.ts hook for fetching calculated ratios
    - Create useFinancialData.ts hook for financial data queries
    - Implement in-memory caching (5 minutes TTL) for ratio calculations
    - _Requirements: 12.2, 12.4_

  - [ ]* 3.11 Write property test for ratio calculation caching
    - **Property 51: Ratio Calculation Caching** - For any repeated ratio query within 5 minutes, cached results must be returned
    - **Validates: Requirements 12.4**

  - [x] 3.12 Implement responsive design for mobile and tablet
    - Adapt layout for screen sizes 320px to 2560px
    - Simplified visualizations on mobile (<768px) with touch interaction
    - Full functionality on tablets (768px-1024px)
    - Responsive Recharts that scale for different screen sizes
    - _Requirements: 13.1, 13.2, 13.4, 13.6_

  - [x] 3.13 Checkpoint - Ensure dashboard renders correctly with real data
    - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Phase 4: Alerting and Threshold Configuration
  - [x] 4.1 Implement threshold configuration API routes
    - GET /api/thresholds/:subsidiaryId - get thresholds per subsidiary and period type
    - PUT /api/thresholds/:subsidiaryId - update custom thresholds (Owner only)
    - POST /api/thresholds/:subsidiaryId/reset - reset to industry defaults (Owner only)
    - GET /api/thresholds/history - get threshold change history
    - _Requirements: 5.10, 15.1, 15.5, 15.6_

  - [ ]* 4.2 Write property tests for threshold configuration
    - **Property 20: Custom Threshold Configuration** - For any subsidiary+ratio, owner can set custom thresholds that persist and are used for alerts
    - **Property 53: Threshold Validation** - For any threshold config, healthy values must be more favorable than moderate values
    - **Property 55: Threshold Change History** - For any threshold modification, a history record must be created
    - **Property 56: Threshold Reset to Defaults** - For any subsidiary, owner can reset to industry defaults
    - **Property 57: Period-Specific Thresholds** - For any subsidiary+ratio, different thresholds per period type must be supported
    - **Validates: Requirements 5.10, 15.1, 15.3, 15.5, 15.6, 15.8**

  - [x] 4.3 Implement alert engine (src/services/alertEngine.ts)
    - Implement evaluateAlerts(subsidiaryId, financialDataId, ratios) as defined in design
    - Classify alerts into high/medium/low severity
    - Detect negative OCF (high), DER > 2.0 (high), Current Ratio < 1.0 (high)
    - Detect NPM < 5% (medium)
    - Store generated alerts in alerts table
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 4.4 Write property tests for alert generation
    - **Property 17: Threshold Breach Alert Generation** - For any ratio value breaching its threshold, an alert must be generated with correct severity
    - **Property 18: Alert Severity Classification** - For any generated alert, it must be classified into exactly one severity level
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

  - [x] 4.5 Implement declining trend detection in Alert_Engine
    - Detect 3 consecutive periods of declining ROA, ROE, or NPM
    - Generate medium severity alert for declining profitability trend
    - _Requirements: 5.7_

  - [ ]* 4.6 Write property test for declining trend alert
    - **Property 19: Declining Trend Alert** - For any subsidiary with 3 consecutive declining profitability periods, a medium alert must be generated
    - **Validates: Requirements 5.7**

  - [x] 4.7 Implement threshold re-evaluation on threshold change
    - When thresholds are updated, re-evaluate all current ratio values against new thresholds
    - Generate new alerts or resolve existing alerts based on re-evaluation
    - _Requirements: 15.4_

  - [ ]* 4.8 Write property test for threshold change re-evaluation
    - **Property 54: Threshold Change Re-evaluation** - For any threshold modification, all current ratios must be re-evaluated and alerts updated
    - **Validates: Requirements 15.4**

  - [x] 4.9 Implement alert management API routes
    - GET /api/alerts - list active alerts with filters (subsidiaryId, severity, status)
    - GET /api/alerts/:id - get alert details
    - PATCH /api/alerts/:id/acknowledge - acknowledge alert
    - GET /api/alerts/history - get alert history
    - _Requirements: 5.8, 5.9_

  - [x] 4.10 Implement ThresholdConfig.tsx admin component
    - Form for Owner to configure custom threshold values per subsidiary and ratio
    - Display current threshold values as reference lines on dashboard charts
    - _Requirements: 5.10, 15.1, 15.7_

  - [x] 4.11 Implement unusual data pattern detection
    - Detect when a financial value differs by >50% from previous period
    - Generate alert for unusual data patterns
    - _Requirements: 11.8_

  - [ ]* 4.12 Write property test for unusual data pattern detection
    - **Property 50: Unusual Data Pattern Detection** - For any value differing >50% from previous period, an alert must be generated
    - **Validates: Requirements 11.8**

  - [x] 4.13 Checkpoint - Ensure alerting and threshold system works end-to-end
    - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Phase 5: Reporting and Analytics
  - [x] 5.1 Implement trend analysis engine (src/services/trendAnalyzer.ts)
    - Calculate 3-month and 12-month moving averages for all ratio metrics
    - Detect significant trend changes (>20% increase or decrease over 3 consecutive periods)
    - Calculate CAGR for revenue and profit over multi-year periods
    - _Requirements: 8.3, 8.4, 8.6_

  - [ ]* 5.2 Write property tests for trend analysis calculations
    - **Property 32: Moving Average Calculation** - For any ratio with sufficient history, 3-month and 12-month moving averages must be arithmetic means of respective periods
    - **Property 33: Significant Trend Change Detection** - For any ratio with >20% change over 3 periods, it must be flagged
    - **Property 34: CAGR Calculation** - For any multi-year data, CAGR = ((End/Start)^(1/Years) - 1) x 100
    - **Validates: Requirements 8.3, 8.4, 8.6**

  - [x] 5.3 Implement GET /api/ratios/trends endpoint and useTrends.ts hook
    - Return historical ratio data with moving averages and trend flags
    - Support selectable time periods (3m, 6m, 1y, 3y, 5y)
    - _Requirements: 8.1, 8.2_

  - [ ]* 5.4 Write property test for historical data retention
    - **Property 31: Historical Data Retention** - For any subsidiary, financial ratio data must be retained for minimum 5 years
    - **Validates: Requirements 8.1**

  - [x] 5.5 Implement benchmarking calculations (GET /api/ratios/benchmark)
    - Calculate relative performance rankings for each ratio across all active subsidiaries
    - Calculate portfolio-wide average for each ratio
    - Calculate percentage difference from best-performing subsidiary
    - Calculate variance from portfolio average per subsidiary
    - _Requirements: 6.1, 6.4, 6.5, 6.6_

  - [ ]* 5.6 Write property tests for benchmarking calculations
    - **Property 21: Performance Ranking Calculation** - For any ratio and set of subsidiaries, rankings must be correct (best = rank 1)
    - **Property 22: Leading Subsidiary Identification** - For any ratio, the best-performing subsidiary must be identified
    - **Property 23: Performance Gap Calculation** - For any subsidiary+ratio, gap% = ((Best - Current) / Best) x 100
    - **Property 24: Portfolio Average Calculation** - For any ratio, portfolio average = arithmetic mean of all subsidiary values
    - **Property 25: Variance from Average Calculation** - For any subsidiary+ratio, variance = Current Value - Portfolio Average
    - **Validates: Requirements 6.1, 6.3, 6.4, 6.5, 6.6**

  - [x] 5.7 Implement industry benchmark comparison
    - Store industry benchmark data per sector and ratio
    - Compare subsidiary ratios against industry standards
    - Calculate variance from industry benchmark
    - _Requirements: 6.7_

  - [ ]* 5.8 Write property test for industry benchmark comparison
    - **Property 26: Industry Benchmark Comparison** - For any subsidiary with available benchmark data, variance from industry standard must be calculated
    - **Validates: Requirements 6.7**

  - [x] 5.9 Implement consolidated report generation (src/services/reportGenerator.ts)
    - Implement generateConsolidatedReport() as defined in design
    - Aggregate revenue, net profit, total assets, equity, liabilities from all active subsidiaries
    - Calculate consolidated ratios using aggregated totals
    - Calculate contribution percentages per subsidiary
    - Support monthly, quarterly, and annual period types
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_

  - [ ]* 5.10 Write property tests for consolidated reporting
    - **Property 27: Consolidated Financial Aggregation** - For any set of active subsidiaries, consolidated totals must equal sum of all subsidiary values
    - **Property 28: Consolidated Ratio Calculation** - For any consolidated data, ratios must be calculated using aggregated totals
    - **Property 29: Subsidiary Contribution Percentage** - For any subsidiary, contribution% = (Subsidiary Value / Total Group Value) x 100
    - **Property 30: Consolidated Report Period Types** - For any period type, a consolidated report must be generatable
    - **Validates: Requirements 7.1, 7.3, 7.4, 7.5, 7.7**

  - [x] 5.11 Implement export functionality (CSV, Excel, PDF)
    - Export financial ratio data in CSV and Excel formats using xlsx library
    - Generate PDF reports using jsPDF with company branding
    - Include metadata in all exports: export date, period range, exporting user
    - Apply access control permissions to export (users can only export permitted data)
    - _Requirements: 10.1, 10.3, 10.4, 10.8_

  - [ ]* 5.12 Write property tests for export functionality
    - **Property 43: Export Metadata Inclusion** - For any export operation, the file must include export date, period range, and username
    - **Property 44: Export Permission Enforcement** - For any export request, only permitted data must be exportable
    - **Validates: Requirements 10.4, 10.8**

  - [x] 5.13 Implement BenchmarkingTable.tsx and ConsolidatedReport.tsx components
    - Performance ranking table with position badges for each ratio
    - Consolidated report view with drill-down to individual subsidiary
    - TrendAnalysis.tsx with line charts for historical trends and YoY comparison
    - ExportButton.tsx with format selection (CSV, Excel, PDF, PNG)
    - _Requirements: 6.2, 6.3, 7.6, 8.2, 8.5, 10.2_

  - [x] 5.14 Checkpoint - Ensure reporting and analytics work correctly
    - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Phase 6: Advanced Features
  - [x] 6.1 Implement scheduled report generation
    - POST /api/reports/schedule - create scheduled report (monthly/quarterly/annual)
    - GET /api/reports/scheduled - list scheduled reports
    - DELETE /api/reports/schedule/:id - delete scheduled report
    - Implement cron-based scheduler to trigger report generation
    - Send generated reports via email to designated recipients using SMTP
    - _Requirements: 10.5, 10.6_

  - [x] 6.2 Implement export history log
    - Record every export operation in audit_log with user, data exported, and timestamp
    - GET /api/audit-log endpoint with filters for export operations
    - _Requirements: 10.7_

  - [x] 6.3 Implement AuditLog.tsx admin component
    - Display audit trail for all changes to a specific subsidiary within a date range
    - Show user, timestamp, action, old values, new values, justification
    - _Requirements: 11.7_

  - [x] 6.4 Implement data versioning and history viewer
    - GET /api/financial-data/:id/history returns all versions from financial_data_history
    - Display version history in UI allowing users to view previous values
    - _Requirements: 11.6_

  - [x] 6.5 Implement data archival for records older than 10 years
    - Create archive table mirroring financial_data structure
    - Implement archival job to move data with period_end_date older than 10 years
    - _Requirements: 12.8_

  - [ ]* 6.6 Write property test for data archival
    - **Property 52: Data Archival** - For any financial data with period end date older than 10 years, it must be moved to archive table
    - **Validates: Requirements 12.8**

  - [x] 6.7 Implement backup and restore functionality
    - Implement automated daily backup of SQLite database with AES-256 encryption
    - Implement manual backup trigger for Owner
    - Log all backup and restore operations with timestamp and status
    - _Requirements: 14.1, 14.3, 14.6, 14.8_

  - [x] 6.8 Implement SubsidiaryManager.tsx and UserManager.tsx admin components
    - Subsidiary CRUD form with industry sector, fiscal year, currency, tax rate fields
    - User management form with role assignment and subsidiary access configuration
    - _Requirements: 1.1, 1.2, 9.1, 9.5_

  - [x] 6.9 Implement FinancialDataForm.tsx and BulkImport.tsx data entry components
    - Manual financial data entry form with all required fields and inline validation
    - CSV/Excel file upload with progress indicator and error report display
    - _Requirements: 2.1, 2.4, 2.5, 12.6_

  - [x] 6.10 Checkpoint - Ensure advanced features work correctly
    - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Phase 7: Comprehensive Testing and Optimization
  - [x] 7.1 Write remaining property-based tests (fast-check) for all untested properties
    - Each test must use fc.assert() with minimum numRuns: 100
    - Tag format: Feature: financial-ratio-monitoring-system, Property {N}: {title}
    - Cover all 57 properties defined in design document

  - [ ]* 7.2 Write property test for zero denominator handling
    - Verify that when any denominator in ratio calculations equals zero, the ratio returns null
    - This is an edge case for Property 11
    - **Validates: Requirements 3.10**

  - [ ]* 7.3 Write unit tests for API endpoints (Supertest)
    - Test all CRUD endpoints for subsidiaries, financial data, users, thresholds, alerts
    - Test authentication and authorization on each protected endpoint
    - Test error responses (400, 401, 403, 404, 422) with correct formats
    - _Requirements: 2.1, 9.1, 9.10_

  - [ ]* 7.4 Write unit tests for frontend components (React Testing Library)
    - Test HealthScoreGauge renders correct color for each score range
    - Test AlertPanel displays correct severity icons and counts
    - Test CompanySelector filters dashboard correctly
    - Test form validation in FinancialDataForm
    - _Requirements: 4.4, 5.8_

  - [x] 7.5 Implement database query optimization
    - Add composite indexes: idx_financial_data_subsidiary_period, idx_alerts_subsidiary_status, idx_audit_log_user_date
    - Implement pagination (limit 50 records per page) for large result sets
    - Use SELECT only required columns in all queries
    - _Requirements: 12.7_

  - [x] 7.6 Implement frontend performance optimizations
    - Add React.memo() to expensive chart components
    - Add useMemo() and useCallback() to prevent unnecessary re-renders
    - Implement React.lazy() code splitting by route (dashboard, reports, admin)
    - Add skeleton screens for loading states
    - _Requirements: 12.1, 12.2_

  - [x] 7.7 Implement progress indicators for long-running operations
    - Show progress bar during bulk import processing
    - Show progress indicator during report generation and consolidation
    - _Requirements: 12.6_

  - [x] 7.8 Checkpoint - All 57 property tests and unit tests must pass
    - Ensure all tests pass, ask the user if questions arise.

- [-] 8. Phase 8: Integration, Wiring, and Final Validation
  - [x] 8.1 Wire all backend services together in the main Express app
    - Register all API routers: subsidiaries, financial-data, ratios, alerts, thresholds, reports, users, auth, audit-log
    - Ensure audit logging middleware is applied to all state-changing routes
    - Ensure RBAC middleware is applied to all protected routes
    - _Requirements: 9.1, 11.1_

  - [x] 8.2 Wire frontend routing and React Query providers
    - Set up React Router with protected routes for each role
    - Configure React Query client with stale-while-revalidate strategy
    - Connect all hooks (useFinancialData, useRatios, useAlerts, useAuth, useTrends) to real API
    - _Requirements: 4.8, 12.2_

  - [x] 8.3 Implement environment configuration
    - Create .env.example with all required variables from design (DATABASE_URL, JWT_SECRET, SMTP_*, BACKUP_*, CACHE_TTL, etc.)
    - Implement config validation on server startup using Zod
    - _Requirements: 14.3_

  - [x] 8.4 Implement error boundaries and global error handling
    - Add ErrorBoundary.tsx component to prevent full app crashes
    - Implement consistent error response format on backend (code, message, details, field, timestamp, requestId)
    - Add toast notifications for user-friendly error messages on frontend
    - _Requirements: 12.1_

  - [ ]* 8.5 Write integration tests for critical end-to-end flows
    - Test: create subsidiary -> add financial data -> view dashboard with ratios and alerts
    - Test: update financial data -> verify ratio recalculation -> verify alert re-evaluation
    - Test: bulk import CSV -> verify error report -> verify valid rows processed
    - Test: generate consolidated report -> verify aggregation correctness
    - _Requirements: 2.3, 4.8, 7.1, 11.5_

  - [x] 8.6 Final checkpoint - Full system integration validation
    - Ensure all 57 property tests pass with numRuns: 100
    - Ensure all unit and integration tests pass
    - Verify dashboard loads within 2 seconds with 5 subsidiaries x 5 years of monthly data
    - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- All 57 correctness properties from design.md must have corresponding property-based tests using fast-check
- Property tests use tag format: `Feature: financial-ratio-monitoring-system, Property {N}: {title}`
- Checkpoints ensure incremental validation at the end of each phase
- The ratio calculation engine (Task 2.7) is the core dependency for alerting, benchmarking, and reporting phases
