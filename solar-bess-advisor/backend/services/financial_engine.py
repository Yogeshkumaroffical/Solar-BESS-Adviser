"""
Financial Engine – core calculation module for Solar BESS Profitability Advisor.

All monetary values are in INR Crores.
"""

from __future__ import annotations

import math
from typing import Optional

import numpy as np

from models.inputs import ProjectInputs
from models.outputs import (
    AnnualCashFlow,
    FinancialSummary,
    RevenueBreakdown,
    SensitivityPoint,
    Warning,
)
from core.revenue import (
    compute_solar_only_revenue,
    compute_hybrid_revenue,
)


# ---------------------------------------------------------------------------
# Helper: IRR via bisection
# ---------------------------------------------------------------------------

def _irr(cash_flows: list[float]) -> Optional[float]:
    """Compute IRR using bisection. Returns None if not found."""
    if len(cash_flows) < 2:
        return None

    def npv_at(r: float) -> float:
        return sum(cf / (1 + r) ** t for t, cf in enumerate(cash_flows))

    lo, hi = -0.9999, 100.0
    try:
        if npv_at(lo) * npv_at(hi) > 0:
            return None
        for _ in range(200):
            mid = (lo + hi) / 2
            if abs(npv_at(mid)) < 1e-7:
                break
            if npv_at(lo) * npv_at(mid) < 0:
                hi = mid
            else:
                lo = mid
        return mid * 100  # percent
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Revenue breakdown for a single year
# ---------------------------------------------------------------------------

def _compute_revenue_breakdown(
    *,
    inputs: ProjectInputs,
    year: int,  # 1-indexed
    solar_degradation_factor: float,
    bess_degradation_factor: float,
    om_escalation_factor: float,
    is_hybrid: bool,
) -> RevenueBreakdown:
    s = inputs.solar
    b = inputs.bess
    r = inputs.revenue

    # --- Generation ---
    annual_gen_mwh = s.plant_capacity_mw * (s.cuf_percent / 100) * 8760 * solar_degradation_factor

    # O&M
    solar_om = s.solar_om_cr_year * om_escalation_factor

    if not is_hybrid:
        res = compute_solar_only_revenue(
            generation_mwh=annual_gen_mwh,
            ppa_tariff_inr=s.ppa_tariff_inr,
            dsm_penalty_fraction=s.dsm_penalty_percent / 100,
            om_cr=solar_om,
            tax_rate_fraction=s.tax_rate_percent / 100,
        )
    else:
        # We need solar_only_dsm_cr for hybrid DSM savings
        solar_res = compute_solar_only_revenue(
            generation_mwh=annual_gen_mwh,
            ppa_tariff_inr=s.ppa_tariff_inr,
            dsm_penalty_fraction=s.dsm_penalty_percent / 100,
            om_cr=solar_om,
            tax_rate_fraction=s.tax_rate_percent / 100,
        )
        bess_om = b.bess_om_cr_year * om_escalation_factor
        
        res = compute_hybrid_revenue(
            generation_mwh=annual_gen_mwh,
            ppa_tariff_inr=s.ppa_tariff_inr,
            dsm_penalty_fraction=s.dsm_penalty_percent / 100,
            solar_only_dsm_cr=solar_res.dsm_penalty_cr,
            clipping_fraction=s.clipping_loss_percent / 100,
            clipping_recovery_factor=r.clipping_recovery_factor,
            clipping_sell_tariff_inr=r.clipping_sell_tariff_inr,
            curtailment_fraction=s.curtailment_percent / 100,
            curtailment_recovery_factor=r.curtailment_recovery_factor,
            curtailment_sell_tariff_inr=r.curtailment_sell_tariff_inr,
            bess_capacity_mwh=b.bess_capacity_mwh,
            bess_degradation_factor=bess_degradation_factor,
            cycles_per_day=b.cycles_per_day,
            rte=b.rte_percent / 100,
            off_peak_buy_tariff_inr=r.off_peak_buy_tariff_inr,
            peak_sell_tariff_inr=r.peak_sell_tariff_inr,
            ancillary_enabled=r.ancillary_enabled,
            ancillary_capacity_mw=r.ancillary_capacity_mw,
            ancillary_rate_cr_mw_year=r.ancillary_rate_cr_mw_year,
            total_om_cr=solar_om + bess_om,
            tax_rate_fraction=s.tax_rate_percent / 100,
        )

    return RevenueBreakdown(
        base_ppa_revenue_cr=res.base_ppa_revenue_cr,
        dsm_penalty_cr=-res.dsm_penalty_cr,  # negative cost
        dsm_savings_cr=res.dsm_savings_cr,
        clipping_recovery_cr=res.clipping_recovery_cr,
        curtailment_recovery_cr=res.curtailment_recovery_cr,
        arbitrage_cr=res.arbitrage_cr,
        peak_shift_cr=res.peak_shift_cr,
        ancillary_cr=res.ancillary_cr,
        total_revenue_cr=res.total_revenue_cr,
        total_om_cr=res.total_om_cr,
        net_profit_cr=res.net_profit_cr,
        net_profit_after_tax_cr=res.net_profit_after_tax_cr,
    )


# ---------------------------------------------------------------------------
# Full financial model
# ---------------------------------------------------------------------------

def run_analysis(inputs: ProjectInputs, compute_sensitivity: bool = True) -> dict:
    """Run full financial analysis. Returns a dict ready to build AnalysisResult."""
    s = inputs.solar
    b = inputs.bess
    r = inputs.revenue

    years = s.project_life_years
    wacc = s.wacc_percent / 100
    tax = s.tax_rate_percent / 100

    # Initial cash flows: capex at year 0
    solar_only_cfs = [-s.solar_capex_cr]
    hybrid_cfs = [-(s.solar_capex_cr + b.bess_capex_cr)]

    solar_only_cumulative = -s.solar_capex_cr
    hybrid_cumulative = -(s.solar_capex_cr + b.bess_capex_cr)

    annual_cash_flows: list[AnnualCashFlow] = []
    warnings_list: list[Warning] = []

    year1_solar = None
    year1_hybrid = None

    for yr in range(1, years + 1):
        solar_deg_factor = (1 - s.solar_degradation_percent / 100) ** (yr - 1)
        bess_deg_factor = (1 - b.battery_degradation_percent / 100) ** (yr - 1)
        om_esc_factor = (1 + r.om_escalation_percent / 100) ** (yr - 1)

        gen_mwh = s.plant_capacity_mw * (s.cuf_percent / 100) * 8760 * solar_deg_factor

        solar_bd = _compute_revenue_breakdown(
            inputs=inputs,
            year=yr,
            solar_degradation_factor=solar_deg_factor,
            bess_degradation_factor=bess_deg_factor,
            om_escalation_factor=om_esc_factor,
            is_hybrid=False,
        )
        hybrid_bd = _compute_revenue_breakdown(
            inputs=inputs,
            year=yr,
            solar_degradation_factor=solar_deg_factor,
            bess_degradation_factor=bess_deg_factor,
            om_escalation_factor=om_esc_factor,
            is_hybrid=True,
        )

        if yr == 1:
            year1_solar = solar_bd
            year1_hybrid = hybrid_bd

        # Battery replacement capex shock
        bess_replacement = 0.0
        if b.replacement_year is not None and yr == b.replacement_year:
            bess_replacement = b.replacement_cost_cr

        solar_profit = solar_bd.net_profit_after_tax_cr
        hybrid_profit = hybrid_bd.net_profit_after_tax_cr - bess_replacement

        solar_only_cfs.append(solar_profit)
        hybrid_cfs.append(hybrid_profit)

        solar_only_cumulative += solar_profit
        hybrid_cumulative += hybrid_profit

        annual_cash_flows.append(
            AnnualCashFlow(
                year=yr,
                solar_only_revenue_cr=solar_bd.total_revenue_cr,
                solar_only_profit_cr=solar_profit,
                solar_only_cumulative_cf_cr=solar_only_cumulative,
                hybrid_revenue_cr=hybrid_bd.total_revenue_cr,
                hybrid_profit_cr=hybrid_profit,
                hybrid_cumulative_cf_cr=hybrid_cumulative,
                generation_mwh=gen_mwh,
                bess_degradation_factor=bess_deg_factor,
            )
        )

    # --- NPV ---
    def npv(cfs: list[float]) -> float:
        return sum(cf / (1 + wacc) ** t for t, cf in enumerate(cfs))

    solar_npv = npv(solar_only_cfs)
    hybrid_npv = npv(hybrid_cfs)

    # --- IRR ---
    solar_irr = _irr(solar_only_cfs)
    hybrid_irr = _irr(hybrid_cfs)

    # --- Simple payback (hybrid BESS incremental) ---
    incremental_capex = b.bess_capex_cr
    avg_incremental_profit = (hybrid_cfs[1] - solar_only_cfs[1])  # year 1 incremental
    payback_years: Optional[float] = None
    if avg_incremental_profit > 0:
        payback_years = incremental_capex / avg_incremental_profit

    # --- LCOE ---
    total_solar_gen = sum(
        s.plant_capacity_mw * (s.cuf_percent / 100) * 8760 * (1 - s.solar_degradation_percent / 100) ** yr
        for yr in range(years)
    )
    pv_gen = sum(
        (s.plant_capacity_mw * (s.cuf_percent / 100) * 8760 * (1 - s.solar_degradation_percent / 100) ** yr)
        / (1 + wacc) ** (yr + 1)
        for yr in range(years)
    )
    solar_only_lcoe = (s.solar_capex_cr * 1e7 + sum(
        s.solar_om_cr_year * (1 + r.om_escalation_percent / 100) ** yr * 1e7 / (1 + wacc) ** (yr + 1)
        for yr in range(years)
    )) / (pv_gen * 1000) if pv_gen > 0 else None

    hybrid_lcoe = ((s.solar_capex_cr + b.bess_capex_cr) * 1e7 + sum(
        (s.solar_om_cr_year + b.bess_om_cr_year) * (1 + r.om_escalation_percent / 100) ** yr * 1e7 / (1 + wacc) ** (yr + 1)
        for yr in range(years)
    )) / (pv_gen * 1000) if pv_gen > 0 else None

    solar_financials = FinancialSummary(
        npv_cr=round(solar_npv, 2),
        irr_percent=round(solar_irr, 2) if solar_irr else None,
        simple_payback_years=None,
        total_capex_cr=s.solar_capex_cr,
        lcoe_inr_kwh=round(solar_only_lcoe, 3) if solar_only_lcoe else None,
    )
    hybrid_financials = FinancialSummary(
        npv_cr=round(hybrid_npv, 2),
        irr_percent=round(hybrid_irr, 2) if hybrid_irr else None,
        simple_payback_years=round(payback_years, 1) if payback_years else None,
        total_capex_cr=s.solar_capex_cr + b.bess_capex_cr,
        lcoe_inr_kwh=round(hybrid_lcoe, 3) if hybrid_lcoe else None,
    )

    # --- Incremental metrics ---
    incremental_revenue = year1_hybrid.total_revenue_cr - year1_solar.total_revenue_cr
    incremental_profit = year1_hybrid.net_profit_cr - year1_solar.net_profit_cr
    incremental_npv = hybrid_npv - solar_npv

    # --- Business rule warnings ---
    if s.cuf_percent > 30:
        warnings_list.append(Warning(
            field="cuf_percent",
            message=f"CUF of {s.cuf_percent}% is unusually high for Indian solar. Verify with site-specific irradiance data.",
            severity="warning",
        ))
    if b.bess_capex_cr / (b.bess_capacity_mwh + 1e-6) > 3.5:
        warnings_list.append(Warning(
            field="bess_capex_cr",
            message="BESS CAPEX per MWh exceeds ₹3.5 Cr/MWh — significantly above current market rates. Double-check assumptions.",
            severity="warning",
        ))
    if incremental_npv < 0:
        warnings_list.append(Warning(
            field="bess_capex_cr",
            message="Incremental NPV from BESS is negative. BESS addition destroys value under current assumptions.",
            severity="error",
        ))

    # --- Recommendation ---
    incremental_irr = hybrid_irr - solar_irr if (hybrid_irr and solar_irr) else None
    if incremental_npv > 0 and (payback_years or 99) < 8:
        recommendation = "Attractive"
        recommendation_reason = (
            f"BESS addition creates ₹{incremental_npv:.1f} Cr of incremental NPV "
            f"with a payback of {payback_years:.1f} years. Strong case for deployment."
        ) if payback_years else f"BESS generates positive incremental NPV of ₹{incremental_npv:.1f} Cr."
    elif incremental_npv > 0:
        recommendation = "Marginal"
        recommendation_reason = (
            f"BESS creates positive NPV (₹{incremental_npv:.1f} Cr) but payback extends beyond 8 years. "
            "Consider phased deployment or lower-cost battery options."
        )
    else:
        recommendation = "Not Attractive"
        recommendation_reason = (
            f"BESS destroys ₹{abs(incremental_npv):.1f} Cr of value under current revenue assumptions. "
            "Re-evaluate revenue stack or negotiate better ancillary/peak tariffs."
        )

    # --- Sensitivity analysis ---
    sensitivity = []
    if compute_sensitivity:
        sensitivity = _compute_sensitivity(inputs, solar_npv, hybrid_npv)

    return dict(
        inputs_summary=inputs.model_dump(),
        solar_only_year1=year1_solar,
        hybrid_year1=year1_hybrid,
        incremental_revenue_cr=round(incremental_revenue, 2),
        incremental_profit_cr=round(incremental_profit, 2),
        incremental_npv_cr=round(incremental_npv, 2),
        solar_only_financials=solar_financials,
        hybrid_financials=hybrid_financials,
        annual_cash_flows=annual_cash_flows,
        sensitivity=sensitivity,
        warnings=warnings_list,
        recommendation=recommendation,
        recommendation_reason=recommendation_reason,
    )


# ---------------------------------------------------------------------------
# Sensitivity analysis (tornado)
# ---------------------------------------------------------------------------

def _compute_sensitivity(inputs: ProjectInputs, base_solar_npv: float, base_hybrid_npv: float) -> list[SensitivityPoint]:
    """Vary key parameters ±10% and ±20%, compute NPV impact."""
    from copy import deepcopy

    variables = [
        ("PPA Tariff", "solar", "ppa_tariff_inr"),
        ("BESS CAPEX", "bess", "bess_capex_cr"),
        ("Peak Sell Tariff", "revenue", "peak_sell_tariff_inr"),
        ("CUF (%)", "solar", "cuf_percent"),
        ("WACC (%)", "solar", "wacc_percent"),
        ("Battery Degradation", "bess", "battery_degradation_percent"),
    ]

    results: list[SensitivityPoint] = []
    for label, section, field in variables:
        for delta in [-20, -10, 10, 20]:
            inp_copy = deepcopy(inputs)
            section_obj = getattr(inp_copy, section)
            base_val = getattr(section_obj, field)
            new_val = base_val * (1 + delta / 100)
            setattr(section_obj, field, new_val)
            try:
                res = run_analysis(inp_copy, compute_sensitivity=False)
                s_npv = res["solar_only_financials"].npv_cr
                h_npv = res["hybrid_financials"].npv_cr
            except Exception:
                s_npv = base_solar_npv
                h_npv = base_hybrid_npv
            results.append(SensitivityPoint(
                variable=label,
                change_percent=delta,
                solar_only_npv_cr=round(s_npv, 2),
                hybrid_npv_cr=round(h_npv, 2),
                npv_gain_cr=round(h_npv - s_npv, 2),
            ))
    return results
