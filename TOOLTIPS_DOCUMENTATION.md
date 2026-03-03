# Financial Dashboard Tooltips Documentation

This document describes all the tooltips and descriptions added to the financial dashboard to help users understand financial terms and metrics.

## Overview

Tooltips have been added throughout the dashboard to provide clear, concise explanations of financial terms, metrics, and concepts. When users hover over the information icon (ℹ️) next to any term, they will see:
- **Title**: The full name of the metric or term
- **Description**: A brief explanation in plain English

## Implementation

### Files Created

1. **src/tooltips.ts** - Contains all metric descriptions organized by category
2. **src/components/Tooltip.tsx** - Reusable tooltip component with hover functionality

### Tooltip Categories

#### 1. Profitability Ratios
- **ROA (Return on Assets)**: Measures how efficiently a company uses its assets to generate profit
- **ROE (Return on Equity)**: Rate of return on shareholder equity investments
- **NPM (Net Profit Margin)**: Percentage of revenue remaining as profit after all expenses

#### 2. Leverage Ratios
- **DER (Debt-to-Equity Ratio)**: Measures financial leverage by comparing total liabilities to shareholder equity

#### 3. Liquidity Ratios
- **Current Ratio**: Ability to pay short-term obligations with current assets
- **Quick Ratio**: Ability to meet short-term obligations with most liquid assets
- **Cash Ratio**: Most conservative liquidity measure using only cash and cash equivalents
- **Operating Cash Flow Ratio**: Measures ability to cover current liabilities with cash from operations
- **DSCR (Debt Service Coverage Ratio)**: Ability to service debt obligations with operating cash flow

#### 4. Financial Statement Items
- **Revenue**: Total income generated from business operations before expenses
- **Net Profit**: Bottom-line profit after all expenses, taxes, and costs
- **Total Assets**: Sum of all resources owned by the company with economic value
- **Total Equity**: Residual interest in assets after deducting liabilities
- **Total Liabilities**: Sum of all financial obligations and debts owed
- **Current Assets**: Assets expected to be converted to cash within one year
- **Current Liabilities**: Obligations due within one year or operating cycle
- **Quick Assets**: Highly liquid assets that can be quickly converted to cash
- **Cash and Cash Equivalents**: Most liquid assets including currency and bank deposits
- **Operating Cash Flow**: Cash generated from core business operations
- **Accounts Receivable Aging 90+ Days**: Outstanding customer invoices overdue by more than 90 days
- **Interest Expense**: Cost of borrowed funds and debt financing
- **Short-Term Debt**: Debt obligations due within one year
- **Long-Term Debt**: Debt obligations due beyond one year

#### 5. Dashboard Sections
- **Strategic Performance Index**: Aggregate corporate health metric combining profitability, liquidity, solvency, and efficiency
- **Profitability**: Ability to generate earnings relative to revenue, assets, and equity
- **Liquidity**: Ability to meet short-term financial obligations with available assets
- **Solvency**: Long-term financial stability and ability to meet all obligations
- **Efficiency**: How effectively the company uses its resources to generate revenue
- **Annual Growth**: Year-over-year percentage increase in key financial metrics
- **Revenue Growth**: Percentage increase in total revenue compared to previous period
- **Profit Growth**: Percentage increase in net profit compared to previous period
- **YoY (Year-over-Year)**: Comparison of current period performance to same period last year

#### 6. Risk & Alerts
- **Strategic Risk Alerts**: Early warning system for financial health deterioration
- **Cash Flow Risk**: Risk of insufficient cash generation to support operations
- **Solvency Risk**: Risk of excessive debt burden relative to equity
- **Liquidity Risk**: Risk of inability to meet short-term financial obligations
- **Profitability Risk**: Risk of declining profit margins and earnings quality
- **Governance Risk Matrix**: Strategic risk exposure assessment across operational and financial dimensions
- **Composite Risk Profile**: Overall risk rating combining multiple risk factors
- **Market Volatility**: Exposure to market price fluctuations and economic uncertainty
- **Credit Exposure**: Risk of customer payment defaults and receivables collection issues
- **Operational Integrity**: Stability and reliability of core business operations

#### 7. Charts & Analytics
- **Revenue & Profitability Dynamics**: Strategic growth trajectories showing revenue and profit trends
- **Operational Efficiency Ratios**: NPM & ROE performance tracking operational effectiveness
- **Value Creation Waterfall**: Revenue to net income bridge showing profit transformation stages
- **Asset Composition**: Current vs non-current assets distribution
- **Capital Structure**: Equity vs debt ratio showing financing mix
- **Liquidity & Cash Sustainability**: Operational cash flow dynamics and cash generation capacity
- **Strategic Trend Forecasting**: Revenue trajectory analysis with moving averages
- **Performance Leaderboard**: Comparative entity ranking by core metrics
- **Multi-Dimensional Efficiency Radar**: Strategic performance mapping across multiple dimensions
- **Executive Ratio Audit**: Full operational status breakdown of all key financial ratios

#### 8. Other Terms
- **Benchmarking**: Comparison of performance metrics against peer companies or industry standards
- **Fiscal Year**: 12-month accounting period used for financial reporting
- **Threshold**: Predefined limit that triggers alerts when exceeded
- **Ideal Ratio**: Target financial ratio representing optimal performance
- **COGS (Cost of Goods Sold)**: Direct costs attributable to production of goods sold
- **Gross Profit**: Revenue minus cost of goods sold
- **OpEx (Operating Expenses)**: Ongoing costs for running day-to-day business operations
- **Moving Average**: Statistical calculation smoothing data by averaging values over a rolling time period
- **Consolidated Enterprise View**: Aggregate performance monitoring across all corporate entities

#### 9. Status Descriptions
- **Healthy**: Metric is within optimal range and meets target thresholds
- **Moderate**: Metric is acceptable but approaching caution levels
- **Risky**: Metric has breached thresholds and requires attention
- **Active**: Entity or user account is currently operational
- **Inactive**: Entity or user account is disabled or suspended
- **Locked**: User account is locked due to security reasons

#### 10. Permission Descriptions
- **View Dashboard**: Access to view financial dashboards and reports
- **Upload Data**: Permission to upload financial statements and data files
- **Edit Benchmark**: Ability to modify benchmark thresholds and ideal ratios
- **Manage User**: Create, edit, and manage user accounts and permissions
- **Access Alert**: View and manage strategic risk alerts and notifications
- **Export Report**: Download and export financial reports and data

## Where Tooltips Appear

### Dashboard Components
1. **Strategic Performance Index Card** - Main health score gauge with dimension tooltips
2. **Company Overview Section** - Total Assets, Total Equity, Total Liabilities
3. **Annual Growth Card** - Revenue Growth and Profit Growth metrics
4. **KPI Summary Cards** - All 5 key performance indicators (ROA, ROE, NPM, DER, Current Ratio)
5. **Growth Trends Charts** - Revenue & Profitability Dynamics, Operational Efficiency Ratios
6. **Financial Analysis Charts** - Waterfall, Cash Flow, Asset Composition, Capital Structure
7. **Risk Assessment** - Governance Risk Matrix, Performance Leaderboard
8. **Trend Forecasting** - Strategic Trend Forecasting chart

### User Interface Elements
- Metric labels in KPI cards
- Chart titles and section headers
- Financial statement line items
- Risk alert categories
- Benchmarking comparisons
- Year-over-year growth indicators

## Usage

### For End Users
Simply hover your mouse over any information icon (ℹ️) next to a term or metric to see its explanation. The tooltip will appear with:
- A bold title showing the full name
- A description explaining what it means in plain English

### For Developers
To add a new tooltip:

1. Add the description to `src/tooltips.ts`:
```typescript
export const METRIC_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  your_metric: {
    title: "Your Metric Name",
    description: "Clear explanation of what this metric means"
  }
};
```

2. Use the Tooltip component in your JSX:
```tsx
import { Tooltip } from './components/Tooltip';
import { METRIC_DESCRIPTIONS } from './tooltips';

<Tooltip 
  title={METRIC_DESCRIPTIONS.your_metric.title} 
  description={METRIC_DESCRIPTIONS.your_metric.description} 
/>
```

3. For Card components with tooltips:
```tsx
<Card 
  title="Your Card Title"
  subtitle="Your subtitle"
  icon={YourIcon}
  tooltip={METRIC_DESCRIPTIONS.your_metric}
/>
```

## Design Principles

All tooltips follow these principles:
1. **Concise**: Descriptions are brief and to the point
2. **Plain English**: Avoid jargon where possible
3. **Actionable**: Help users understand what the metric means for decision-making
4. **Consistent**: Similar formatting and tone across all tooltips
5. **Professional**: Appropriate for executive and financial audiences

## Language

All tooltips are written in **English** as requested, providing clear explanations of financial terms and concepts for international business audiences.

## Future Enhancements

Potential improvements:
- Multi-language support
- More detailed explanations with examples
- Links to external resources or documentation
- Interactive tutorials for complex metrics
- Contextual help based on user role
