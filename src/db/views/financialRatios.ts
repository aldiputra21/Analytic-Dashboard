/**
 * cfd.v_financial_ratios — VIEW
 *
 * Replaces the old frs_calculated_ratios table.
 * Computes 7 of 9 financial ratios from v_financial_summary.
 * OCF Ratio and DSCR are computed via fn_calculate_ocf_ratios() function.
 */
export const V_FINANCIAL_RATIOS_SQL = `
CREATE OR REPLACE VIEW cfd.v_financial_ratios AS
SELECT
  fs.balance_sheet_id,
  fs.corporate_id,
  fs.period,

  -- Source data
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

  -- Profitability Ratios
  CASE WHEN fs.total_assets > 0
    THEN fs.net_profit / fs.total_assets
  END AS roa,

  CASE WHEN fs.total_equity > 0
    THEN fs.net_profit / fs.total_equity
  END AS roe,

  CASE WHEN fs.revenue > 0
    THEN fs.net_profit / fs.revenue
  END AS npm,

  -- Leverage Ratio
  CASE WHEN fs.total_equity > 0
    THEN fs.total_liabilities / fs.total_equity
  END AS der,

  -- Liquidity Ratios
  CASE WHEN fs.current_liabilities > 0
    THEN fs.current_assets / fs.current_liabilities
  END AS current_ratio,

  CASE WHEN fs.current_liabilities > 0
    THEN (fs.current_assets - fs.inventory) / fs.current_liabilities
  END AS quick_ratio,

  CASE WHEN fs.current_liabilities > 0
    THEN fs.cash / fs.current_liabilities
  END AS cash_ratio

  -- NOTE: ocf_ratio and dscr require weekly_cash_flows aggregation.
  -- Use cfd.fn_calculate_ocf_ratios(department_id, period) for those.

FROM cfd.v_financial_summary fs;
`;
