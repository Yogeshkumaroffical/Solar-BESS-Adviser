import React from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import { formatCrores } from '../../utils/formatters';

export default function ComparisonTable() {
  const { result } = useAnalysisStore();
  if (!result) return null;

  const s = result.solar_only_year1;
  const h = result.hybrid_year1;

  const rows = [
    { label: 'Base PPA Revenue', solar: s.base_ppa_revenue_cr, hybrid: h.base_ppa_revenue_cr },
    { label: 'DSM Penalty', solar: s.dsm_penalty_cr, hybrid: h.dsm_penalty_cr },
    { label: 'DSM Savings', solar: s.dsm_savings_cr, hybrid: h.dsm_savings_cr },
    { label: 'Clipping Recovery', solar: s.clipping_recovery_cr, hybrid: h.clipping_recovery_cr },
    { label: 'Curtailment Recovery', solar: s.curtailment_recovery_cr, hybrid: h.curtailment_recovery_cr },
    { label: 'Arbitrage Revenue', solar: s.arbitrage_cr, hybrid: h.arbitrage_cr },
    { label: 'Peak Shift Uplift', solar: s.peak_shift_cr, hybrid: h.peak_shift_cr },
    { label: 'Ancillary Services', solar: s.ancillary_cr, hybrid: h.ancillary_cr },
    { label: 'Total Annual Revenue', solar: s.total_revenue_cr, hybrid: h.total_revenue_cr, isBold: true },
    { label: 'Annual O&M Cost', solar: -s.total_om_cr, hybrid: -h.total_om_cr },
    { label: 'Net Profit (Before Tax)', solar: s.net_profit_cr, hybrid: h.net_profit_cr, isBold: true },
    { label: 'Net Profit (After Tax)', solar: s.net_profit_after_tax_cr, hybrid: h.net_profit_after_tax_cr, isBold: true },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">💵 Year-1 Revenue Stack Comparison</h2>
      </div>
      <div className="card-body">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Revenue Stream</th>
                <th className="num">Solar-Only</th>
                <th className="num">Hybrid (Solar+BESS)</th>
                <th className="num">Incremental Gain</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const diff = row.hybrid - row.solar;
                const isHeading = row.isBold;

                return (
                  <tr key={idx} style={isHeading ? { fontWeight: '700', borderTop: '2px solid var(--clr-border)' } : {}}>
                    <td>{row.label}</td>
                    <td className={`num ${isHeading ? 'td-solar' : ''}`}>{formatCrores(row.solar)}</td>
                    <td className={`num ${isHeading ? 'td-hybrid' : ''}`}>{formatCrores(row.hybrid)}</td>
                    <td className={`num ${diff > 0 ? 'td-pos' : diff < 0 ? 'td-neg' : ''}`}>
                      {diff !== 0 ? (diff > 0 ? `+` : '') + formatCrores(diff) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
