import React from 'react';
import { useAnalysisStore } from '../../store/analysisStore';

export default function BESSInputs() {
  const { inputs, setBessInput, setInputStep } = useAnalysisStore();
  const b = inputs.bess;

  const handleChange = (key: keyof typeof b, value: string) => {
    if (key === 'replacement_year' || key === 'replacement_cost_cr') {
      if (value === '') {
        setBessInput(key, null);
      } else {
        const num = parseFloat(value);
        setBessInput(key, isNaN(num) ? null : num);
      }
    } else {
      const num = parseFloat(value);
      setBessInput(key as any, isNaN(num) ? 0 : num);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">🔋 BESS Technical & Capex Parameters</h2>
      </div>
      <div className="card-body">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="bess_capacity_mwh">
              BESS Capacity
              <span className="form-unit">MWh</span>
            </label>
            <input
              id="bess_capacity_mwh"
              type="number"
              className="form-input"
              value={b.bess_capacity_mwh}
              onChange={(e) => handleChange('bess_capacity_mwh', e.target.value)}
              min={0}
            />
            <p className="form-hint">Energy storage capacity of BESS.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bess_power_mw">
              BESS Power Rating
              <span className="form-unit">MW</span>
            </label>
            <input
              id="bess_power_mw"
              type="number"
              className="form-input"
              value={b.bess_power_mw}
              onChange={(e) => handleChange('bess_power_mw', e.target.value)}
              min={0}
            />
            <p className="form-hint">Maximum output power of the battery pack.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bess_capex_cr">
              BESS Capex
              <span className="form-unit">₹ Cr</span>
            </label>
            <input
              id="bess_capex_cr"
              type="number"
              className="form-input"
              value={b.bess_capex_cr}
              onChange={(e) => handleChange('bess_capex_cr', e.target.value)}
              min={0}
              step={1}
            />
            <p className="form-hint">Initial capital cost for battery system.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bess_om_cr_year">
              BESS O&M Cost
              <span className="form-unit">₹ Cr/yr</span>
            </label>
            <input
              id="bess_om_cr_year"
              type="number"
              className="form-input"
              value={b.bess_om_cr_year}
              onChange={(e) => handleChange('bess_om_cr_year', e.target.value)}
              min={0}
              step={0.01}
            />
            <p className="form-hint">Operations & Maintenance cost for BESS in Year 1.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="rte_percent">
              Round-Trip Efficiency (RTE)
              <span className="form-unit">%</span>
            </label>
            <input
              id="rte_percent"
              type="number"
              className="form-input"
              value={b.rte_percent}
              onChange={(e) => handleChange('rte_percent', e.target.value)}
              min={50}
              max={100}
              step={0.1}
            />
            <p className="form-hint">AC-to-AC round-trip efficiency of the BESS.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="battery_degradation_percent">
              Annual Battery Degradation
              <span className="form-unit">%</span>
            </label>
            <input
              id="battery_degradation_percent"
              type="number"
              className="form-input"
              value={b.battery_degradation_percent}
              onChange={(e) => handleChange('battery_degradation_percent', e.target.value)}
              min={0}
              max={10}
              step={0.1}
            />
            <p className="form-hint">Annual capacity fade of the batteries.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cycles_per_day">
              Battery Cycles per Day
              <span className="form-unit">cycles</span>
            </label>
            <input
              id="cycles_per_day"
              type="number"
              className="form-input"
              value={b.cycles_per_day}
              onChange={(e) => handleChange('cycles_per_day', e.target.value)}
              min={0.1}
              max={3}
              step={0.1}
            />
            <p className="form-hint">Average charge/discharge cycles daily.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="replacement_year">
              Battery Replacement Year
              <span className="form-unit">Year (Optional)</span>
            </label>
            <input
              id="replacement_year"
              type="number"
              className="form-input"
              value={b.replacement_year ?? ''}
              onChange={(e) => handleChange('replacement_year', e.target.value)}
              min={1}
              max={39}
              placeholder="e.g. 10 (Leave empty if none)"
            />
            <p className="form-hint">Year in which batteries are replaced.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="replacement_cost_cr">
              Battery Replacement Cost
              <span className="form-unit">₹ Cr (Optional)</span>
            </label>
            <input
              id="replacement_cost_cr"
              type="number"
              className="form-input"
              value={b.replacement_cost_cr ?? ''}
              onChange={(e) => handleChange('replacement_cost_cr', e.target.value)}
              min={0}
              step={1}
              placeholder="e.g. 50 (Leave empty if none)"
            />
            <p className="form-hint">Estimated cost of replacement batteries.</p>
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={() => setInputStep(0)}>
            ⏮ Back: Solar Params
          </button>
          <button className="btn btn-primary" onClick={() => setInputStep(2)}>
            Next: Revenue Stack ➔
          </button>
        </div>
      </div>
    </div>
  );
}
