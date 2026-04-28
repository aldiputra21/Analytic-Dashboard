CREATE OR REPLACE VIEW cfd.v_financial_summary AS
SELECT
  bs.id AS balance_sheet_id,
  bs.corporate_id,
  bs.period,
  COALESCE(ist.revenue, 0) AS revenue,
  COALESCE(
    ist.revenue - ist.cogs - ist.operating_expenses - ist.interest_expense - ist.tax_expense,
    0
  ) AS net_profit,
  COALESCE(ist.interest_expense, 0) AS interest_expense,
  COALESCE(bs.cash_and_bank, 0) AS cash,
  COALESCE(bs.inventory, 0) AS inventory,
  COALESCE(
    bs.cash_and_bank + bs.accounts_receivable + bs.work_in_progress + bs.inventory + bs.prepaid_expenses,
    0
  ) AS current_assets,
  COALESCE(
    bs.cash_and_bank + bs.accounts_receivable + bs.work_in_progress + bs.inventory + bs.prepaid_expenses
    + bs.land + bs.building + bs.equipment + bs.other_fixed_assets,
    0
  ) AS total_assets,
  COALESCE(
    bs.accounts_payable + bs.bank_loan_current + bs.other_current_liabilities,
    0
  ) AS current_liabilities,
  COALESCE(bs.bank_loan_current, 0) AS short_term_debt,
  COALESCE(
    bs.accounts_payable + bs.bank_loan_current + bs.other_current_liabilities
    + bs.bank_loan_long_term + bs.other_long_term_liabilities + bs.shareholder_loan,
    0
  ) AS total_liabilities,
  COALESCE(
    bs.capital + bs.earnings_after_tax + bs.retained_earnings - bs.dividends,
    0
  ) AS total_equity
FROM cfd.balance_sheets bs
LEFT JOIN cfd.income_statements ist
  ON ist.corporate_id = bs.corporate_id
  AND ist.period = bs.period;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION cfd.fn_calculate_ocf_ratios(
  p_corporate_id UUID,
  p_period VARCHAR(7)
)
RETURNS TABLE(ocf_ratio NUMERIC, dscr NUMERIC)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_operating_cf NUMERIC;
  v_current_liabilities NUMERIC;
  v_short_term_debt NUMERIC;
BEGIN
  SELECT COALESCE(SUM(operating_cash_in - operating_cash_out), 0)
  INTO v_operating_cf
  FROM cfd.weekly_cash_flows
  WHERE corporate_id = p_corporate_id
    AND period = p_period;

  SELECT fs.current_liabilities, fs.short_term_debt
  INTO v_current_liabilities, v_short_term_debt
  FROM cfd.v_financial_summary fs
  WHERE fs.corporate_id = p_corporate_id
    AND fs.period = p_period
  LIMIT 1;

  ocf_ratio := CASE WHEN COALESCE(v_current_liabilities, 0) > 0
    THEN v_operating_cf / v_current_liabilities
  ELSE 0
  END;

  dscr := CASE WHEN COALESCE(v_short_term_debt, 0) > 0
    THEN v_operating_cf / v_short_term_debt
  ELSE 0
  END;

  RETURN NEXT;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE VIEW cfd.v_financial_ratios AS
SELECT
  fs.balance_sheet_id,
  fs.corporate_id,
  fs.period,
  fs.revenue,
  fs.net_profit,
  fs.interest_expense,
  fs.cash,
  fs.inventory,
  fs.current_assets,
  fs.total_assets,
  fs.current_liabilities,
  fs.short_term_debt,
  fs.total_liabilities,
  fs.total_equity,
  CASE WHEN fs.total_assets > 0
    THEN fs.net_profit / fs.total_assets
  END AS roa,
  CASE WHEN fs.total_equity > 0
    THEN fs.net_profit / fs.total_equity
  END AS roe,
  CASE WHEN fs.revenue > 0
    THEN fs.net_profit / fs.revenue
  END AS npm,
  CASE WHEN fs.total_equity > 0
    THEN fs.total_liabilities / fs.total_equity
  END AS der,
  CASE WHEN fs.current_liabilities > 0
    THEN fs.current_assets / fs.current_liabilities
  END AS current_ratio,
  CASE WHEN fs.current_liabilities > 0
    THEN (fs.current_assets - fs.inventory) / fs.current_liabilities
  END AS quick_ratio,
  CASE WHEN fs.current_liabilities > 0
    THEN fs.cash / fs.current_liabilities
  END AS cash_ratio
FROM cfd.v_financial_summary fs;
