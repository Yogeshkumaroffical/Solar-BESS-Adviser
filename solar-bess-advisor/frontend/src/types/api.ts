/**
 * TypeScript mirrors of the Pydantic models defined in the backend.
 */

export interface SolarInputs {
  plant_capacity_mw: number;
  cuf_percent: number;
  ppa_tariff_inr: number;
  clipping_loss_percent: number;
  curtailment_percent: number;
  dsm_penalty_percent: number;
  solar_capex_cr: number;
  solar_om_cr_year: number;
  solar_degradation_percent: number;
  project_life_years: number;
  wacc_percent: number;
  tax_rate_percent: number;
}

export interface BESSInputs {
  bess_capacity_mwh: number;
  bess_power_mw: number;
  bess_capex_cr: number;
  bess_om_cr_year: number;
  rte_percent: number;
  battery_degradation_percent: number;
  cycles_per_day: number;
  replacement_year?: number | null;
  replacement_cost_cr?: number | null;
}

export interface RevenueInputs {
  off_peak_buy_tariff_inr: number;
  peak_sell_tariff_inr: number;
  curtailment_sell_tariff_inr: number;
  clipping_sell_tariff_inr: number;
  clipping_recovery_factor: number;
  curtailment_recovery_factor: number;
  ancillary_enabled: boolean;
  ancillary_rate_cr_mw_year: number;
  ancillary_capacity_mw: number;
  om_escalation_percent: number;
}

export interface ProjectInputs {
  solar: SolarInputs;
  bess: BESSInputs;
  revenue: RevenueInputs;
}

export interface RevenueBreakdown {
  base_ppa_revenue_cr: number;
  dsm_penalty_cr: number;
  dsm_savings_cr: number;
  clipping_recovery_cr: number;
  curtailment_recovery_cr: number;
  arbitrage_cr: number;
  peak_shift_cr: number;
  ancillary_cr: number;
  total_revenue_cr: number;
  total_om_cr: number;
  net_profit_cr: number;
  net_profit_after_tax_cr: number;
}

export interface AnnualCashFlow {
  year: number;
  solar_only_revenue_cr: number;
  solar_only_profit_cr: number;
  solar_only_cumulative_cf_cr: number;
  hybrid_revenue_cr: number;
  hybrid_profit_cr: number;
  hybrid_cumulative_cf_cr: number;
  generation_mwh: number;
  bess_degradation_factor: number;
}

export interface FinancialSummary {
  npv_cr: number;
  irr_percent: number | null;
  simple_payback_years: number | null;
  total_capex_cr: number;
  lcoe_inr_kwh: number | null;
}

export interface SensitivityPoint {
  variable: string;
  change_percent: number;
  solar_only_npv_cr: number;
  hybrid_npv_cr: number;
  npv_gain_cr: number;
}

export interface AnalysisWarning {
  field: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface AnalysisResult {
  inputs_summary: Record<string, unknown>;
  solar_only_year1: RevenueBreakdown;
  hybrid_year1: RevenueBreakdown;
  incremental_revenue_cr: number;
  incremental_profit_cr: number;
  incremental_npv_cr: number;
  solar_only_financials: FinancialSummary;
  hybrid_financials: FinancialSummary;
  annual_cash_flows: AnnualCashFlow[];
  sensitivity: SensitivityPoint[];
  warnings: AnalysisWarning[];
  recommendation: 'Attractive' | 'Marginal' | 'Not Attractive';
  recommendation_reason: string;
}

export interface AdvisoryNoteResponse {
  title: string;
  markdown: string;
  recommendation: string;
}
