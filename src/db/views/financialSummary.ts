/**
 * cfd.v_financial_summary — VIEW
 *
 * Replaces the old frs_financial_data table.
 * Computes financial aggregates from balance_sheets + income_statements.
 * Used by v_financial_ratios VIEW and FRS dashboard.
 */
export const V_FINANCIAL_SUMMARY_SQL = `
CREATE OR REPLACE VIEW cfd.v_financial_summary AS
SELECT
  bs.id AS balance_sheet_id,
  bs.department_id,
  bs.period,
  d.corporate_id,

  -- From income_statements
  COALESCE(ist.revenue, 0) AS revenue,
  COALESCE(
    ist.revenue - ist.cogs - ist.operating_expenses - ist.interest_expense - ist.tax_expense,
    0
  ) AS net_profit,
  COALESCE(ist.interest_expense, 0) AS interest_expense,

  -- Current Assets
  COALESCE(bs.cash_and_bank, 0) AS cash,
  COALESCE(bs.inventory, 0) AS inventory,
  COALESCE(
    bs.cash_and_bank + bs.accounts_receivable + bs.work_in_progress
    + bs.inventory + bs.prepaid_expenses,
    0
  ) AS current_assets,

  -- Total Assets
  COALESCE(
    bs.cash_and_bank + bs.accounts_receivable + bs.work_in_progress
    + bs.inventory + bs.prepaid_expenses
    + bs.land + bs.building + bs.equipment + bs.other_fixed_assets,
    0
  ) AS total_assets,

  -- Current Liabilities
  COALESCE(
    bs.accounts_payable + bs.bank_loan_current + bs.other_current_liabilities,
    0
  ) AS current_liabilities,

  -- Short-term debt (for DSCR)
  COALESCE(bs.bank_loan_current, 0) AS short_term_debt,

  -- Total Liabilities
  COALESCE(
    bs.accounts_payable + bs.bank_loan_current + bs.other_current_liabilities
    + bs.bank_loan_long_term + bs.other_long_term_liabilities + bs.shareholder_loan,
    0
  ) AS total_liabilities,

  -- Total Equity
  COALESCE(
    bs.capital + bs.earnings_after_tax + bs.retained_earnings - bs.dividends,
    0
  ) AS total_equity

FROM cfd.balance_sheets bs
JOIN public.departments d ON d.id = bs.department_id
LEFT JOIN cfd.income_statements ist
  ON ist.department_id = bs.department_id
  AND ist.period = bs.period;
`;
