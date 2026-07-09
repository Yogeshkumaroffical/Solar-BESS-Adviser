"""
Unit tests for the financial engine calculations of Solar BESS Profitability Advisor.
"""

import pytest
from services.financial_engine import _irr, run_analysis
from models.inputs import ProjectInputs, SolarInputs, BESSInputs, RevenueInputs


def test_irr_basic():
    # Basic cash flow with simple IRR: -100, 10, 110 (IRR should be 10%)
    cfs = [-100.0, 10.0, 110.0]
    irr_val = _irr(cfs)
    assert irr_val is not None
    assert pytest.approx(irr_val, 0.001) == 10.0


def test_irr_no_solution():
    # All negative cash flows, no IRR
    cfs = [-100.0, -10.0, -110.0]
    assert _irr(cfs) is None


def test_default_scenario_analysis():
    # Initialize inputs with default scenario values
    inputs = ProjectInputs(
        solar=SolarInputs(
            plant_capacity_mw=500,
            cuf_percent=22,
            ppa_tariff_inr=2.5,
            clipping_loss_percent=2.0,
            curtailment_percent=1.0,
            dsm_penalty_percent=1.5,
            solar_capex_cr=1750.0,
            solar_om_cr_year=8.75,
            solar_degradation_percent=0.5,
            project_life_years=25,
            wacc_percent=10.0,
            tax_rate_percent=25.17,
        ),
        bess=BESSInputs(
            bess_capacity_mwh=250.0,
            bess_power_mw=100.0,
            bess_capex_cr=150.0,
            bess_om_cr_year=1.5,
            rte_percent=88.0,
            battery_degradation_percent=2.0,
            cycles_per_day=1.0,
        ),
        revenue=RevenueInputs(
            off_peak_buy_tariff_inr=0.0,  # own solar
            peak_sell_tariff_inr=3.3,
            curtailment_sell_tariff_inr=3.3,
            clipping_sell_tariff_inr=3.3,
            clipping_recovery_factor=0.85,
            curtailment_recovery_factor=0.80,
            ancillary_enabled=False,
        )
    )

    result = run_analysis(inputs)

    assert result["recommendation"] in ["Attractive", "Marginal", "Not Attractive"]
    assert len(result["annual_cash_flows"]) == 25
    assert result["solar_only_financials"].npv_cr == -272.1
    assert result["hybrid_financials"].npv_cr == -332.48
    assert len(result["sensitivity"]) > 0


def test_zero_bess_scenario():
    # If BESS is zero capacity, hybrid and solar-only should be very close
    # (except hybrid still has bess_capex=0 and O&M=0)
    inputs = ProjectInputs(
        solar=SolarInputs(
            plant_capacity_mw=100,
            cuf_percent=20,
            ppa_tariff_inr=2.5,
            clipping_loss_percent=2.0,
            curtailment_percent=1.0,
            dsm_penalty_percent=1.5,
            solar_capex_cr=350.0,
            solar_om_cr_year=2.0,
            solar_degradation_percent=0.5,
            project_life_years=25,
            wacc_percent=10.0,
            tax_rate_percent=25.0,
        ),
        bess=BESSInputs(
            bess_capacity_mwh=0.0,
            bess_power_mw=0.0,
            bess_capex_cr=0.0,
            bess_om_cr_year=0.0,
            rte_percent=80.0,
            battery_degradation_percent=2.0,
            cycles_per_day=0.0,
        ),
        revenue=RevenueInputs(
            off_peak_buy_tariff_inr=0.0,
            peak_sell_tariff_inr=2.5,
            curtailment_sell_tariff_inr=2.5,
            clipping_sell_tariff_inr=2.5,
            clipping_recovery_factor=0.0,
            curtailment_recovery_factor=0.0,
            ancillary_enabled=False,
        )
    )

    result = run_analysis(inputs)
    # BESS is zero, so hybrid npv should equal solar only npv plus DSM savings (if any are modelled)
    # DSM savings are still computed because hybrid reduces DSM by 70%.
    # If DSM is positive, hybrid NPV will be slightly higher because of DSM savings.
    assert result["hybrid_financials"].npv_cr >= result["solar_only_financials"].npv_cr
