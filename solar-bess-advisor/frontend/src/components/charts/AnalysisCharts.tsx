import React from 'react';
import Plot from 'react-plotly.js';
import { useAnalysisStore } from '../../store/analysisStore';

const THEME_LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: {
    color: '#e2e8f0',
    family: 'Inter, system-ui, sans-serif',
  },
  margin: { t: 40, r: 20, b: 40, l: 140 },
  autosize: true,
  legend: {
    orientation: 'h' as const,
    yanchor: 'bottom' as const,
    y: -0.2,
    xanchor: 'center' as const,
    x: 0.5,
  },
  xaxis: {
    gridcolor: '#1e3a5f',
    zerolinecolor: '#2a4d72',
    tickfont: { color: '#94a3b8' },
  },
  yaxis: {
    gridcolor: '#1e3a5f',
    zerolinecolor: '#2a4d72',
    tickfont: { color: '#94a3b8' },
  },
};

export function NPVComparisonChart() {
  const { result } = useAnalysisStore();
  if (!result) return null;

  const s = result.solar_only_financials;
  const h = result.hybrid_financials;

  const data = [
    {
      x: ['Solar-Only', 'Solar + BESS (Hybrid)'],
      y: [s.total_capex_cr, h.total_capex_cr],
      name: 'Initial CAPEX',
      type: 'bar' as const,
      marker: { color: '#ef4444' },
    },
    {
      x: ['Solar-Only', 'Solar + BESS (Hybrid)'],
      y: [s.npv_cr, h.npv_cr],
      name: 'Project NPV',
      type: 'bar' as const,
      marker: { color: '#10b981' },
    },
  ];

  return (
    <div className="chart-container">
      <div className="chart-title">📊 Initial CAPEX vs. Lifecycle NPV</div>
      <Plot
        data={data}
        layout={{
          ...THEME_LAYOUT,
          barmode: 'group' as const,
          margin: { t: 20, r: 20, b: 40, l: 40 },
          height: 320,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  );
}

export function RevenueStackChart() {
  const { result } = useAnalysisStore();
  if (!result) return null;

  const h = result.hybrid_year1;

  const data = [
    {
      x: ['Hybrid Year-1'],
      y: [h.base_ppa_revenue_cr],
      name: 'Base PPA',
      type: 'bar' as const,
      marker: { color: '#f59e0b' },
    },
    {
      x: ['Hybrid Year-1'],
      y: [h.dsm_savings_cr],
      name: 'DSM Savings',
      type: 'bar' as const,
      marker: { color: '#3b82f6' },
    },
    {
      x: ['Hybrid Year-1'],
      y: [h.clipping_recovery_cr],
      name: 'Clipping Recovery',
      type: 'bar' as const,
      marker: { color: '#10b981' },
    },
    {
      x: ['Hybrid Year-1'],
      y: [h.curtailment_recovery_cr],
      name: 'Curtailment Recovery',
      type: 'bar' as const,
      marker: { color: '#8b5cf6' },
    },
    {
      x: ['Hybrid Year-1'],
      y: [h.arbitrage_cr],
      name: 'Arbitrage',
      type: 'bar' as const,
      marker: { color: '#ec4899' },
    },
    {
      x: ['Hybrid Year-1'],
      y: [h.ancillary_cr],
      name: 'Ancillary Services',
      type: 'bar' as const,
      marker: { color: '#14b8a6' },
    },
  ];

  return (
    <div className="chart-container">
      <div className="chart-title">🍰 Year-1 Revenue Stack Breakdown (Hybrid)</div>
      <Plot
        data={data}
        layout={{
          ...THEME_LAYOUT,
          barmode: 'stack' as const,
          margin: { t: 20, r: 20, b: 40, l: 40 },
          height: 320,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  );
}

export function CashFlowChart() {
  const { result } = useAnalysisStore();
  if (!result) return null;

  const years = result.annual_cash_flows.map((row) => `Yr ${row.year}`);
  const solarCumulative = result.annual_cash_flows.map((row) => row.solar_only_cumulative_cf_cr);
  const hybridCumulative = result.annual_cash_flows.map((row) => row.hybrid_cumulative_cf_cr);

  // Year 0 details
  const yearsWithYr0 = ['Yr 0', ...years];
  const solarCumWithYr0 = [-result.inputs_summary.solar.solar_capex_cr, ...solarCumulative];
  const hybridCumWithYr0 = [
    -(result.inputs_summary.solar.solar_capex_cr + result.inputs_summary.bess.bess_capex_cr),
    ...hybridCumulative,
  ];

  const data = [
    {
      x: yearsWithYr0,
      y: solarCumWithYr0,
      name: 'Solar-Only Cumulative CF',
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      line: { color: '#f59e0b', width: 3 },
      marker: { size: 6 },
    },
    {
      x: yearsWithYr0,
      y: hybridCumWithYr0,
      name: 'Hybrid Cumulative CF',
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      line: { color: '#10b981', width: 3 },
      marker: { size: 6 },
    },
  ];

  return (
    <div className="chart-container">
      <div className="chart-title">📈 Lifecycle Cumulative Net Cash Flows</div>
      <Plot
        data={data}
        layout={{
          ...THEME_LAYOUT,
          margin: { t: 20, r: 20, b: 40, l: 60 },
          height: 360,
          xaxis: {
            ...THEME_LAYOUT.xaxis,
            title: 'Project Years',
          },
          yaxis: {
            ...THEME_LAYOUT.yaxis,
            title: 'INR Crores',
          },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />
    </div>
  );
}

export function SensitivityChart() {
  const { result } = useAnalysisStore();
  if (!result || !result.sensitivity) return null;

  const baseGain = result.incremental_npv_cr;

  // Group sensitivity by variable
  const variables = Array.from(new Set(result.sensitivity.map((p) => p.variable)));

  // For horizontal tornado, we find the delta values at -20% and +20% for each variable
  const yAxisLabels: string[] = [];
  const minus20Vals: number[] = [];
  const plus20Vals: number[] = [];
  const minus20Bases: number[] = [];
  const plus20Bases: number[] = [];

  variables.forEach((variable) => {
    const m20 = result.sensitivity.find((p) => p.variable === variable && p.change_percent === -20);
    const p20 = result.sensitivity.find((p) => p.variable === variable && p.change_percent === 20);

    if (m20 && p20) {
      yAxisLabels.push(variable);

      // Plotly Horizontal Bar with Base
      // We want the bar to start at baseGain and extend to the new NPV Gain
      // Therefore, the width of the bar is (new_value - baseGain)
      minus20Vals.push(m20.npv_gain_cr - baseGain);
      minus20Bases.push(baseGain);

      plus20Vals.push(p20.npv_gain_cr - baseGain);
      plus20Bases.push(baseGain);
    }
  });

  const data = [
    {
      y: yAxisLabels,
      x: minus20Vals,
      base: minus20Bases,
      name: '-20% Shift',
      type: 'bar' as const,
      orientation: 'h' as const,
      marker: { color: '#ef4444' },
      hoverinfo: 'all' as const,
    },
    {
      y: yAxisLabels,
      x: plus20Vals,
      base: plus20Bases,
      name: '+20% Shift',
      type: 'bar' as const,
      orientation: 'h' as const,
      marker: { color: '#10b981' },
      hoverinfo: 'all' as const,
    },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">🌪️ BESS Incremental NPV Gain Sensitivity (Tornado)</h2>
      </div>
      <div className="card-body">
        <div style={{ fontSize: 13, color: 'var(--clr-text-muted)', marginBottom: 12 }}>
          Shows the lifecycle NPV gain/loss (in ₹ Cr) added by BESS as key parameters are varied by ±20%. The vertical dashed line marks the base-case gain of <strong>₹{baseGain.toFixed(2)} Cr</strong>.
        </div>
        <Plot
          data={data}
          layout={{
            ...THEME_LAYOUT,
            barmode: 'overlay' as const,
            height: 380,
            xaxis: {
              ...THEME_LAYOUT.xaxis,
              title: 'NPV Gain (INR Crores)',
            },
            yaxis: {
              ...THEME_LAYOUT.yaxis,
              autorange: 'reversed' as const, // displays top variables first
            },
            shapes: [
              {
                type: 'line' as const,
                x0: baseGain,
                x1: baseGain,
                y0: -0.5,
                y1: yAxisLabels.length - 0.5,
                line: {
                  color: '#f59e0b',
                  width: 2,
                  dash: 'dash',
                },
              },
            ],
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
