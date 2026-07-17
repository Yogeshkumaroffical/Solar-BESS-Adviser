"""
Unit tests for the core revenue calculation functions.
"""

import os
import sys
import pytest

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.revenue import (
    inr_kwh_x_mwh_to_cr,
    compute_annual_generation_mwh,
    compute_base_ppa_revenue_cr,
    compute_dsm_penalty_cr,
    compute_clipping_recovery_cr,
    compute_curtailment_recovery_cr,
    compute_arbitrage_cr,
    compute_peak_shift_cr,
    compute_ancillary_cr,
    compute_dsm_savings_cr,
    compute_solar_only_revenue,
    compute_hybrid_revenue,
)


# ---------------------------------------------------------------------------
# Helper: unit conversion
# ---------------------------------------------------------------------------

def test_inr_kwh_x_mwh_to_cr():
    # 1 INR/kWh × 10,000,000 MWh = 10,000,000,000,000 INR = 1,000,000 Cr
    # Simpler: 1 INR/kWh × 10 MWh = 10,000 INR = 0.001 Cr
    result = inr_kwh_x_mwh_to_cr(1.0, 10.0)
    assert pytest.approx(result, rel=1e-6) == 0.001  # 10 MWh × 1 INR/kWh × 1000 / 10_000_000


# ---------------------------------------------------------------------------
# Solar-only revenue functions
# ---------------------------------------------------------------------------

def test_annual_generation():
    # 100 MW × 20% CUF × 8760 hrs = 175,200 MWh
    gen = compute_annual_generation_mwh(100.0, 0.20)
    assert pytest.approx(gen, rel=1e-6) == 175_200.0


def test_base_ppa_revenue():
    # 100,000 MWh @ ₹2.5/kWh = 100,000 × 2.5 × 1000 / 10_000_000 = 25 Cr
    rev = compute_base_ppa_revenue_cr(100_000.0, 2.5)
    assert pytest.approx(rev, rel=1e-6) == 25.0


def test_dsm_penalty():
    # 25 Cr base × 1.5% penalty = 0.375 Cr
    penalty = compute_dsm_penalty_cr(25.0, 0.015)
    assert pytest.approx(penalty, rel=1e-6) == 0.375


# ---------------------------------------------------------------------------
# BESS revenue streams
# ---------------------------------------------------------------------------

def test_clipping_recovery():
    # 100,000 MWh gen, 2% clipping, 85% recovery, RTE=90%, sell @ ₹3.3/kWh
    result = compute_clipping_recovery_cr(
        generation_mwh=100_000.0,
        clipping_fraction=0.02,
        recovery_factor=0.85,
        sell_tariff_inr=3.3,
        ppa_tariff_inr=2.5,
        rte=0.90,
    )
    # clipped = 2000 MWh, recoverable = 2000 × 0.85 × 0.90 = 1530 MWh
    # revenue = 1530 × 3.3 × 1000 / 10_000_000 = 0.5049 Cr
    expected = inr_kwh_x_mwh_to_cr(3.3, 1530.0)
    assert pytest.approx(result, rel=1e-4) == expected


def test_curtailment_recovery():
    # 100,000 MWh gen, 1% curtailment, 80% recovery, RTE=90%, sell @ ₹3.3/kWh
    result = compute_curtailment_recovery_cr(
        generation_mwh=100_000.0,
        curtailment_fraction=0.01,
        recovery_factor=0.80,
        sell_tariff_inr=3.3,
        rte=0.90,
    )
    # curtailed = 1000 MWh, recoverable = 1000 × 0.80 × 0.90 = 720 MWh
    expected = inr_kwh_x_mwh_to_cr(3.3, 720.0)
    assert pytest.approx(result, rel=1e-4) == expected


def test_arbitrage_own_solar():
    # 250 MWh BESS, 1 cycle/day, RTE=88%, peak sell @ ₹3.3/kWh, buy=0 (own solar)
    result = compute_arbitrage_cr(
        bess_capacity_mwh=250.0,
        bess_degradation_factor=1.0,
        cycles_per_day=1.0,
        rte=0.88,
        sell_tariff_inr=3.3,
        buy_tariff_inr=0.0,
    )
    # discharge = 250 × 1 × 365 × 0.88 = 80,300 MWh
    # revenue = 80,300 × 3.3 × 1000 / 10_000_000 = 26.499 Cr
    expected = inr_kwh_x_mwh_to_cr(3.3, 250.0 * 1.0 * 365 * 0.88)
    assert pytest.approx(result, rel=1e-4) == expected


def test_arbitrage_grid():
    # 100 MWh BESS, 1 cycle/day, RTE=85%, sell @ ₹4/kWh, buy @ ₹1.5/kWh
    result = compute_arbitrage_cr(
        bess_capacity_mwh=100.0,
        bess_degradation_factor=1.0,
        cycles_per_day=1.0,
        rte=0.85,
        sell_tariff_inr=4.0,
        buy_tariff_inr=1.5,
    )
    # discharge = 100 × 0.85 × 365 = 31,025 MWh
    # net_tariff = 4.0 - 1.5/0.85 = 4.0 - 1.7647 = 2.2353
    net_tariff = 4.0 - (1.5 / 0.85)
    discharge_mwh = 100.0 * 0.85 * 365
    expected = inr_kwh_x_mwh_to_cr(net_tariff, discharge_mwh)
    assert pytest.approx(result, rel=1e-4) == expected


def test_arbitrage_negative_margin_returns_zero():
    # If sell < buy/RTE, arbitrage should be 0
    result = compute_arbitrage_cr(
        bess_capacity_mwh=100.0,
        bess_degradation_factor=1.0,
        cycles_per_day=1.0,
        rte=0.85,
        sell_tariff_inr=1.0,
        buy_tariff_inr=3.0,
    )
    assert result == 0.0


def test_peak_shift():
    # 250 MWh BESS, 1 cycle/day, RTE=88%, peak @ ₹3.3, PPA @ ₹2.5
    result = compute_peak_shift_cr(
        bess_capacity_mwh=250.0,
        bess_degradation_factor=1.0,
        cycles_per_day=1.0,
        rte=0.88,
        peak_sell_tariff_inr=3.3,
        ppa_tariff_inr=2.5,
    )
    # discharge = 250 × 0.88 × 365 = 80,300 MWh
    # uplift = 3.3 - 2.5 = 0.8 INR/kWh
    expected = inr_kwh_x_mwh_to_cr(0.8, 250.0 * 0.88 * 365)
    assert pytest.approx(result, rel=1e-4) == expected


def test_ancillary_disabled():
    assert compute_ancillary_cr(False, 20.0, 0.5) == 0.0


def test_ancillary_enabled():
    # 20 MW × 0.5 Cr/MW/yr = 10 Cr
    assert compute_ancillary_cr(True, 20.0, 0.5) == pytest.approx(10.0)


def test_dsm_savings():
    # Solar-only DSM = 5 Cr, hybrid reduces to 20% → savings = 80% = 4 Cr
    assert compute_dsm_savings_cr(5.0, 0.2) == pytest.approx(4.0)


# ---------------------------------------------------------------------------
# Bundle functions (solar-only and hybrid)
# ---------------------------------------------------------------------------

def test_compute_solar_only_revenue_sanity():
    result = compute_solar_only_revenue(
        generation_mwh=175_200.0,
        ppa_tariff_inr=2.5,
        dsm_penalty_fraction=0.015,
        om_cr=8.75,
        tax_rate_fraction=0.2517,
    )
    assert result.base_ppa_revenue_cr > 0
    assert result.dsm_penalty_cr > 0
    assert result.dsm_savings_cr == 0.0
    assert result.arbitrage_cr == 0.0
    assert result.total_revenue_cr == pytest.approx(
        result.base_ppa_revenue_cr - result.dsm_penalty_cr, rel=1e-5
    )
    assert result.net_profit_after_tax_cr < result.net_profit_cr


def test_compute_hybrid_revenue_higher_than_solar():
    """Hybrid revenue should exceed solar-only under typical positive assumptions."""
    gen = 175_200.0  # 100 MW, 20% CUF
    solar = compute_solar_only_revenue(
        generation_mwh=gen,
        ppa_tariff_inr=2.5,
        dsm_penalty_fraction=0.015,
        om_cr=8.75,
        tax_rate_fraction=0.25,
    )
    hybrid = compute_hybrid_revenue(
        generation_mwh=gen,
        ppa_tariff_inr=2.5,
        dsm_penalty_fraction=0.015,
        solar_only_dsm_cr=solar.dsm_penalty_cr,
        clipping_fraction=0.02,
        clipping_recovery_factor=0.85,
        clipping_sell_tariff_inr=3.3,
        curtailment_fraction=0.01,
        curtailment_recovery_factor=0.80,
        curtailment_sell_tariff_inr=3.3,
        bess_capacity_mwh=250.0,
        bess_degradation_factor=1.0,
        cycles_per_day=1.0,
        rte=0.88,
        off_peak_buy_tariff_inr=0.0,  # own solar
        peak_sell_tariff_inr=3.3,
        ancillary_enabled=False,
        ancillary_capacity_mw=0.0,
        ancillary_rate_cr_mw_year=0.0,
        total_om_cr=10.25,
        tax_rate_fraction=0.25,
    )
    assert hybrid.total_revenue_cr > solar.total_revenue_cr
