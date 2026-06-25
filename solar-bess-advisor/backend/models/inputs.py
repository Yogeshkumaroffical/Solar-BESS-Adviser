"""
Pydantic input models for the Solar BESS Profitability Advisor.
All monetary values are in INR Crores unless noted.
All percentages are entered as percentages (e.g., 22 for 22%) and converted
internally to fractions where needed.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional


class SolarInputs(BaseModel):
    """Solar plant technical and commercial parameters."""

    plant_capacity_mw: float = Field(
        500.0, ge=1, le=50000, description="Solar plant capacity in MW"
    )
    cuf_percent: float = Field(
        22.0, ge=5, le=40, description="Capacity Utilization Factor (%)"
    )
    ppa_tariff_inr: float = Field(
        2.5, ge=0.5, le=20, description="PPA tariff in INR/kWh"
    )
    clipping_loss_percent: float = Field(
        2.0, ge=0, le=20, description="Clipping loss as % of annual generation"
    )
    curtailment_percent: float = Field(
        1.0, ge=0, le=30, description="Grid curtailment as % of annual generation"
    )
    dsm_penalty_percent: float = Field(
        1.5, ge=0, le=15, description="DSM penalty as % of annual PPA revenue"
    )
    solar_capex_cr: float = Field(
        1750.0, ge=0, description="Total solar CAPEX in INR Crores"
    )
    solar_om_cr_year: float = Field(
        8.75, ge=0, description="Solar annual O&M in INR Crores"
    )
    solar_degradation_percent: float = Field(
        0.5, ge=0, le=3, description="Annual solar degradation (%)"
    )
    project_life_years: int = Field(
        25, ge=5, le=40, description="Project life in years"
    )
    wacc_percent: float = Field(
        10.0, ge=1, le=30, description="Discount rate / WACC (%)"
    )
    tax_rate_percent: float = Field(
        25.17, ge=0, le=50, description="Effective corporate tax rate (%)"
    )

    @field_validator("cuf_percent")
    @classmethod
    def warn_high_cuf(cls, v):
        # Validation happens; warnings are returned in the response model
        return v


class BESSInputs(BaseModel):
    """Battery Energy Storage System technical and cost parameters."""

    bess_capacity_mwh: float = Field(
        250.0, ge=0, description="BESS energy capacity in MWh"
    )
    bess_power_mw: float = Field(
        100.0, ge=0, description="BESS power rating in MW"
    )
    bess_capex_cr: float = Field(
        150.0, ge=0, description="BESS CAPEX in INR Crores"
    )
    bess_om_cr_year: float = Field(
        1.5, ge=0, description="BESS annual O&M in INR Crores"
    )
    rte_percent: float = Field(
        88.0, ge=50, le=100, description="Round-trip efficiency (%)"
    )
    battery_degradation_percent: float = Field(
        2.0, ge=0, le=10, description="Annual battery capacity degradation (%)"
    )
    cycles_per_day: float = Field(
        1.0, ge=0.1, le=3, description="Battery cycles per day"
    )
    replacement_year: Optional[int] = Field(
        None, ge=1, le=39, description="Year for battery replacement (optional)"
    )
    replacement_cost_cr: Optional[float] = Field(
        None, ge=0, description="Battery replacement cost in INR Crores"
    )

    @model_validator(mode="after")
    def validate_replacement(self):
        if self.replacement_year is not None and self.replacement_cost_cr is None:
            raise ValueError(
                "replacement_cost_cr is required when replacement_year is set"
            )
        return self


class RevenueInputs(BaseModel):
    """Revenue stack assumptions for hybrid solar+BESS project."""

    # Arbitrage
    off_peak_buy_tariff_inr: float = Field(
        0.0,
        ge=0,
        le=20,
        description="Off-peak buy tariff for arbitrage in INR/kWh (0 = charges from own solar)",
    )
    peak_sell_tariff_inr: float = Field(
        3.3, ge=0.5, le=30, description="Peak-hour sell tariff in INR/kWh"
    )

    # Curtailment sell tariff
    curtailment_sell_tariff_inr: float = Field(
        3.3,
        ge=0.5,
        le=30,
        description="Tariff at which curtailed+stored energy is sold in INR/kWh",
    )

    # Clipping recovery sell tariff
    clipping_sell_tariff_inr: float = Field(
        3.3,
        ge=0.5,
        le=30,
        description="Tariff at which clipped+stored energy is sold in INR/kWh",
    )

    # What fraction of clipping/curtailment does the BESS actually recover?
    clipping_recovery_factor: float = Field(
        0.85,
        ge=0,
        le=1,
        description="Fraction of clipping loss the BESS can actually capture (0–1)",
    )
    curtailment_recovery_factor: float = Field(
        0.80,
        ge=0,
        le=1,
        description="Fraction of curtailment the BESS can capture (0–1)",
    )

    # Ancillary services
    ancillary_enabled: bool = Field(False, description="Enable ancillary service revenue")
    ancillary_rate_cr_mw_year: float = Field(
        0.5,
        ge=0,
        description="Ancillary service revenue rate in INR Crores/MW/year",
    )
    ancillary_capacity_mw: float = Field(
        20.0, ge=0, description="MW of BESS capacity offered for ancillary services"
    )

    # O&M escalation
    om_escalation_percent: float = Field(
        3.0, ge=0, le=10, description="Annual O&M cost escalation (%)"
    )


class ProjectInputs(BaseModel):
    """Top-level input model combining all sections."""

    solar: SolarInputs = Field(default_factory=SolarInputs)
    bess: BESSInputs = Field(default_factory=BESSInputs)
    revenue: RevenueInputs = Field(default_factory=RevenueInputs)

    @model_validator(mode="after")
    def validate_bess_vs_solar(self):
        if self.bess.bess_power_mw > self.solar.plant_capacity_mw:
            raise ValueError(
                "BESS power rating cannot exceed solar plant capacity"
            )
        return self
