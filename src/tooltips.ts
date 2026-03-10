// Financial Terms and Metrics Descriptions
export const METRIC_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  // Profitability Ratios
  roa: {
    title: "Return on Assets (ROA)",
    description: "Measures how efficiently a company uses its assets to generate profit"
  },
  roe: {
    title: "Return on Equity (ROE)",
    description: "Rate of return on shareholder equity investments"
  },
  npm: {
    title: "Net Profit Margin (NPM)",
    description: "Percentage of revenue remaining as profit after all expenses"
  },
  
  // Leverage Ratios
  der: {
    title: "Debt-to-Equity Ratio (DER)",
    description: "Measures financial leverage by comparing total liabilities to shareholder equity"
  },
  
  // Liquidity Ratios
  current_ratio: {
    title: "Current Ratio",
    description: "Ability to pay short-term obligations with current assets"
  },
  quick_ratio: {
    title: "Quick Ratio (Acid Test)",
    description: "Ability to meet short-term obligations with most liquid assets"
  },
  cash_ratio: {
    title: "Cash Ratio",
    description: "Most conservative liquidity measure using only cash and cash equivalents"
  },
  ocf_ratio: {
    title: "Operating Cash Flow Ratio",
    description: "Measures ability to cover current liabilities with cash from operations"
  },
  dscr: {
    title: "Debt Service Coverage Ratio (DSCR)",
    description: "Ability to service debt obligations with operating cash flow"
  },
  
  // Financial Statement Items
  revenue: {
    title: "Revenue",
    description: "Total income generated from business operations before expenses"
  },
  net_profit: {
    title: "Net Profit",
    description: "Bottom-line profit after all expenses, taxes, and costs"
  },
  total_assets: {
    title: "Total Assets",
    description: "Sum of all resources owned by the company with economic value"
  },
  total_equity: {
    title: "Total Equity",
    description: "Residual interest in assets after deducting liabilities (shareholders' equity)"
  },
  current_equity: {
    title: "Current Equity",
    description: "Current portion of shareholder equity available for operations"
  },
  total_liabilities: {
    title: "Total Liabilities",
    description: "Sum of all financial obligations and debts owed by the company"
  },
  current_assets: {
    title: "Current Assets",
    description: "Assets expected to be converted to cash within one year"
  },
  current_liabilities: {
    title: "Current Liabilities",
    description: "Obligations due within one year or operating cycle"
  },
  quick_assets: {
    title: "Quick Assets",
    description: "Highly liquid assets that can be quickly converted to cash (excludes inventory)"
  },
  cash: {
    title: "Cash and Cash Equivalents",
    description: "Most liquid assets including currency, bank deposits, and short-term investments"
  },
  operating_cash_flow: {
    title: "Operating Cash Flow",
    description: "Cash generated from core business operations"
  },
  ar_aging_90_plus: {
    title: "Accounts Receivable Aging 90+ Days",
    description: "Outstanding customer invoices overdue by more than 90 days"
  },
  interest_expense: {
    title: "Interest Expense",
    description: "Cost of borrowed funds and debt financing"
  },
  short_term_debt: {
    title: "Short-Term Debt",
    description: "Debt obligations due within one year"
  },
  long_term_debt: {
    title: "Long-Term Debt",
    description: "Debt obligations due beyond one year"
  },
  
  // Dashboard Sections
  strategic_performance_index: {
    title: "Strategic Performance Index",
    description: "Aggregate corporate health metric combining profitability, liquidity, solvency, and efficiency"
  },
  profitability: {
    title: "Profitability",
    description: "Ability to generate earnings relative to revenue, assets, and equity"
  },
  liquidity: {
    title: "Liquidity",
    description: "Ability to meet short-term financial obligations with available assets"
  },
  solvency: {
    title: "Solvency",
    description: "Long-term financial stability and ability to meet all obligations"
  },
  efficiency: {
    title: "Efficiency",
    description: "How effectively the company uses its resources to generate revenue"
  },
  annual_growth: {
    title: "Annual Growth",
    description: "Year-over-year percentage increase in key financial metrics"
  },
  revenue_growth: {
    title: "Revenue Growth",
    description: "Percentage increase in total revenue compared to previous period"
  },
  profit_growth: {
    title: "Profit Growth",
    description: "Percentage increase in net profit compared to previous period"
  },
  yoy: {
    title: "Year-over-Year (YoY)",
    description: "Comparison of current period performance to same period last year"
  },
  
  // Risk & Alerts
  strategic_risk_alerts: {
    title: "Strategic Risk Alerts",
    description: "Early warning system for financial health deterioration and threshold breaches"
  },
  cash_flow_risk: {
    title: "Cash Flow Risk",
    description: "Risk of insufficient cash generation to support operations"
  },
  solvency_risk: {
    title: "Solvency Risk",
    description: "Risk of excessive debt burden relative to equity"
  },
  liquidity_risk: {
    title: "Liquidity Risk",
    description: "Risk of inability to meet short-term financial obligations"
  },
  profitability_risk: {
    title: "Profitability Risk",
    description: "Risk of declining profit margins and earnings quality"
  },
  governance_risk_matrix: {
    title: "Governance Risk Matrix",
    description: "Strategic risk exposure assessment across operational and financial dimensions"
  },
  composite_risk_profile: {
    title: "Composite Risk Profile",
    description: "Overall risk rating combining multiple risk factors"
  },
  market_volatility: {
    title: "Market Volatility",
    description: "Exposure to market price fluctuations and economic uncertainty"
  },
  credit_exposure: {
    title: "Credit Exposure",
    description: "Risk of customer payment defaults and receivables collection issues"
  },
  operational_integrity: {
    title: "Operational Integrity",
    description: "Stability and reliability of core business operations"
  },
  
  // Charts & Analytics
  revenue_profitability_dynamics: {
    title: "Revenue & Profitability Dynamics",
    description: "Strategic growth trajectories showing revenue and profit trends over time"
  },
  operational_efficiency_ratios: {
    title: "Operational Efficiency Ratios",
    description: "NPM & ROE performance tracking operational effectiveness"
  },
  value_creation_waterfall: {
    title: "Value Creation Waterfall",
    description: "Revenue to net income bridge showing profit transformation stages"
  },
  asset_composition: {
    title: "Asset Composition",
    description: "Current vs non-current assets distribution"
  },
  capital_structure: {
    title: "Capital Structure",
    description: "Equity vs debt ratio showing financing mix"
  },
  liquidity_cash_sustainability: {
    title: "Liquidity & Cash Sustainability",
    description: "Operational cash flow dynamics and cash generation capacity"
  },
  strategic_trend_forecasting: {
    title: "Strategic Trend Forecasting",
    description: "Revenue trajectory analysis with moving averages"
  },
  performance_leaderboard: {
    title: "Performance Leaderboard",
    description: "Comparative entity ranking by core metrics"
  },
  multidimensional_efficiency_radar: {
    title: "Multi-Dimensional Efficiency Radar",
    description: "Strategic performance mapping across multiple dimensions"
  },
  executive_ratio_audit: {
    title: "Executive Ratio Audit",
    description: "Full operational status breakdown of all key financial ratios"
  },
  
  // Other Terms
  benchmarking: {
    title: "Benchmarking",
    description: "Comparison of performance metrics against peer companies or industry standards"
  },
  fiscal_year: {
    title: "Fiscal Year",
    description: "12-month accounting period used for financial reporting"
  },
  threshold: {
    title: "Threshold",
    description: "Predefined limit that triggers alerts when exceeded"
  },
  ideal_ratio: {
    title: "Ideal Ratio",
    description: "Target financial ratio representing optimal performance"
  },
  cogs: {
    title: "Cost of Goods Sold (COGS)",
    description: "Direct costs attributable to production of goods sold"
  },
  gross_profit: {
    title: "Gross Profit",
    description: "Revenue minus cost of goods sold"
  },
  opex: {
    title: "Operating Expenses (OpEx)",
    description: "Ongoing costs for running day-to-day business operations"
  },
  moving_average: {
    title: "Moving Average",
    description: "Statistical calculation smoothing data by averaging values over a rolling time period"
  },
  consolidated_view: {
    title: "Consolidated Enterprise View",
    description: "Aggregate performance monitoring across all corporate entities"
  }
};

// Permission Descriptions
export const PERMISSION_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  view_dashboard: {
    title: "View Dashboard",
    description: "Access to view financial dashboards and reports"
  },
  upload_data: {
    title: "Upload Data",
    description: "Permission to upload financial statements and data files"
  },
  edit_benchmark: {
    title: "Edit Benchmark",
    description: "Ability to modify benchmark thresholds and ideal ratios"
  },
  manage_user: {
    title: "Manage User",
    description: "Create, edit, and manage user accounts and permissions"
  },
  access_alert: {
    title: "Access Alert",
    description: "View and manage strategic risk alerts and notifications"
  },
  export_report: {
    title: "Export Report",
    description: "Download and export financial reports and data"
  }
};

// Status Descriptions
export const STATUS_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  healthy: {
    title: "Healthy",
    description: "Metric is within optimal range and meets target thresholds"
  },
  moderate: {
    title: "Moderate",
    description: "Metric is acceptable but approaching caution levels"
  },
  risky: {
    title: "Risky",
    description: "Metric has breached thresholds and requires attention"
  },
  active: {
    title: "Active",
    description: "Entity or user account is currently operational"
  },
  inactive: {
    title: "Inactive",
    description: "Entity or user account is disabled or suspended"
  },
  locked: {
    title: "Locked",
    description: "User account is locked due to security reasons"
  }
};
