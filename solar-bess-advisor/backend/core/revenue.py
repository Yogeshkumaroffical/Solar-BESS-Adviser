"""
Core revenue calculation engine for Solar BESS Profitability Advisor.

All generation values are in MWh.
All monetary values are in INR Crores (1 Crore = 10,000,000 INR).
Conversion: INR/kWh × MWh = INR × 1000; divide by 10_000_000 to get Crores.
"""

from dataclasses import dataclass


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

MWH_TO_KWH = 1_000          # 1 MWh = 1000 kWh
INR_TO_CR = 10_000_000      # 1 Crore = 10M INR


def inr_kwh_x_mwh_to_cr(tariff_inr_kwh: float, energy_mwh: float) -> float:
    """Convert (tariff in INR/kWh) × (energy in MWh) → INR Crores."""
    return (tariff_inr_kwh * energy_mwh * MWH_TO_KWH) / INR_TO_CR


# ─────────────────────────────────────────────────────────────────────────────
# Revenue calculations — Solar Only
# ─────────────────────────────────────────────────────────────────────────────

def compute_annual_generation_mwh(
    capacity_mw: float,
    cuf_fraction: float,
    hours_per_year: int = 8760,
) -> float:
    """
    Annual generation at plant output (before losses).
    generation = Capacity × CUF × 8760
    """
    return capacity_mw * cuf_fraction * hours_per_year


def compute_base_ppa_revenue_cr(
    generation_mwh: float,
    ppa_tariff_inr: float,
) -> float:
    """Base revenue from selling all generation at PPA tariff."""
    return inr_kwh_x_mwh_to_cr(ppa_tariff_inr, generation_mwh)


def compute_dsm_penalty_cr(
    base_revenue_cr: float,
    dsm_penalty_fraction: float,
) -> float:
    """
    DSM (Deviation Settlement Mechanism) penalty.
    Returns the penalty amount as a positive number (it's a cost).
    Typically 1–3% of revenue for a solar-only plant with no storage.
    """
    return base_revenue_cr * dsm_penalty_fraction


# ─────────────────────────────────────────────────────────────────────────────
# Revenue calculations — Hybrid (Solar + BESS)
# ─────────────────────────────────────────────────────────────────────────────

def compute_clipping_recovery_cr(
    generation_mwh: float,
    clipping_fraction: float,
    recovery_factor: float,
    sell_tariff_inr: float,
    ppa_tariff_inr: float,
    rte: float,
) -> float:
    """
    Revenue from recovering clipping losses.
    The BESS stores energy that would have been clipped and sells it at
    peak/sell tariff instead of losing it.

    Value = clipped_energy × recovery_factor × RTE × (sell_tariff - ppa_tariff)
    The 'ppa_tariff' term represents the opportunity cost already counted in base revenue.
    Since clipped energy is NOT in base revenue, the full sell tariff is the gain.
    """
    clipped_mwh = generation_mwh * clipping_fraction
    recoverable_mwh = clipped_mwh * recovery_factor * rte
    return inr_kwh_x_mwh_to_cr(sell_tariff_inr, recoverable_mwh)


def compute_curtailment_recovery_cr(
    generation_mwh: float,
    curtailment_fraction: float,
    recovery_factor: float,
    sell_tariff_inr: float,
    rte: float,
) -> float:
    """
    Revenue from recovering curtailed energy.
    Curtailed energy is stored in BESS and dispatched when grid accepts it.
    Value = curtailed_energy × recovery_factor × RTE × sell_tariff
    """
    curtailed_mwh = generation_mwh * curtailment_fraction
    recoverable_mwh = curtailed_mwh * recovery_factor * rte
    return inr_kwh_x_mwh_to_cr(sell_tariff_inr, recoverable_mwh)


def compute_arbitrage_cr(
    bess_capacity_mwh: float,
    bess_degradation_factor: float,
    cycles_per_day: float,
    rte: float,
    sell_tariff_inr: float,
    buy_tariff_inr: float,
    days_per_year: int = 365,
) -> float:
    """
    Energy arbitrage revenue: buy low (or charge from own solar at effective zero cost),
    sell high.

    If buy_tariff_inr = 0, the BESS charges from own solar generation (zero marginal cost).
    Net revenue = dispatched_energy × (sell_tariff - buy_tariff / RTE)
    For own-solar charging: buy cost is effectively 0 since the energy is already owned.

    dispatched_energy = BESS_capacity × degradation_factor × cycles_per_day × 365 × RTE
    """
    effective_capacity = bess_capacity_mwh * bess_degradation_factor
    discharged_mwh_year = effective_capacity * cycles_per_day * days_per_year * rte

    if buy_tariff_inr == 0:
        # Charging from own solar: only cost is energy that could have sold at PPA
        # This is captured in peak_shift; arbitrage margin is pure sell tariff uplift
        net_tariff = sell_tariff_inr
    else:
        # Grid arbitrage: charge at off-peak, discharge at peak
        # Input energy needed = discharged / RTE; cost = input_energy × buy_tariff
        net_tariff = sell_tariff_inr - (buy_tariff_inr / rte)

    if net_tariff <= 0:
        return 0.0

    return inr_kwh_x_mwh_to_cr(net_tariff, discharged_mwh_year)


def compute_peak_shift_cr(
    bess_capacity_mwh: float,
    bess_degradation_factor: float,
    cycles_per_day: float,
    rte: float,
    peak_sell_tariff_inr: float,
    ppa_tariff_inr: float,
    days_per_year: int = 365,
) -> float:
    """
    Peak-shift uplift: the additional revenue from selling at peak tariff
    vs what would have been earned at PPA tariff.

    Only applies when buy_tariff = 0 (own-solar charging).
    Uplift = discharged_energy × (peak_tariff - ppa_tariff)
    """
    effective_capacity = bess_capacity_mwh * bess_degradation_factor
    discharged_mwh_year = effective_capacity * cycles_per_day * days_per_year * rte
    tariff_uplift = peak_sell_tariff_inr - ppa_tariff_inr

    if tariff_uplift <= 0:
        return 0.0

    return inr_kwh_x_mwh_to_cr(tariff_uplift, discharged_mwh_year)


def compute_ancillary_cr(
    enabled: bool,
    ancillary_capacity_mw: float,
    ancillary_rate_cr_mw_year: float,
) -> float:
    """
    Ancillary service revenue (frequency regulation, spinning reserve, etc.).
    Simple flat rate model: rate × capacity.
    """
    if not enabled:
        return 0.0
    return ancillary_capacity_mw * ancillary_rate_cr_mw_year


def compute_dsm_savings_cr(
    solar_only_dsm_cr: float,
    hybrid_dsm_fraction: float = 0.2,
) -> float:
    """
    DSM savings from adding BESS.
    With BESS, the plant can dispatch more predictably, reducing DSM penalties.
    Assumption: BESS reduces DSM exposure to 20% of solar-only level.
    """
    return solar_only_dsm_cr * (1 - hybrid_dsm_fraction)


# ─────────────────────────────────────────────────────────────────────────────
# Revenue bundle computation
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class RevenueResult:
    base_ppa_revenue_cr: float
    dsm_penalty_cr: float
    dsm_savings_cr: float
    clipping_recovery_cr: float
    curtailment_recovery_cr: float
    arbitrage_cr: float
    peak_shift_cr: float
    ancillary_cr: float
    total_revenue_cr: float
    total_om_cr: float
    net_profit_cr: float
    net_profit_after_tax_cr: float


def compute_solar_only_revenue(
    generation_mwh: float,
    ppa_tariff_inr: float,
    dsm_penalty_fraction: float,
    om_cr: float,
    tax_rate_fraction: float,
) -> RevenueResult:
    """Compute solar-only annual revenue and profit."""
    base_rev = compute_base_ppa_revenue_cr(generation_mwh, ppa_tariff_inr)
    dsm = compute_dsm_penalty_cr(base_rev, dsm_penalty_fraction)
    total_rev = base_rev - dsm
    net_profit = total_rev - om_cr
    net_profit_after_tax = net_profit * (1 - tax_rate_fraction)

    return RevenueResult(
        base_ppa_revenue_cr=base_rev,
        dsm_penalty_cr=dsm,
        dsm_savings_cr=0.0,
        clipping_recovery_cr=0.0,
        curtailment_recovery_cr=0.0,
        arbitrage_cr=0.0,
        peak_shift_cr=0.0,
        ancillary_cr=0.0,
        total_revenue_cr=total_rev,
        total_om_cr=om_cr,
        net_profit_cr=net_profit,
        net_profit_after_tax_cr=net_profit_after_tax,
    )


def compute_hybrid_revenue(
    generation_mwh: float,
    ppa_tariff_inr: float,
    dsm_penalty_fraction: float,
    solar_only_dsm_cr: float,
    clipping_fraction: float,
    clipping_recovery_factor: float,
    clipping_sell_tariff_inr: float,
    curtailment_fraction: float,
    curtailment_recovery_factor: float,
    curtailment_sell_tariff_inr: float,
    bess_capacity_mwh: float,
    bess_degradation_factor: float,
    cycles_per_day: float,
    rte: float,
    off_peak_buy_tariff_inr: float,
    peak_sell_tariff_inr: float,
    ancillary_enabled: bool,
    ancillary_capacity_mw: float,
    ancillary_rate_cr_mw_year: float,
    total_om_cr: float,
    tax_rate_fraction: float,
) -> RevenueResult:
    """Compute hybrid (solar+BESS) annual revenue and profit."""
    base_rev = compute_base_ppa_revenue_cr(generation_mwh, ppa_tariff_inr)

    # DSM is much lower with BESS dispatchability
    hybrid_dsm = compute_dsm_penalty_cr(base_rev, dsm_penalty_fraction * 0.2)
    dsm_savings = solar_only_dsm_cr - hybrid_dsm

    clipping = compute_clipping_recovery_cr(
        generation_mwh, clipping_fraction, clipping_recovery_factor,
        clipping_sell_tariff_inr, ppa_tariff_inr, rte
    )
    curtailment = compute_curtailment_recovery_cr(
        generation_mwh, curtailment_fraction, curtailment_recovery_factor,
        curtailment_sell_tariff_inr, rte
    )

    if off_peak_buy_tariff_inr == 0:
        # Own-solar charging: use peak_shift model
        arbitrage = 0.0
        peak_shift = compute_peak_shift_cr(
            bess_capacity_mwh, bess_degradation_factor, cycles_per_day,
            rte, peak_sell_tariff_inr, ppa_tariff_inr
        )
    else:
        # Grid arbitrage
        arbitrage = compute_arbitrage_cr(
            bess_capacity_mwh, bess_degradation_factor, cycles_per_day,
            rte, peak_sell_tariff_inr, off_peak_buy_tariff_inr
        )
        peak_shift = 0.0

    ancillary = compute_ancillary_cr(
        ancillary_enabled, ancillary_capacity_mw, ancillary_rate_cr_mw_year
    )

    total_rev = (
        base_rev
        - hybrid_dsm
        + clipping
        + curtailment
        + arbitrage
        + peak_shift
        + ancillary
    )
    net_profit = total_rev - total_om_cr
    net_profit_after_tax = net_profit * (1 - tax_rate_fraction)

    return RevenueResult(
        base_ppa_revenue_cr=base_rev,
        dsm_penalty_cr=hybrid_dsm,
        dsm_savings_cr=dsm_savings,
        clipping_recovery_cr=clipping,
        curtailment_recovery_cr=curtailment,
        arbitrage_cr=arbitrage,
        peak_shift_cr=peak_shift,
        ancillary_cr=ancillary,
        total_revenue_cr=total_rev,
        total_om_cr=total_om_cr,
        net_profit_cr=net_profit,
        net_profit_after_tax_cr=net_profit_after_tax,
    )
