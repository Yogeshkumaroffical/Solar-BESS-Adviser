import React from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import { formatCrores, formatPercent } from '../../utils/formatters';

export default function KPICards() {
  const { result, inputs } = useAnalysisStore();
  if (!result) return null;

  const s = result.solar_only_financials;
  const h = result.hybrid_financials;
  const gain = result.incremental_npv_cr;

  return (
    <div className="kpi-grid">
      <div className="kpi-card kpi-solar">
        <div className="kpi-label">Solar Only NPV</div>
        <div className="kpi-value">{formatCrores(s.npv_cr)}</div>
        <div className="kpi-sub">WACC @ {inputs.solar.wacc_percent}%</div>
      </div>

      <div className="kpi-card kpi-bess">
        <div className="kpi-label">Solar + BESS NPV</div>
        <div className="kpi-value">{formatCrores(h.npv_cr)}</div>
        <div className="kpi-sub">
          {gain >= 0 ? (
            <span className="kpi-delta pos">▲ {formatCrores(gain)} gain</span>
          ) : (
            <span className="kpi-delta neg">▼ {formatCrores(Math.abs(gain))} loss</span>
          )}
        </div>
      </div>

      <div className="kpi-card kpi-accent">
        <div className="kpi-label">Solar Only IRR</div>
        <div className="kpi-value">{formatPercent(s.irr_percent)}</div>
        <div className="kpi-sub">Project life: {inputs.solar.project_life_years} yrs</div>
      </div>

      <div className="kpi-card kpi-accent">
        <div className="kpi-label">Solar + BESS IRR</div>
        <div className="kpi-value">{formatPercent(h.irr_percent)}</div>
        <div className="kpi-sub">
          {h.irr_percent && s.irr_percent ? (
            h.irr_percent > s.irr_percent ? (
              <span className="kpi-delta pos">▲ {(h.irr_percent - s.irr_percent).toFixed(2)}% delta</span>
            ) : (
              <span className="kpi-delta neg">▼ {(s.irr_percent - h.irr_percent).toFixed(2)}% delta</span>
            )
          ) : null}
        </div>
      </div>

      <div className="kpi-card kpi-warn">
        <div className="kpi-label">BESS Payback Period</div>
        <div className="kpi-value">
          {h.simple_payback_years !== null && h.simple_payback_years !== undefined 
            ? `${h.simple_payback_years} Years` 
            : 'N/A'}
        </div>
        <div className="kpi-sub">Incremental payback</div>
      </div>

      <div className="kpi-card kpi-warn">
        <div className="kpi-label">Total CAPEX</div>
        <div className="kpi-value">{formatCrores(h.total_capex_cr)}</div>
        <div className="kpi-sub">BESS Capex: {formatCrores(inputs.bess.bess_capex_cr)}</div>
      </div>

      <div className="kpi-card kpi-accent">
        <div className="kpi-label">Solar LCOE</div>
        <div className="kpi-value">
          {s.lcoe_inr_kwh !== null && s.lcoe_inr_kwh !== undefined 
            ? `₹${s.lcoe_inr_kwh.toFixed(2)}` 
            : 'N/A'}
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-dim)' }}> /kWh</span>
        </div>
        <div className="kpi-sub">Levelized cost</div>
      </div>

      <div className="kpi-card kpi-accent">
        <div className="kpi-label">Hybrid LCOE</div>
        <div className="kpi-value">
          {h.lcoe_inr_kwh !== null && h.lcoe_inr_kwh !== undefined 
            ? `₹${h.lcoe_inr_kwh.toFixed(2)}` 
            : 'N/A'}
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--clr-text-dim)' }}> /kWh</span>
        </div>
        <div className="kpi-sub">With battery addition</div>
      </div>
    </div>
  );
}
