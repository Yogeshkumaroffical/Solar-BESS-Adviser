import React from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import { runAnalysis } from '../../api/client';

export default function RevenueInputs() {
  const { inputs, setRevenueInput, setInputStep, setResult, setLoading, setError, loading } = useAnalysisStore();
  const r = inputs.revenue;

  const handleChange = (key: keyof typeof r, value: string) => {
    const num = parseFloat(value);
    setRevenueInput(key as any, isNaN(num) ? 0 : num);
  };

  const handleToggle = (key: 'ancillary_enabled', checked: boolean) => {
    setRevenueInput(key, checked);
  };

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const resultData = await runAnalysis(inputs);
      setResult(resultData);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } }; message?: string })
        ?.response?.data?.detail ?? (e as { message?: string })?.message ?? 'Analysis failed';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">💰 Revenue Stack & Escalation Assumptions</h2>
      </div>
      <div className="card-body">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="off_peak_buy_tariff_inr">
              Off-Peak Buy Tariff
              <span className="form-unit">₹/kWh</span>
            </label>
            <input
              id="off_peak_buy_tariff_inr"
              type="number"
              className="form-input"
              value={r.off_peak_buy_tariff_inr}
              onChange={(e) => handleChange('off_peak_buy_tariff_inr', e.target.value)}
              min={0}
              step={0.01}
            />
            <p className="form-hint">Tariff for charging battery from grid. Use 0 for charging purely from own solar.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="peak_sell_tariff_inr">
              Peak Sell Tariff / Arbitrage Sell
              <span className="form-unit">₹/kWh</span>
            </label>
            <input
              id="peak_sell_tariff_inr"
              type="number"
              className="form-input"
              value={r.peak_sell_tariff_inr}
              onChange={(e) => handleChange('peak_sell_tariff_inr', e.target.value)}
              min={0.5}
              step={0.01}
            />
            <p className="form-hint">Selling rate for battery discharge during peak-hours.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="clipping_sell_tariff_inr">
              Clipped Energy Sell Tariff
              <span className="form-unit">₹/kWh</span>
            </label>
            <input
              id="clipping_sell_tariff_inr"
              type="number"
              className="form-input"
              value={r.clipping_sell_tariff_inr}
              onChange={(e) => handleChange('clipping_sell_tariff_inr', e.target.value)}
              min={0.5}
              step={0.01}
            />
            <p className="form-hint">Tariff at which recovered clipping energy is sold.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="clipping_recovery_factor">
              Clipping Recovery Factor
              <span className="form-unit">0 - 1.0</span>
            </label>
            <input
              id="clipping_recovery_factor"
              type="number"
              className="form-input"
              value={r.clipping_recovery_factor}
              onChange={(e) => handleChange('clipping_recovery_factor', e.target.value)}
              min={0}
              max={1}
              step={0.01}
            />
            <p className="form-hint">Fraction of clipped solar energy that the BESS captures.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="curtailment_sell_tariff_inr">
              Curtailed Energy Sell Tariff
              <span className="form-unit">₹/kWh</span>
            </label>
            <input
              id="curtailment_sell_tariff_inr"
              type="number"
              className="form-input"
              value={r.curtailment_sell_tariff_inr}
              onChange={(e) => handleChange('curtailment_sell_tariff_inr', e.target.value)}
              min={0.5}
              step={0.01}
            />
            <p className="form-hint">Tariff for energy saved from grid curtailment.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="curtailment_recovery_factor">
              Curtailment Recovery Factor
              <span className="form-unit">0 - 1.0</span>
            </label>
            <input
              id="curtailment_recovery_factor"
              type="number"
              className="form-input"
              value={r.curtailment_recovery_factor}
              onChange={(e) => handleChange('curtailment_recovery_factor', e.target.value)}
              min={0}
              max={1}
              step={0.01}
            />
            <p className="form-hint">Fraction of grid-curtailed energy successfully stored and sold later.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="om_escalation_percent">
              Annual O&M Escalation
              <span className="form-unit">%</span>
            </label>
            <input
              id="om_escalation_percent"
              type="number"
              className="form-input"
              value={r.om_escalation_percent}
              onChange={(e) => handleChange('om_escalation_percent', e.target.value)}
              min={0}
              max={10}
              step={0.1}
            />
            <p className="form-hint">Annual escalation rate applied to O&M costs.</p>
          </div>

          <div className="form-group" style={{ justifyContent: 'center' }}>
            <label className="form-label">
              Ancillary Services Revenue
            </label>
            <div className="toggle-group" style={{ marginTop: 8 }}>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={r.ancillary_enabled}
                  onChange={(e) => handleToggle('ancillary_enabled', e.target.checked)}
                />
                <span className="toggle-track" />
              </label>
              <span style={{ fontSize: 13, color: r.ancillary_enabled ? 'var(--clr-text)' : 'var(--clr-text-muted)' }}>
                {r.ancillary_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <p className="form-hint" style={{ marginTop: 4 }}>Enable secondary grid services capacity charges.</p>
          </div>

          {r.ancillary_enabled && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="ancillary_rate_cr_mw_year">
                  Ancillary Capacity Rate
                  <span className="form-unit">₹ Cr/MW/yr</span>
                </label>
                <input
                  id="ancillary_rate_cr_mw_year"
                  type="number"
                  className="form-input"
                  value={r.ancillary_rate_cr_mw_year}
                  onChange={(e) => handleChange('ancillary_rate_cr_mw_year', e.target.value)}
                  min={0}
                  step={0.01}
                />
                <p className="form-hint">Annual capacity rate paid for grid services reservation.</p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ancillary_capacity_mw">
                  Ancillary Allocated Power
                  <span className="form-unit">MW</span>
                </label>
                <input
                  id="ancillary_capacity_mw"
                  type="number"
                  className="form-input"
                  value={r.ancillary_capacity_mw}
                  onChange={(e) => handleChange('ancillary_capacity_mw', e.target.value)}
                  min={0}
                />
                <p className="form-hint">Battery capacity reserved for ancillary services.</p>
              </div>
            </>
          )}
        </div>

        <div className="divider" />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={() => setInputStep(1)}>
            ⏮ Back: BESS Params
          </button>
          <button 
            id="run-analysis-btn-revenue"
            className="btn btn-primary" 
            onClick={handleRun}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Running…</> : '▶ Run Analysis'}
          </button>
        </div>
      </div>
    </div>
  );
}
