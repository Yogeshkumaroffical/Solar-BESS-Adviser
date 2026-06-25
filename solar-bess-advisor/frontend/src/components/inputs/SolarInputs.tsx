import React from 'react';
import { useAnalysisStore } from '../../store/analysisStore';

export default function SolarInputs() {
  const { inputs, setSolarInput, setInputStep } = useAnalysisStore();
  const s = inputs.solar;

  const handleChange = (key: keyof typeof s, value: string) => {
    const num = parseFloat(value);
    setSolarInput(key, isNaN(num) ? 0 : num);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">☀️ Solar Plant Parameters</h2>
      </div>
      <div className="card-body">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="plant_capacity_mw">
              Solar Plant Capacity
              <span className="form-unit">MW</span>
            </label>
            <input
              id="plant_capacity_mw"
              type="number"
              className="form-input"
              value={s.plant_capacity_mw}
              onChange={(e) => handleChange('plant_capacity_mw', e.target.value)}
              min={1}
            />
            <p className="form-hint">AC capacity of the solar plant.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cuf_percent">
              Capacity Utilization Factor (CUF)
              <span className="form-unit">%</span>
            </label>
            <input
              id="cuf_percent"
              type="number"
              className="form-input"
              value={s.cuf_percent}
              onChange={(e) => handleChange('cuf_percent', e.target.value)}
              min={5}
              max={40}
              step={0.1}
            />
            <p className="form-hint">Expected annual solar plant generation factor.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ppa_tariff_inr">
              PPA Tariff
              <span className="form-unit">₹/kWh</span>
            </label>
            <input
              id="ppa_tariff_inr"
              type="number"
              className="form-input"
              value={s.ppa_tariff_inr}
              onChange={(e) => handleChange('ppa_tariff_inr', e.target.value)}
              min={0.5}
              step={0.01}
            />
            <p className="form-hint">Selling rate for base solar power.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="clipping_loss_percent">
              Clipping Loss
              <span className="form-unit">%</span>
            </label>
            <input
              id="clipping_loss_percent"
              type="number"
              className="form-input"
              value={s.clipping_loss_percent}
              onChange={(e) => handleChange('clipping_loss_percent', e.target.value)}
              min={0}
              step={0.1}
            />
            <p className="form-hint">% of generation clipped due to DC/AC overloading.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="curtailment_percent">
              Grid Curtailment
              <span className="form-unit">%</span>
            </label>
            <input
              id="curtailment_percent"
              type="number"
              className="form-input"
              value={s.curtailment_percent}
              onChange={(e) => handleChange('curtailment_percent', e.target.value)}
              min={0}
              step={0.1}
            />
            <p className="form-hint">Expected generation curtailed by the grid manager.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dsm_penalty_percent">
              DSM Penalty (Solar Only)
              <span className="form-unit">% of PPA Rev</span>
            </label>
            <input
              id="dsm_penalty_percent"
              type="number"
              className="form-input"
              value={s.dsm_penalty_percent}
              onChange={(e) => handleChange('dsm_penalty_percent', e.target.value)}
              min={0}
              step={0.1}
            />
            <p className="form-hint">Deviation settlement penalties without storage.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="solar_capex_cr">
              Solar CAPEX
              <span className="form-unit">₹ Cr</span>
            </label>
            <input
              id="solar_capex_cr"
              type="number"
              className="form-input"
              value={s.solar_capex_cr}
              onChange={(e) => handleChange('solar_capex_cr', e.target.value)}
              min={0}
              step={1}
            />
            <p className="form-hint">Total initial investment for the solar plant.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="solar_om_cr_year">
              Solar Annual O&M
              <span className="form-unit">₹ Cr/yr</span>
            </label>
            <input
              id="solar_om_cr_year"
              type="number"
              className="form-input"
              value={s.solar_om_cr_year}
              onChange={(e) => handleChange('solar_om_cr_year', e.target.value)}
              min={0}
              step={0.01}
            />
            <p className="form-hint">Operations & Maintenance cost in Year 1.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="solar_degradation_percent">
              Annual Solar Degradation
              <span className="form-unit">%</span>
            </label>
            <input
              id="solar_degradation_percent"
              type="number"
              className="form-input"
              value={s.solar_degradation_percent}
              onChange={(e) => handleChange('solar_degradation_percent', e.target.value)}
              min={0}
              max={3}
              step={0.01}
            />
            <p className="form-hint">Annual output degradation of solar panels.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="project_life_years">
              Project Life
              <span className="form-unit">Years</span>
            </label>
            <input
              id="project_life_years"
              type="number"
              className="form-input"
              value={s.project_life_years}
              onChange={(e) => handleChange('project_life_years', e.target.value)}
              min={5}
              max={40}
            />
            <p className="form-hint">Financial evaluation timeframe.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="wacc_percent">
              WACC / Discount Rate
              <span className="form-unit">%</span>
            </label>
            <input
              id="wacc_percent"
              type="number"
              className="form-input"
              value={s.wacc_percent}
              onChange={(e) => handleChange('wacc_percent', e.target.value)}
              min={1}
              step={0.1}
            />
            <p className="form-hint">Weighted Average Cost of Capital.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tax_rate_percent">
              Corporate Tax Rate
              <span className="form-unit">%</span>
            </label>
            <input
              id="tax_rate_percent"
              type="number"
              className="form-input"
              value={s.tax_rate_percent}
              onChange={(e) => handleChange('tax_rate_percent', e.target.value)}
              min={0}
              max={50}
              step={0.01}
            />
            <p className="form-hint">Effective tax rate on profit.</p>
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => setInputStep(1)}>
            Next: BESS Parameters ➔
          </button>
        </div>
      </div>
    </div>
  );
}
