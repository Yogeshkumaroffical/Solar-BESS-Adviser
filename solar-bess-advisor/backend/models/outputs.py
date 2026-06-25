"""
Pydantic output models for the Solar BESS Profitability Advisor.
All monetary values in INR Crores unless noted as /kWh.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class RevenueBreakdown(BaseModel):
    """Annual revenue breakdown for one scenario (solar-only or hybrid)."""

    base_ppa_revenue_cr: float
    dsm_penalty_cr: float  # negative (cost) for solar-only, 0 or reduced for hybrid
    dsm_savings_cr: float  # savings vs solar-only
    clipping_recovery_cr: float
    curtailment_recovery_cr: float
    arbitrage_cr: float
    peak_shift_cr: float
    ancillary_cr: float
    total_revenue_cr: float
    total_om_cr: float
    net_profit_cr: float  # before tax
    net_profit_after_tax_cr: float


class AnnualCashFlow(BaseModel):
    """Cash flow for a single project year."""

    year: int
    solar_only_revenue_cr: float
    solar_only_profit_cr: float
    solar_only_cumulative_cf_cr: float
    hybrid_revenue_cr: float
    hybrid_profit_cr: float
    hybrid_cumulative_cf_cr: float
    generation_mwh: float
    bess_degradation_factor: float


class FinancialSummary(BaseModel):
    """Key financial metrics for one scenario."""

    npv_cr: float
    irr_percent: Optional[float]
    simple_payback_years: Optional[float]
    total_capex_cr: float
    lcoe_inr_kwh: Optional[float]


class SensitivityPoint(BaseModel):
    """A single point in a sensitivity analysis."""

    variable: str
    change_percent: float
    solar_only_npv_cr: float
    hybrid_npv_cr: float
    npv_gain_cr: float


class Warning(BaseModel):
    """A business-rule warning message."""

    field: str
    message: str
    severity: str  # "info", "warning", "error"


class AnalysisResult(BaseModel):
    """Full analysis result returned from POST /analyze."""

    # Inputs echo (for export/reporting)
    inputs_summary: dict

    # Year 1 detailed breakdown
    solar_only_year1: RevenueBreakdown
    hybrid_year1: RevenueBreakdown

    # Incremental gain
    incremental_revenue_cr: float
    incremental_profit_cr: float
    incremental_npv_cr: float

    # Financial summaries
    solar_only_financials: FinancialSummary
    hybrid_financials: FinancialSummary

    # Year-by-year
    annual_cash_flows: List[AnnualCashFlow]

    # Sensitivity (tornado data)
    sensitivity: List[SensitivityPoint]

    # Warnings
    warnings: List[Warning]

    # Recommendation
    recommendation: str  # "Attractive", "Marginal", "Not Attractive"
    recommendation_reason: str


class AdvisoryNoteRequest(BaseModel):
    """Request body for advisory note generation."""

    result: AnalysisResult
    project_name: str = "Unnamed Solar Project"
    consultant_name: str = "Solar BESS Advisor"


class AdvisoryNoteResponse(BaseModel):
    """Advisory note text."""

    title: str
    markdown: str
    recommendation: str
