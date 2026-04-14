/**
 * cfd.fn_calculate_ocf_ratios — PostgreSQL Function
 *
 * Computes OCF Ratio and DSCR from weekly_cash_flows + v_financial_summary.
 * These two ratios require cross-table aggregation that can't be done in a simple VIEW.
 *
 * Usage:
 *   SELECT * FROM cfd.fn_calculate_ocf_ratios('department-uuid', '2026-01');
 *
 * Returns:
 *   ocf_ratio  NUMERIC  — Operating Cash Flow / Current Liabilities
 *   dscr       NUMERIC  — Operating Cash Flow / Short-term Debt
 */
export const FN_CALCULATE_OCF_RATIOS_SQL = `
CREATE OR REPLACE FUNCTION cfd.fn_calculate_ocf_ratios(
  p_department_id UUID,
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
  -- Aggregate operating cash flow from weekly_cash_flows for the given period
  SELECT COALESCE(SUM(operating_cash_in - operating_cash_out), 0)
  INTO v_operating_cf
  FROM cfd.weekly_cash_flows
  WHERE department_id = p_department_id
    AND period = p_period;

  -- Get current_liabilities & short_term_debt from the financial summary
  SELECT fs.current_liabilities, fs.short_term_debt
  INTO v_current_liabilities, v_short_term_debt
  FROM cfd.v_financial_summary fs
  WHERE fs.department_id = p_department_id
    AND fs.period = p_period
  LIMIT 1;

  -- Calculate ratios (NULL if denominator is zero)
  ocf_ratio := CASE WHEN COALESCE(v_current_liabilities, 0) > 0
    THEN v_operating_cf / v_current_liabilities
  END;

  dscr := CASE WHEN COALESCE(v_short_term_debt, 0) > 0
    THEN v_operating_cf / v_short_term_debt
  END;

  RETURN NEXT;
END;
$$;
`;
