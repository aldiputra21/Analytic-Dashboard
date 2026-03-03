# Design Document: Financial Ratio Monitoring System

## Overview

The Financial Ratio Monitoring System is a comprehensive web-based platform designed for holding companies to monitor, analyze, and compare the financial performance of up to 5 subsidiary companies in real-time. The system provides standardized financial ratio calculations, multi-company dashboards, early warning alerts, performance benchmarking, and consolidated reporting capabilities.

### System Goals

- Centralized monitoring of financial health across multiple subsidiaries
- Automated calculation of 9 standardized financial ratios (ROA, ROE, NPM, DER, Current Ratio, Quick Ratio, Cash Ratio, OCF Ratio, DSCR)
- Real-time early warning system for financial risks
- Performance benchmarking and comparative analysis
- Role-based access control for Owner, BOD, and Subsidiary Managers
- Historical trend analysis with 5+ years of data retention
- Mobile-responsive dashboard for anytime, anywhere access

### Technology Stack

**Frontend:**
- React 18+ with TypeScript for type safety
- Tailwind CSS for responsive styling
- Recharts for data visualization
- Framer Motion for smooth animations
- React Query for data fetching and caching

**Backend:**
- Node.js with Express.js
- TypeScript for type-safe API development
- SQLite for database (suitable for up to 5 subsidiaries with 5 years of data)

**Additional Libraries:**
- Zod for runtime validation
- date-fns for date manipulation
- xlsx for Excel import/export
- jsPDF for PDF generation


## Architecture

### High-Level Architecture

The system follows a three-tier architecture pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Reports    │  │    Admin     │      │
│  │  Components  │  │  Components  │  │  Components  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         React + TypeScript + Tailwind CSS                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Ratio      │  │    Alert     │  │   Trend      │      │
│  │  Calculator  │  │    Engine    │  │   Analyzer   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Access     │  │    Data      │  │   Report     │      │
│  │   Control    │  │  Validator   │  │  Generator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│              Express.js + TypeScript                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Subsidiaries │  │  Financial   │  │    Users     │      │
│  │              │  │     Data     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Thresholds  │  │    Alerts    │  │  Audit Log   │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                      SQLite Database                         │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

**Core Business Components:**

1. **Ratio Calculator**: Computes 9 financial ratios using standardized formulas
2. **Alert Engine**: Evaluates ratios against thresholds and generates alerts
3. **Trend Analyzer**: Analyzes historical data for patterns and trends
4. **Data Validator**: Validates financial data integrity and consistency
5. **Access Control**: Manages role-based permissions
6. **Report Generator**: Creates consolidated and individual reports

### Data Flow

**Financial Data Entry Flow:**
```
User Input → Data Validator → Database → Ratio Calculator → 
Alert Engine → Dashboard Update → Notification (if alert)
```

**Dashboard Loading Flow:**
```
User Request → Access Control Check → Query Builder → 
Database → Data Aggregator → Response Formatter → Dashboard Render
```

**Alert Generation Flow:**
```
New Financial Data → Ratio Calculator → Threshold Comparator → 
Alert Engine → Alert Storage → Notification Service → User
```


## Components and Interfaces

### Backend API Endpoints

**Subsidiary Management:**
```typescript
POST   /api/subsidiaries              // Create new subsidiary
GET    /api/subsidiaries              // List all subsidiaries
GET    /api/subsidiaries/:id          // Get subsidiary details
PUT    /api/subsidiaries/:id          // Update subsidiary
PATCH  /api/subsidiaries/:id/status   // Activate/deactivate
DELETE /api/subsidiaries/:id          // Delete (with validation)
```

**Financial Data Management:**
```typescript
POST   /api/financial-data            // Create financial entry
POST   /api/financial-data/bulk       // Bulk import from CSV/Excel
GET    /api/financial-data            // Query financial data
                                       // ?subsidiaryId=&period=&startDate=&endDate=
PUT    /api/financial-data/:id        // Update financial entry
DELETE /api/financial-data/:id        // Delete financial entry
GET    /api/financial-data/:id/history // Get version history
```

**Financial Ratios:**
```typescript
GET    /api/ratios                    // Get calculated ratios
                                       // ?subsidiaryId=&period=&startDate=&endDate=
GET    /api/ratios/consolidated       // Get consolidated ratios
GET    /api/ratios/trends             // Get trend analysis
GET    /api/ratios/benchmark          // Get benchmarking data
```

**Alerts:**
```typescript
GET    /api/alerts                    // Get active alerts
                                       // ?subsidiaryId=&severity=&status=
GET    /api/alerts/:id                // Get alert details
PATCH  /api/alerts/:id/acknowledge    // Acknowledge alert
GET    /api/alerts/history            // Get alert history
```

**Thresholds:**
```typescript
GET    /api/thresholds/:subsidiaryId  // Get thresholds for subsidiary
PUT    /api/thresholds/:subsidiaryId  // Update thresholds
POST   /api/thresholds/:subsidiaryId/reset // Reset to defaults
GET    /api/thresholds/history        // Get threshold change history
```

**Reports:**
```typescript
POST   /api/reports/generate          // Generate report
                                       // Body: { type, subsidiaryIds, period, format }
GET    /api/reports/:id               // Download generated report
GET    /api/reports/scheduled         // List scheduled reports
POST   /api/reports/schedule          // Schedule automated report
DELETE /api/reports/schedule/:id      // Delete scheduled report
```

**Users and Access Control:**
```typescript
POST   /api/auth/login                // User authentication
POST   /api/auth/logout               // User logout
GET    /api/auth/me                   // Get current user
POST   /api/users                     // Create user (Owner only)
GET    /api/users                     // List users
PUT    /api/users/:id                 // Update user
PATCH  /api/users/:id/status          // Activate/deactivate user
GET    /api/audit-log                 // Get audit trail
```

### Frontend Component Structure

```
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx       // Main dashboard container
│   │   ├── CompanySelector.tsx       // Multi-company filter
│   │   ├── PeriodSelector.tsx        // Time period filter
│   │   ├── HealthScoreGauge.tsx      // Health score visualization
│   │   ├── RatioCard.tsx             // Individual ratio display
│   │   ├── TrendChart.tsx            // Line chart for trends
│   │   ├── ComparisonChart.tsx       // Bar chart for comparison
│   │   └── AlertPanel.tsx            // Alert notifications
│   ├── reports/
│   │   ├── ConsolidatedReport.tsx    // Consolidated view
│   │   ├── BenchmarkingTable.tsx     // Performance comparison
│   │   ├── TrendAnalysis.tsx         // Historical trends
│   │   └── ExportButton.tsx          // Export functionality
│   ├── admin/
│   │   ├── SubsidiaryManager.tsx     // Subsidiary CRUD
│   │   ├── ThresholdConfig.tsx       // Threshold settings
│   │   ├── UserManager.tsx           // User management
│   │   └── AuditLog.tsx              // Audit trail viewer
│   ├── data-entry/
│   │   ├── FinancialDataForm.tsx     // Manual data entry
│   │   ├── BulkImport.tsx            // CSV/Excel import
│   │   └── DataValidator.tsx         // Validation feedback
│   └── shared/
│       ├── Tooltip.tsx               // Reusable tooltip
│       ├── LoadingSpinner.tsx        // Loading indicator
│       ├── ErrorBoundary.tsx         // Error handling
│       └── ProtectedRoute.tsx        // Access control
├── hooks/
│   ├── useFinancialData.ts           // Financial data queries
│   ├── useRatios.ts                  // Ratio calculations
│   ├── useAlerts.ts                  // Alert management
│   ├── useAuth.ts                    // Authentication
│   └── useTrends.ts                  // Trend analysis
├── services/
│   ├── api.ts                        // API client
│   ├── ratioCalculator.ts            // Client-side calculations
│   └── chartHelpers.ts               // Chart utilities
└── types/
    ├── subsidiary.ts                 // Subsidiary types
    ├── financialData.ts              // Financial data types
    ├── ratio.ts                      // Ratio types
    ├── alert.ts                      // Alert types
    └── user.ts                       // User types
```


## Data Models

### Database Schema

**subsidiaries**
```sql
CREATE TABLE subsidiaries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry_sector TEXT NOT NULL,
  fiscal_year_start_month INTEGER NOT NULL, -- 1-12
  currency TEXT NOT NULL DEFAULT 'IDR',
  tax_rate REAL NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_subsidiaries_active ON subsidiaries(is_active);
CREATE INDEX idx_subsidiaries_industry ON subsidiaries(industry_sector);
```

**financial_data**
```sql
CREATE TABLE financial_data (
  id TEXT PRIMARY KEY,
  subsidiary_id TEXT NOT NULL,
  period_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'annual'
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Income Statement
  revenue REAL NOT NULL,
  net_profit REAL NOT NULL,
  operating_cash_flow REAL NOT NULL,
  interest_expense REAL NOT NULL DEFAULT 0,
  
  -- Balance Sheet
  cash REAL NOT NULL,
  inventory REAL NOT NULL DEFAULT 0,
  current_assets REAL NOT NULL,
  total_assets REAL NOT NULL,
  current_liabilities REAL NOT NULL,
  short_term_debt REAL NOT NULL DEFAULT 0,
  current_portion_long_term_debt REAL NOT NULL DEFAULT 0,
  total_liabilities REAL NOT NULL,
  total_equity REAL NOT NULL,
  
  -- Metadata
  is_restated BOOLEAN NOT NULL DEFAULT 0,
  restatement_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  
  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE(subsidiary_id, period_type, period_start_date)
);

CREATE INDEX idx_financial_data_subsidiary ON financial_data(subsidiary_id);
CREATE INDEX idx_financial_data_period ON financial_data(period_start_date, period_end_date);
CREATE INDEX idx_financial_data_lookup ON financial_data(subsidiary_id, period_type, period_start_date);
```

**calculated_ratios**
```sql
CREATE TABLE calculated_ratios (
  id TEXT PRIMARY KEY,
  financial_data_id TEXT NOT NULL,
  subsidiary_id TEXT NOT NULL,
  
  -- Profitability Ratios
  roa REAL, -- Return on Assets (%)
  roe REAL, -- Return on Equity (%)
  npm REAL, -- Net Profit Margin (%)
  
  -- Leverage Ratio
  der REAL, -- Debt to Equity Ratio
  
  -- Liquidity Ratios
  current_ratio REAL,
  quick_ratio REAL,
  cash_ratio REAL,
  
  -- Cash Flow Ratios
  ocf_ratio REAL, -- Operating Cash Flow Ratio
  dscr REAL, -- Debt Service Coverage Ratio
  
  -- Health Score
  health_score REAL NOT NULL, -- 0-100
  
  calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (financial_data_id) REFERENCES financial_data(id) ON DELETE CASCADE,
  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id),
  UNIQUE(financial_data_id)
);

CREATE INDEX idx_calculated_ratios_subsidiary ON calculated_ratios(subsidiary_id);
CREATE INDEX idx_calculated_ratios_health ON calculated_ratios(health_score);
```

**thresholds**
```sql
CREATE TABLE thresholds (
  id TEXT PRIMARY KEY,
  subsidiary_id TEXT NOT NULL,
  ratio_name TEXT NOT NULL, -- 'roa', 'roe', 'npm', etc.
  period_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'annual'
  
  -- Threshold Levels
  healthy_min REAL, -- Minimum value for healthy status
  moderate_min REAL, -- Minimum value for moderate status
  risky_max REAL, -- Maximum value for risky status (for ratios where lower is worse)
  
  -- For ratios where higher is worse (e.g., DER)
  healthy_max REAL,
  moderate_max REAL,
  risky_min REAL,
  
  is_default BOOLEAN NOT NULL DEFAULT 0, -- Industry default
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT NOT NULL,
  
  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id),
  FOREIGN KEY (updated_by) REFERENCES users(id),
  UNIQUE(subsidiary_id, ratio_name, period_type)
);

CREATE INDEX idx_thresholds_subsidiary ON thresholds(subsidiary_id);
```

**alerts**
```sql
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  subsidiary_id TEXT NOT NULL,
  financial_data_id TEXT NOT NULL,
  ratio_name TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'high', 'medium', 'low'
  
  current_value REAL NOT NULL,
  threshold_value REAL NOT NULL,
  message TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  acknowledged_at DATETIME,
  acknowledged_by TEXT,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id),
  FOREIGN KEY (financial_data_id) REFERENCES financial_data(id),
  FOREIGN KEY (acknowledged_by) REFERENCES users(id)
);

CREATE INDEX idx_alerts_subsidiary ON alerts(subsidiary_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created ON alerts(created_at);
```


**users**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- 'owner', 'bod', 'subsidiary_manager'
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

**user_subsidiary_access**
```sql
CREATE TABLE user_subsidiary_access (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subsidiary_id TEXT NOT NULL,
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  granted_by TEXT NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id),
  UNIQUE(user_id, subsidiary_id)
);

CREATE INDEX idx_user_access_user ON user_subsidiary_access(user_id);
CREATE INDEX idx_user_access_subsidiary ON user_subsidiary_access(subsidiary_id);
```

**audit_log**
```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'export'
  entity_type TEXT NOT NULL, -- 'financial_data', 'subsidiary', 'user', etc.
  entity_id TEXT,
  subsidiary_id TEXT, -- For filtering by subsidiary
  
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  justification TEXT,
  
  ip_address TEXT,
  user_agent TEXT,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subsidiary_id) REFERENCES subsidiaries(id)
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_subsidiary ON audit_log(subsidiary_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
```

**scheduled_reports**
```sql
CREATE TABLE scheduled_reports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'consolidated', 'individual', 'benchmark'
  subsidiary_ids TEXT NOT NULL, -- JSON array
  period_type TEXT NOT NULL,
  format TEXT NOT NULL, -- 'pdf', 'excel'
  
  schedule_frequency TEXT NOT NULL, -- 'monthly', 'quarterly', 'annual'
  schedule_day INTEGER NOT NULL, -- Day of month (1-31)
  
  recipients TEXT NOT NULL, -- JSON array of email addresses
  
  is_active BOOLEAN NOT NULL DEFAULT 1,
  last_run DATETIME,
  next_run DATETIME NOT NULL,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_scheduled_reports_next_run ON scheduled_reports(next_run, is_active);
```

**financial_data_history**
```sql
CREATE TABLE financial_data_history (
  id TEXT PRIMARY KEY,
  financial_data_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  
  -- All financial_data fields
  subsidiary_id TEXT NOT NULL,
  period_type TEXT NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  revenue REAL NOT NULL,
  net_profit REAL NOT NULL,
  operating_cash_flow REAL NOT NULL,
  interest_expense REAL NOT NULL,
  cash REAL NOT NULL,
  inventory REAL NOT NULL,
  current_assets REAL NOT NULL,
  total_assets REAL NOT NULL,
  current_liabilities REAL NOT NULL,
  short_term_debt REAL NOT NULL,
  current_portion_long_term_debt REAL NOT NULL,
  total_liabilities REAL NOT NULL,
  total_equity REAL NOT NULL,
  
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_by TEXT NOT NULL,
  change_reason TEXT,
  
  FOREIGN KEY (financial_data_id) REFERENCES financial_data(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE INDEX idx_financial_data_history_lookup ON financial_data_history(financial_data_id, version);
```

### TypeScript Type Definitions

```typescript
// Subsidiary Types
export interface Subsidiary {
  id: string;
  name: string;
  industrySector: string;
  fiscalYearStartMonth: number; // 1-12
  currency: string;
  taxRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateSubsidiaryInput {
  name: string;
  industrySector: string;
  fiscalYearStartMonth: number;
  currency?: string;
  taxRate: number;
}

// Financial Data Types
export type PeriodType = 'monthly' | 'quarterly' | 'annual';

export interface FinancialData {
  id: string;
  subsidiaryId: string;
  periodType: PeriodType;
  periodStartDate: Date;
  periodEndDate: Date;
  
  // Income Statement
  revenue: number;
  netProfit: number;
  operatingCashFlow: number;
  interestExpense: number;
  
  // Balance Sheet
  cash: number;
  inventory: number;
  currentAssets: number;
  totalAssets: number;
  currentLiabilities: number;
  shortTermDebt: number;
  currentPortionLongTermDebt: number;
  totalLiabilities: number;
  totalEquity: number;
  
  // Metadata
  isRestated: boolean;
  restatementReason?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateFinancialDataInput {
  subsidiaryId: string;
  periodType: PeriodType;
  periodStartDate: Date;
  periodEndDate: Date;
  revenue: number;
  netProfit: number;
  operatingCashFlow: number;
  interestExpense?: number;
  cash: number;
  inventory?: number;
  currentAssets: number;
  totalAssets: number;
  currentLiabilities: number;
  shortTermDebt?: number;
  currentPortionLongTermDebt?: number;
  totalLiabilities: number;
  totalEquity: number;
}

// Ratio Types
export interface CalculatedRatios {
  id: string;
  financialDataId: string;
  subsidiaryId: string;
  
  // Profitability
  roa: number | null; // %
  roe: number | null; // %
  npm: number | null; // %
  
  // Leverage
  der: number | null;
  
  // Liquidity
  currentRatio: number | null;
  quickRatio: number | null;
  cashRatio: number | null;
  
  // Cash Flow
  ocfRatio: number | null;
  dscr: number | null;
  
  healthScore: number; // 0-100
  calculatedAt: Date;
}

export type RatioName = 'roa' | 'roe' | 'npm' | 'der' | 
  'currentRatio' | 'quickRatio' | 'cashRatio' | 'ocfRatio' | 'dscr';

// Threshold Types
export interface Threshold {
  id: string;
  subsidiaryId: string;
  ratioName: RatioName;
  periodType: PeriodType;
  
  // For ratios where higher is better
  healthyMin?: number;
  moderateMin?: number;
  riskyMax?: number;
  
  // For ratios where lower is better
  healthyMax?: number;
  moderateMax?: number;
  riskyMin?: number;
  
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export type ThresholdStatus = 'healthy' | 'moderate' | 'risky';

// Alert Types
export type AlertSeverity = 'high' | 'medium' | 'low';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  subsidiaryId: string;
  financialDataId: string;
  ratioName: RatioName;
  severity: AlertSeverity;
  currentValue: number;
  thresholdValue: number;
  message: string;
  status: AlertStatus;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
}

// User Types
export type UserRole = 'owner' | 'bod' | 'subsidiary_manager';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface UserSubsidiaryAccess {
  id: string;
  userId: string;
  subsidiaryId: string;
  grantedAt: Date;
  grantedBy: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'export';
  entityType: string;
  entityId?: string;
  subsidiaryId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  justification?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Subsidiary Unique Identifier Assignment

*For any* set of subsidiaries created in the system, all subsidiary IDs must be unique.

**Validates: Requirements 1.3**

### Property 2: Subsidiary Profile Data Completeness

*For any* subsidiary registration, all required profile fields (name, industry sector, fiscal year start date, currency, tax rate) must be captured and stored in the database.

**Validates: Requirements 1.2**

### Property 3: Default Threshold Initialization

*For any* newly created subsidiary, the system must automatically create default threshold records for all 9 financial ratios based on the subsidiary's industry sector.

**Validates: Requirements 1.4, 15.2**

### Property 4: Subsidiary Status Toggle Persistence

*For any* subsidiary, toggling its active status (activate/deactivate) must persist the new status in the database and be reflected in subsequent queries.

**Validates: Requirements 1.5**

### Property 5: Subsidiary Deletion Protection

*For any* subsidiary that has associated financial data records, deletion attempts must be rejected and the subsidiary must remain in the database.

**Validates: Requirements 1.6**

### Property 6: Financial Data Validation

*For any* financial data submission, the system must validate that: (1) all required fields are present, and (2) the accounting equation holds (total_assets = total_equity + total_liabilities within 0.01% tolerance). Invalid submissions must be rejected.

**Validates: Requirements 2.1, 2.2**

### Property 7: Automatic Ratio Calculation

*For any* valid financial data entry, the system must automatically calculate all 9 financial ratios (ROA, ROE, NPM, DER, Current Ratio, Quick Ratio, Cash Ratio, OCF Ratio, DSCR) and store them in the calculated_ratios table.

**Validates: Requirements 2.3**

### Property 8: Bulk Import Error Reporting

*For any* bulk import file containing validation errors, the system must generate an error report that identifies the specific row numbers and field names with issues.

**Validates: Requirements 2.5**

### Property 9: Financial Data Association

*For any* financial data entry, it must be associated with a valid subsidiary ID and have valid period information (period type, start date, end date).

**Validates: Requirements 2.6**

### Property 10: Subsidiary-Period Uniqueness

*For any* subsidiary and period combination (subsidiary_id, period_type, period_start_date), only one financial data entry must exist. Duplicate submissions must be rejected.

**Validates: Requirements 2.7**

### Property 11: Financial Ratio Formula Correctness

*For any* financial data with non-zero denominators, all financial ratios must be calculated according to their standard formulas:
- ROA = (Net Profit / Total Assets) × 100
- ROE = (Net Profit / Total Equity) × 100
- NPM = (Net Profit / Revenue) × 100
- DER = Total Liabilities / Total Equity
- Current Ratio = Current Assets / Current Liabilities
- Quick Ratio = (Current Assets - Inventory) / Current Liabilities
- Cash Ratio = Cash / Current Liabilities
- OCF Ratio = Operating Cash Flow / Current Liabilities
- DSCR = Operating Cash Flow / (Interest Expense + Short-term Debt + Current Portion of Long-term Debt)

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

### Property 12: Active Subsidiaries Display

*For any* set of active subsidiaries in the system, the dashboard must display financial ratio metrics for all of them simultaneously.

**Validates: Requirements 4.1**

### Property 13: Subsidiary Color Consistency

*For any* subsidiary, the color assigned to it must be consistent across all dashboard visualizations (charts, gauges, tables).

**Validates: Requirements 4.3**

### Property 14: Health Score Visual Indicators

*For any* subsidiary with a calculated health score, the dashboard gauge must display the correct visual indicator: red for 0-50 (risky), yellow for 51-75 (moderate), green for 76-100 (healthy).

**Validates: Requirements 4.4**

### Property 15: Year-over-Year Growth Calculation

*For any* two consecutive years of financial data for a subsidiary, the year-over-year growth percentage for revenue and profit must be calculated as: ((Current Year - Previous Year) / Previous Year) × 100.

**Validates: Requirements 4.6**

### Property 16: Last Update Timestamp Display

*For any* subsidiary with financial data, the dashboard must display the timestamp of the most recent financial data entry for that subsidiary.

**Validates: Requirements 4.9**

### Property 17: Threshold Breach Alert Generation

*For any* financial ratio value that falls below its healthy minimum threshold or exceeds its healthy maximum threshold, the alert engine must generate a risk alert with appropriate severity level (high, medium, or low).

**Validates: Requirements 5.1, 5.3, 5.4, 5.5, 5.6**

### Property 18: Alert Severity Classification

*For any* generated alert, it must be classified into exactly one of three severity levels: high, medium, or low, based on the threshold breach magnitude and ratio type.

**Validates: Requirements 5.2**

### Property 19: Declining Trend Alert

*For any* subsidiary with 3 consecutive periods showing declining profitability ratios (ROA, ROE, or NPM), the system must generate a medium severity alert.

**Validates: Requirements 5.7**

### Property 20: Custom Threshold Configuration

*For any* subsidiary and ratio combination, an owner user must be able to set custom threshold values, and these values must be persisted and used for subsequent alert evaluations.

**Validates: Requirements 5.10, 15.1**

### Property 21: Performance Ranking Calculation

*For any* financial ratio and set of active subsidiaries, the system must calculate relative performance rankings (1st, 2nd, 3rd, etc.) where the subsidiary with the best ratio value receives rank 1.

**Validates: Requirements 6.1**

### Property 22: Leading Subsidiary Identification

*For any* financial ratio category, the subsidiary with the best performance (highest for profitability/liquidity ratios, lowest for leverage ratios) must be identified and highlighted.

**Validates: Requirements 6.3**

### Property 23: Performance Gap Calculation

*For any* subsidiary and ratio, the percentage difference from the best-performing subsidiary must be calculated as: ((Best Value - Current Value) / Best Value) × 100.

**Validates: Requirements 6.4**

### Property 24: Portfolio Average Calculation

*For any* financial ratio and set of active subsidiaries, the portfolio-wide average must be calculated as the arithmetic mean of all subsidiary values for that ratio.

**Validates: Requirements 6.5**

### Property 25: Variance from Average Calculation

*For any* subsidiary and ratio, the variance from portfolio average must be calculated as: Current Value - Portfolio Average.

**Validates: Requirements 6.6**

### Property 26: Industry Benchmark Comparison

*For any* subsidiary with available industry benchmark data, the system must compare the subsidiary's ratios against industry standards and calculate the variance.

**Validates: Requirements 6.7**

### Property 27: Consolidated Financial Aggregation

*For any* set of active subsidiaries, the consolidated report must aggregate financial data correctly:
- Total revenue = sum of all subsidiary revenues
- Total net profit = sum of all subsidiary net profits
- Total assets = sum of all subsidiary total assets
- Total equity = sum of all subsidiary total equity
- Total liabilities = sum of all subsidiary total liabilities

**Validates: Requirements 7.1, 7.4**

### Property 28: Consolidated Ratio Calculation

*For any* consolidated financial data, consolidated ratios must be calculated using the aggregated totals according to standard ratio formulas.

**Validates: Requirements 7.3**

### Property 29: Subsidiary Contribution Percentage

*For any* subsidiary in a consolidated report, its contribution percentage to total group revenue and profit must be calculated as: (Subsidiary Value / Total Group Value) × 100.

**Validates: Requirements 7.5**

### Property 30: Consolidated Report Period Types

*For any* period type (monthly, quarterly, annual), the system must be able to generate a consolidated report for that period type.

**Validates: Requirements 7.7**

### Property 31: Historical Data Retention

*For any* subsidiary, financial ratio data must be retained in the database for a minimum of 5 years from the period end date.

**Validates: Requirements 8.1**

### Property 32: Moving Average Calculation

*For any* financial ratio with sufficient historical data, the system must calculate 3-month and 12-month moving averages correctly using the arithmetic mean of the respective periods.

**Validates: Requirements 8.3**

### Property 33: Significant Trend Change Detection

*For any* financial ratio with 3 consecutive periods, if the value increases or decreases by more than 20% from the first to the third period, the system must flag this as a significant trend change.

**Validates: Requirements 8.4**

### Property 34: CAGR Calculation

*For any* multi-year revenue or profit data, the compound annual growth rate must be calculated as: CAGR = ((Ending Value / Beginning Value)^(1/Number of Years) - 1) × 100.

**Validates: Requirements 8.6**

### Property 35: Owner Full Access Permission

*For any* user with owner role, the access control system must grant full access to all subsidiary data, system configuration, and user management functions.

**Validates: Requirements 9.2**

### Property 36: BOD Read-Only Access Permission

*For any* user with BOD role, the access control system must grant read access to all subsidiary data and consolidated reports, but deny access to configuration and user management functions.

**Validates: Requirements 9.3**

### Property 37: Subsidiary Manager Limited Access

*For any* user with subsidiary_manager role, the access control system must grant access only to subsidiaries explicitly assigned to that user in the user_subsidiary_access table.

**Validates: Requirements 9.4**

### Property 38: Owner User Management Permission

*For any* user with owner role, the system must allow them to create, modify, and deactivate user accounts.

**Validates: Requirements 9.5**

### Property 39: Strong Password Validation

*For any* password submission, the system must validate that it meets the strong password policy: minimum 12 characters including at least one uppercase letter, one lowercase letter, one number, and one special character.

**Validates: Requirements 9.6**

### Property 40: Comprehensive Audit Logging

*For any* operation that modifies data (financial data insert/update/delete, user authentication, data export, backup/restore), the system must create an audit log entry with user ID, timestamp, action type, and affected entities.

**Validates: Requirements 9.8, 10.7, 11.1, 14.8**

### Property 41: Multiple Subsidiary Access Assignment

*For any* user account, the owner must be able to assign access permissions to multiple subsidiaries, and all assignments must be stored in the user_subsidiary_access table.

**Validates: Requirements 9.9**

### Property 42: Unauthorized Access Denial and Logging

*For any* user attempting to access data outside their permission scope, the access control system must deny the access and create an audit log entry recording the unauthorized attempt.

**Validates: Requirements 9.10**

### Property 43: Export Metadata Inclusion

*For any* data export operation, the exported file must include metadata: export date, period range, and the username of the user who generated the export.

**Validates: Requirements 10.4**

### Property 44: Export Permission Enforcement

*For any* export request, the system must apply access control permissions and only allow users to export data they have permission to view.

**Validates: Requirements 10.8**

### Property 45: Audit Log Entry Completeness

*For any* audit log entry for financial data operations, it must capture all required fields: user ID, timestamp, affected subsidiary, period, changed fields, old values, and new values.

**Validates: Requirements 11.2**

### Property 46: Historical Data Modification Protection

*For any* financial data entry with a period end date older than the current fiscal year, modification attempts by non-owner users must be rejected.

**Validates: Requirements 11.3**

### Property 47: Restatement Requirements

*For any* historical financial data modification that is approved, the system must require a justification comment and set the is_restated flag to true.

**Validates: Requirements 11.4**

### Property 48: Cascading Ratio Recalculation

*For any* financial data update operation, the system must automatically recalculate all dependent financial ratios in the calculated_ratios table.

**Validates: Requirements 11.5**

### Property 49: Financial Data Versioning

*For any* financial data entry that is modified, the system must create a new version record in the financial_data_history table preserving the previous values.

**Validates: Requirements 11.6**

### Property 50: Unusual Data Pattern Detection

*For any* financial data entry where a value differs by more than 50% from the previous period's value, the system must generate an alert flagging the unusual pattern.

**Validates: Requirements 11.8**

### Property 51: Ratio Calculation Caching

*For any* financial ratio query that is repeated within a short time window (e.g., 5 minutes), the system must return cached results rather than recalculating from the database.

**Validates: Requirements 12.4**

### Property 52: Data Archival

*For any* financial data with a period end date older than 10 years, the system must move the data to an archive table to maintain optimal database performance.

**Validates: Requirements 12.8**

### Property 53: Threshold Validation

*For any* threshold configuration, the system must validate that healthy threshold values are more favorable than moderate threshold values (healthy_min > moderate_min for profitability ratios, healthy_max < moderate_max for leverage ratios).

**Validates: Requirements 15.3**

### Property 54: Threshold Change Re-evaluation

*For any* threshold modification, the alert engine must re-evaluate all current financial ratio values against the new thresholds and generate or resolve alerts accordingly.

**Validates: Requirements 15.4**

### Property 55: Threshold Change History

*For any* threshold value modification, the system must create a history record capturing the old values, new values, timestamp, and the user who made the change.

**Validates: Requirements 15.5**

### Property 56: Threshold Reset to Defaults

*For any* subsidiary, an owner user must be able to reset all threshold values to industry defaults, and the system must restore the default values based on the subsidiary's industry sector.

**Validates: Requirements 15.6**

### Property 57: Period-Specific Thresholds

*For any* subsidiary and ratio combination, the system must support different threshold values for different period types (monthly, quarterly, annual), and the correct threshold must be used based on the financial data's period type.

**Validates: Requirements 15.8**


## Error Handling

### Error Categories

**1. Validation Errors (400 Bad Request)**
- Missing required fields in financial data submission
- Invalid data types or formats
- Accounting equation imbalance (assets ≠ equity + liabilities)
- Duplicate subsidiary-period combinations
- Invalid threshold configurations (healthy < moderate)
- Weak passwords that don't meet policy requirements

**2. Authorization Errors (401 Unauthorized, 403 Forbidden)**
- Invalid or expired authentication tokens
- Insufficient permissions for requested operation
- Subsidiary managers accessing non-assigned subsidiaries
- Non-owner users attempting configuration changes

**3. Resource Not Found Errors (404 Not Found)**
- Requested subsidiary ID does not exist
- Financial data entry not found
- User account not found
- Report ID not found

**4. Business Logic Errors (422 Unprocessable Entity)**
- Attempting to delete subsidiary with historical data
- Attempting to register more than 5 subsidiaries
- Attempting to modify historical data without owner approval
- Division by zero in ratio calculations (returns null instead of error)

**5. System Errors (500 Internal Server Error)**
- Database connection failures
- File system errors during export/import
- Email delivery failures for scheduled reports
- Backup/restore operation failures

### Error Response Format

All API errors return a consistent JSON structure:

```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Additional error context
    field?: string;         // Field name for validation errors
    timestamp: string;      // ISO 8601 timestamp
    requestId: string;      // Unique request identifier for tracking
  };
}
```

### Error Handling Strategies

**Frontend Error Handling:**
- Display user-friendly error messages in toast notifications
- Highlight invalid form fields with inline error messages
- Provide retry mechanisms for transient failures
- Log errors to browser console for debugging
- Implement error boundaries to prevent full app crashes

**Backend Error Handling:**
- Wrap all async operations in try-catch blocks
- Log all errors with stack traces and context
- Return appropriate HTTP status codes
- Sanitize error messages to avoid exposing sensitive information
- Implement circuit breakers for external service calls

**Data Integrity Protection:**
- Use database transactions for multi-step operations
- Implement optimistic locking for concurrent updates
- Validate data at both client and server sides
- Maintain audit trail of all data modifications
- Implement automatic backup before destructive operations

### Graceful Degradation

**When ratio calculation fails (zero denominator):**
- Return null for the affected ratio
- Log a warning with subsidiary and period details
- Display "N/A" in the dashboard
- Continue calculating other ratios

**When external services fail (email, backup):**
- Queue operations for retry with exponential backoff
- Log failures for manual intervention
- Display warning to users about delayed operations
- Maintain system functionality for core features

**When database performance degrades:**
- Return cached data with staleness indicator
- Implement query timeouts to prevent hanging
- Provide simplified views with reduced data
- Alert administrators about performance issues


## Testing Strategy

### Dual Testing Approach

The system will employ both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, error conditions, and integration points between components. Unit tests are helpful for concrete scenarios but should be balanced—avoid writing too many unit tests since property-based tests handle covering lots of inputs.

**Property Tests**: Verify universal properties that hold for all inputs through randomized testing. Property tests provide comprehensive input coverage and catch edge cases that might be missed in manual test case design.

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing Configuration

**Library Selection:**
- **Frontend (TypeScript)**: fast-check library for property-based testing
- **Backend (TypeScript/Node.js)**: fast-check library for property-based testing

**Test Configuration:**
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `Feature: financial-ratio-monitoring-system, Property {number}: {property_text}`

**Example Property Test Structure:**

```typescript
import fc from 'fast-check';

describe('Feature: financial-ratio-monitoring-system', () => {
  test('Property 11: Financial Ratio Formula Correctness', () => {
    // Feature: financial-ratio-monitoring-system, Property 11: Financial Ratio Formula Correctness
    fc.assert(
      fc.property(
        fc.record({
          netProfit: fc.float({ min: -1000000, max: 1000000 }),
          totalAssets: fc.float({ min: 1, max: 10000000 }),
          totalEquity: fc.float({ min: 1, max: 10000000 }),
          revenue: fc.float({ min: 1, max: 10000000 }),
          // ... other fields
        }),
        (financialData) => {
          const ratios = calculateRatios(financialData);
          
          // Verify ROA calculation
          const expectedROA = (financialData.netProfit / financialData.totalAssets) * 100;
          expect(ratios.roa).toBeCloseTo(expectedROA, 2);
          
          // Verify ROE calculation
          const expectedROE = (financialData.netProfit / financialData.totalEquity) * 100;
          expect(ratios.roe).toBeCloseTo(expectedROE, 2);
          
          // ... verify other ratios
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

**Backend Unit Tests:**
- API endpoint request/response validation
- Database query correctness
- Authentication and authorization logic
- Ratio calculation edge cases (zero denominators, negative values)
- Alert generation for specific threshold breaches
- Data validation rules
- Error handling and error response formats

**Frontend Unit Tests:**
- Component rendering with various props
- User interaction handlers (clicks, form submissions)
- Data formatting and display logic
- Chart configuration and data transformation
- Form validation logic
- Error message display

**Integration Tests:**
- End-to-end API workflows (create subsidiary → add financial data → view dashboard)
- Database transaction rollback on errors
- File upload and processing (CSV/Excel import)
- Report generation and export
- Email delivery for scheduled reports
- Session management and timeout

### Test Coverage Goals

- **Code Coverage**: Minimum 80% line coverage for business logic
- **Property Coverage**: All 57 correctness properties must have corresponding property tests
- **Edge Case Coverage**: Explicit unit tests for:
  - Zero denominators in ratio calculations
  - Empty datasets (no subsidiaries, no financial data)
  - Maximum limits (5 subsidiaries, 5 years of data)
  - Boundary values for thresholds
  - Concurrent user access scenarios
  - Invalid file formats for import

### Testing Tools and Frameworks

**Frontend:**
- Jest for unit testing
- React Testing Library for component testing
- fast-check for property-based testing
- MSW (Mock Service Worker) for API mocking
- Playwright for end-to-end testing

**Backend:**
- Jest for unit testing
- Supertest for API endpoint testing
- fast-check for property-based testing
- SQLite in-memory database for test isolation
- Faker.js for test data generation

### Continuous Integration

- Run all tests on every pull request
- Fail builds if any test fails or coverage drops below threshold
- Run property tests with increased iterations (500+) in nightly builds
- Generate test coverage reports and track trends
- Run performance tests weekly to catch regressions

### Test Data Management

**Test Data Generators:**
- Generate random but valid financial data (respecting accounting equation)
- Generate subsidiaries with various industry sectors
- Generate users with different roles and permissions
- Generate historical data spanning multiple years
- Generate threshold configurations with valid ranges

**Test Database:**
- Use SQLite in-memory database for fast test execution
- Reset database state between tests for isolation
- Seed database with known test data for specific scenarios
- Use database transactions to rollback changes after tests

### Performance Testing

While property-based tests focus on correctness, separate performance tests will verify:
- Dashboard load time with maximum data (5 subsidiaries × 5 years × 12 months)
- API response time for complex queries (consolidated reports, trend analysis)
- Concurrent user access (20 simultaneous users)
- Bulk import processing speed (1000+ rows)
- Database query performance with proper indexing

Performance tests will use tools like:
- Apache JMeter for load testing
- Lighthouse for frontend performance
- Database query profiling tools

### Security Testing

- Penetration testing for authentication and authorization
- SQL injection prevention verification
- XSS and CSRF protection testing
- Password strength validation
- Session hijacking prevention
- Audit log integrity verification


## Security Design

### Authentication

**JWT-Based Authentication:**
- Use JSON Web Tokens (JWT) for stateless authentication
- Access tokens expire after 30 minutes
- Refresh tokens expire after 7 days
- Store refresh tokens in httpOnly cookies
- Implement token rotation on refresh

**Password Security:**
- Hash passwords using bcrypt with salt rounds = 12
- Enforce strong password policy (12+ characters, mixed case, numbers, special chars)
- Implement password history to prevent reuse of last 5 passwords
- Lock account after 5 failed login attempts
- Require password change every 90 days for owner/BOD roles

### Authorization

**Role-Based Access Control (RBAC):**

```typescript
const permissions = {
  owner: {
    subsidiaries: ['create', 'read', 'update', 'delete', 'activate'],
    financialData: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    thresholds: ['read', 'update', 'reset'],
    reports: ['read', 'export', 'schedule'],
    auditLog: ['read'],
    config: ['read', 'update']
  },
  bod: {
    subsidiaries: ['read'],
    financialData: ['read'],
    users: [],
    thresholds: ['read'],
    reports: ['read', 'export'],
    auditLog: [],
    config: []
  },
  subsidiary_manager: {
    subsidiaries: ['read'], // Only assigned subsidiaries
    financialData: ['create', 'read', 'update'], // Only assigned subsidiaries
    users: [],
    thresholds: ['read'], // Only assigned subsidiaries
    reports: ['read', 'export'], // Only assigned subsidiaries
    auditLog: [],
    config: []
  }
};
```

**Middleware Implementation:**
```typescript
// Check if user has permission for action on resource
function authorize(resource: string, action: string) {
  return async (req, res, next) => {
    const user = req.user; // From JWT
    const userPermissions = permissions[user.role];
    
    if (!userPermissions[resource]?.includes(action)) {
      await auditLog.create({
        userId: user.id,
        action: 'unauthorized_access_attempt',
        resource,
        ipAddress: req.ip
      });
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // For subsidiary_manager, check subsidiary access
    if (user.role === 'subsidiary_manager') {
      const subsidiaryId = req.params.subsidiaryId || req.body.subsidiaryId;
      const hasAccess = await checkSubsidiaryAccess(user.id, subsidiaryId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    
    next();
  };
}
```

### Data Protection

**Encryption:**
- Encrypt sensitive data at rest (passwords, backup files)
- Use AES-256 encryption for backup files
- Use TLS 1.3 for data in transit
- Encrypt database connection strings in environment variables

**Data Sanitization:**
- Sanitize all user inputs to prevent SQL injection
- Use parameterized queries for all database operations
- Escape HTML in user-generated content to prevent XSS
- Validate and sanitize file uploads (CSV/Excel)

**Audit Trail:**
- Log all authentication attempts (success and failure)
- Log all data modifications with before/after values
- Log all unauthorized access attempts
- Log all export operations
- Retain audit logs for 7 years for compliance

### Session Management

**Session Security:**
- Implement session timeout after 30 minutes of inactivity
- Invalidate all sessions on password change
- Implement concurrent session limits (max 3 active sessions per user)
- Store session metadata (IP address, user agent, last activity)
- Provide "logout all devices" functionality

**CSRF Protection:**
- Implement CSRF tokens for all state-changing operations
- Validate CSRF tokens on server side
- Use SameSite cookie attribute for session cookies

### API Security

**Rate Limiting:**
- Implement rate limiting per user: 100 requests per minute
- Implement stricter rate limiting for authentication endpoints: 5 attempts per 15 minutes
- Return 429 Too Many Requests when limit exceeded

**Input Validation:**
- Validate all inputs against expected schemas using Zod
- Reject requests with unexpected fields
- Validate file types and sizes for uploads
- Sanitize file names to prevent directory traversal

**CORS Configuration:**
- Configure CORS to allow only trusted origins
- Restrict allowed HTTP methods
- Limit exposed headers


## Performance Optimization

### Database Optimization

**Indexing Strategy:**
```sql
-- Primary indexes (already defined in schema)
CREATE INDEX idx_subsidiaries_active ON subsidiaries(is_active);
CREATE INDEX idx_financial_data_subsidiary ON financial_data(subsidiary_id);
CREATE INDEX idx_financial_data_period ON financial_data(period_start_date, period_end_date);
CREATE INDEX idx_financial_data_lookup ON financial_data(subsidiary_id, period_type, period_start_date);
CREATE INDEX idx_calculated_ratios_subsidiary ON calculated_ratios(subsidiary_id);
CREATE INDEX idx_alerts_subsidiary ON alerts(subsidiary_id);
CREATE INDEX idx_alerts_status ON alerts(status);

-- Composite indexes for common queries
CREATE INDEX idx_financial_data_subsidiary_period ON financial_data(subsidiary_id, period_start_date DESC);
CREATE INDEX idx_alerts_subsidiary_status ON alerts(subsidiary_id, status, created_at DESC);
CREATE INDEX idx_audit_log_user_date ON audit_log(user_id, created_at DESC);
```

**Query Optimization:**
- Use SELECT only required columns instead of SELECT *
- Implement pagination for large result sets (limit 50 records per page)
- Use database views for complex consolidated queries
- Implement query result caching for frequently accessed data
- Use EXPLAIN QUERY PLAN to identify slow queries

**Connection Pooling:**
- Implement connection pooling with max 10 connections
- Set connection timeout to 30 seconds
- Implement connection retry logic with exponential backoff

### Caching Strategy

**Multi-Level Caching:**

1. **In-Memory Cache (Node.js):**
   - Cache calculated ratios for 5 minutes
   - Cache subsidiary list for 10 minutes
   - Cache user permissions for session duration
   - Use LRU (Least Recently Used) eviction policy
   - Maximum cache size: 100MB

2. **Browser Cache:**
   - Cache static assets (CSS, JS, images) for 1 year
   - Cache API responses with ETags
   - Implement service worker for offline capability

**Cache Invalidation:**
```typescript
// Invalidate cache when data changes
async function updateFinancialData(id: string, data: FinancialData) {
  await db.financialData.update(id, data);
  
  // Invalidate related caches
  cache.delete(`ratios:${data.subsidiaryId}`);
  cache.delete(`consolidated:all`);
  cache.delete(`trends:${data.subsidiaryId}`);
  cache.delete(`benchmark:all`);
}
```

### Frontend Optimization

**Code Splitting:**
- Split code by route (dashboard, reports, admin)
- Lazy load heavy components (charts, data tables)
- Use dynamic imports for rarely used features

**Bundle Optimization:**
- Tree-shake unused code
- Minify and compress JavaScript/CSS
- Use production builds of React
- Implement code splitting with React.lazy()

**Rendering Optimization:**
- Use React.memo() for expensive components
- Implement virtual scrolling for large lists
- Debounce search inputs and filters
- Use useMemo() and useCallback() to prevent unnecessary re-renders
- Implement skeleton screens for loading states

**Data Fetching:**
- Use React Query for data fetching and caching
- Implement optimistic updates for better UX
- Prefetch data for likely next actions
- Use stale-while-revalidate strategy

### Asset Optimization

**Images:**
- Compress images using modern formats (WebP, AVIF)
- Implement responsive images with srcset
- Lazy load images below the fold
- Use SVG for icons and simple graphics

**Fonts:**
- Use system fonts as fallback
- Subset custom fonts to include only used characters
- Preload critical fonts
- Use font-display: swap for better perceived performance

### API Optimization

**Response Optimization:**
- Compress responses with gzip/brotli
- Implement field filtering (allow clients to request specific fields)
- Use pagination for large datasets
- Return only necessary data (avoid over-fetching)

**Batch Operations:**
- Support batch API requests to reduce round trips
- Implement bulk operations for data import
- Use database transactions for batch operations

### Monitoring and Profiling

**Performance Monitoring:**
- Track API response times
- Monitor database query performance
- Track frontend rendering performance
- Set up alerts for performance degradation

**Metrics to Track:**
- Dashboard load time (target: <2 seconds)
- API response time (target: <500ms)
- Database query time (target: <100ms)
- Memory usage
- CPU usage
- Cache hit rate


## Implementation Notes

### Development Phases

**Phase 1: Core Infrastructure (Weeks 1-2)**
- Set up project structure and build configuration
- Implement database schema and migrations
- Create base API server with authentication
- Implement user management and RBAC
- Set up testing framework

**Phase 2: Subsidiary and Financial Data Management (Weeks 3-4)**
- Implement subsidiary CRUD operations
- Implement financial data entry and validation
- Implement ratio calculation engine
- Implement bulk import functionality
- Create data validation rules

**Phase 3: Dashboard and Visualization (Weeks 5-6)**
- Create dashboard layout and navigation
- Implement KPI cards and health score gauges
- Implement trend charts and comparison charts
- Implement company selector and period filters
- Add responsive design for mobile/tablet

**Phase 4: Alerting and Thresholds (Week 7)**
- Implement threshold configuration
- Implement alert engine
- Implement alert display and management
- Implement trend detection for declining ratios

**Phase 5: Reporting and Analytics (Week 8)**
- Implement consolidated reporting
- Implement benchmarking calculations
- Implement trend analysis
- Implement export functionality (PDF, Excel, CSV)

**Phase 6: Advanced Features (Week 9)**
- Implement scheduled reports
- Implement audit trail viewer
- Implement data versioning and history
- Implement backup and restore functionality

**Phase 7: Testing and Optimization (Week 10)**
- Write comprehensive unit tests
- Write property-based tests for all 57 properties
- Perform performance testing and optimization
- Conduct security testing
- Fix bugs and refine UX

**Phase 8: Deployment and Documentation (Week 11)**
- Set up production environment
- Configure monitoring and alerting
- Write user documentation
- Conduct user acceptance testing
- Deploy to production

### Key Implementation Considerations

**Ratio Calculation Engine:**
```typescript
export function calculateRatios(data: FinancialData): CalculatedRatios {
  const ratios: Partial<CalculatedRatios> = {
    financialDataId: data.id,
    subsidiaryId: data.subsidiaryId
  };
  
  // Profitability Ratios
  ratios.roa = data.totalAssets !== 0 
    ? (data.netProfit / data.totalAssets) * 100 
    : null;
  
  ratios.roe = data.totalEquity !== 0 
    ? (data.netProfit / data.totalEquity) * 100 
    : null;
  
  ratios.npm = data.revenue !== 0 
    ? (data.netProfit / data.revenue) * 100 
    : null;
  
  // Leverage Ratio
  ratios.der = data.totalEquity !== 0 
    ? data.totalLiabilities / data.totalEquity 
    : null;
  
  // Liquidity Ratios
  ratios.currentRatio = data.currentLiabilities !== 0 
    ? data.currentAssets / data.currentLiabilities 
    : null;
  
  ratios.quickRatio = data.currentLiabilities !== 0 
    ? (data.currentAssets - data.inventory) / data.currentLiabilities 
    : null;
  
  ratios.cashRatio = data.currentLiabilities !== 0 
    ? data.cash / data.currentLiabilities 
    : null;
  
  // Cash Flow Ratios
  ratios.ocfRatio = data.currentLiabilities !== 0 
    ? data.operatingCashFlow / data.currentLiabilities 
    : null;
  
  const debtService = data.interestExpense + data.shortTermDebt + 
                      data.currentPortionLongTermDebt;
  ratios.dscr = debtService !== 0 
    ? data.operatingCashFlow / debtService 
    : null;
  
  // Calculate Health Score (0-100)
  ratios.healthScore = calculateHealthScore(ratios);
  
  return ratios as CalculatedRatios;
}

function calculateHealthScore(ratios: Partial<CalculatedRatios>): number {
  // Weighted scoring based on ratio values
  let score = 50; // Base score
  
  // Profitability (30% weight)
  if (ratios.roa !== null) {
    score += ratios.roa > 10 ? 10 : ratios.roa > 5 ? 5 : 0;
  }
  if (ratios.roe !== null) {
    score += ratios.roe > 15 ? 10 : ratios.roe > 10 ? 5 : 0;
  }
  if (ratios.npm !== null) {
    score += ratios.npm > 10 ? 10 : ratios.npm > 5 ? 5 : 0;
  }
  
  // Liquidity (30% weight)
  if (ratios.currentRatio !== null) {
    score += ratios.currentRatio > 2 ? 10 : ratios.currentRatio > 1 ? 5 : -10;
  }
  if (ratios.quickRatio !== null) {
    score += ratios.quickRatio > 1.5 ? 10 : ratios.quickRatio > 1 ? 5 : -5;
  }
  if (ratios.cashRatio !== null) {
    score += ratios.cashRatio > 0.5 ? 10 : ratios.cashRatio > 0.2 ? 5 : 0;
  }
  
  // Leverage (20% weight)
  if (ratios.der !== null) {
    score += ratios.der < 1 ? 10 : ratios.der < 2 ? 5 : -10;
  }
  
  // Cash Flow (20% weight)
  if (ratios.ocfRatio !== null) {
    score += ratios.ocfRatio > 0.5 ? 10 : ratios.ocfRatio > 0.2 ? 5 : -5;
  }
  if (ratios.dscr !== null) {
    score += ratios.dscr > 1.5 ? 10 : ratios.dscr > 1 ? 5 : -5;
  }
  
  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
}
```

**Alert Engine:**
```typescript
export async function evaluateAlerts(
  subsidiaryId: string,
  financialDataId: string,
  ratios: CalculatedRatios
): Promise<Alert[]> {
  const alerts: Alert[] = [];
  const thresholds = await getThresholds(subsidiaryId);
  
  // Check each ratio against thresholds
  for (const [ratioName, value] of Object.entries(ratios)) {
    if (value === null || ratioName === 'healthScore') continue;
    
    const threshold = thresholds.find(t => t.ratioName === ratioName);
    if (!threshold) continue;
    
    const alert = checkThreshold(
      subsidiaryId,
      financialDataId,
      ratioName as RatioName,
      value,
      threshold
    );
    
    if (alert) {
      alerts.push(alert);
    }
  }
  
  // Check for specific high-risk conditions
  if (ratios.ocfRatio !== null && ratios.ocfRatio < 0) {
    alerts.push({
      subsidiaryId,
      financialDataId,
      ratioName: 'ocfRatio',
      severity: 'high',
      currentValue: ratios.ocfRatio,
      thresholdValue: 0,
      message: 'Negative operating cash flow detected',
      status: 'active'
    });
  }
  
  if (ratios.der !== null && ratios.der > 2.0) {
    alerts.push({
      subsidiaryId,
      financialDataId,
      ratioName: 'der',
      severity: 'high',
      currentValue: ratios.der,
      thresholdValue: 2.0,
      message: 'Debt to equity ratio exceeds 2.0x',
      status: 'active'
    });
  }
  
  if (ratios.currentRatio !== null && ratios.currentRatio < 1.0) {
    alerts.push({
      subsidiaryId,
      financialDataId,
      ratioName: 'currentRatio',
      severity: 'high',
      currentValue: ratios.currentRatio,
      thresholdValue: 1.0,
      message: 'Current ratio below 1.0x - liquidity risk',
      status: 'active'
    });
  }
  
  return alerts;
}
```

**Consolidated Reporting:**
```typescript
export async function generateConsolidatedReport(
  periodType: PeriodType,
  periodStartDate: Date,
  periodEndDate: Date
): Promise<ConsolidatedReport> {
  const subsidiaries = await getActiveSubsidiaries();
  const financialData = await getFinancialDataForPeriod(
    subsidiaries.map(s => s.id),
    periodType,
    periodStartDate,
    periodEndDate
  );
  
  // Aggregate financial data
  const consolidated = {
    revenue: 0,
    netProfit: 0,
    operatingCashFlow: 0,
    cash: 0,
    currentAssets: 0,
    totalAssets: 0,
    currentLiabilities: 0,
    totalLiabilities: 0,
    totalEquity: 0
  };
  
  for (const data of financialData) {
    consolidated.revenue += data.revenue;
    consolidated.netProfit += data.netProfit;
    consolidated.operatingCashFlow += data.operatingCashFlow;
    consolidated.cash += data.cash;
    consolidated.currentAssets += data.currentAssets;
    consolidated.totalAssets += data.totalAssets;
    consolidated.currentLiabilities += data.currentLiabilities;
    consolidated.totalLiabilities += data.totalLiabilities;
    consolidated.totalEquity += data.totalEquity;
  }
  
  // Calculate consolidated ratios
  const consolidatedRatios = calculateRatios({
    ...consolidated,
    id: 'consolidated',
    subsidiaryId: 'consolidated',
    periodType,
    periodStartDate,
    periodEndDate
  } as FinancialData);
  
  // Calculate contribution percentages
  const contributions = financialData.map(data => ({
    subsidiaryId: data.subsidiaryId,
    revenueContribution: (data.revenue / consolidated.revenue) * 100,
    profitContribution: (data.netProfit / consolidated.netProfit) * 100
  }));
  
  return {
    periodType,
    periodStartDate,
    periodEndDate,
    consolidated,
    consolidatedRatios,
    contributions,
    subsidiaries: financialData
  };
}
```

### Migration Strategy

For existing applications with data:

1. **Database Migration:**
   - Create new tables alongside existing ones
   - Write migration scripts to transform existing data
   - Validate migrated data integrity
   - Run parallel systems during transition period

2. **Data Validation:**
   - Verify accounting equation for all historical data
   - Recalculate all ratios to ensure consistency
   - Validate threshold configurations
   - Check user permissions and access rights

3. **Rollback Plan:**
   - Maintain backup of original database
   - Document rollback procedures
   - Test rollback process in staging environment
   - Keep old system accessible during transition

### Deployment Considerations

**Environment Variables:**
```env
# Database
DATABASE_URL=./data/financial-monitoring.db

# Authentication
JWT_SECRET=<random-secret-key>
JWT_EXPIRY=30m
REFRESH_TOKEN_EXPIRY=7d

# Email (for scheduled reports)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=reports@company.com
SMTP_PASSWORD=<password>

# Backup
BACKUP_LOCATION=/backups
BACKUP_ENCRYPTION_KEY=<encryption-key>

# Performance
CACHE_TTL=300
MAX_CONNECTIONS=10

# Security
SESSION_TIMEOUT=1800
MAX_LOGIN_ATTEMPTS=5
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

**Production Checklist:**
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure CORS for production domain
- [ ] Set up automated backups
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Set up CDN for static assets
- [ ] Enable database encryption at rest
- [ ] Configure automated security updates
- [ ] Set up disaster recovery procedures
- [ ] Document operational procedures

