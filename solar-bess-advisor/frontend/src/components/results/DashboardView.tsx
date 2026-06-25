import React from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import RecommendationBanner from './RecommendationBanner';
import KPICards from './KPICards';
import WarningsPanel from './WarningsPanel';
import ComparisonTable from './ComparisonTable';
import AdvisoryNote from './AdvisoryNote';
import ExportPanel from './ExportPanel';
import { 
  NPVComparisonChart, 
  RevenueStackChart, 
  CashFlowChart, 
  SensitivityChart 
} from '../charts/AnalysisCharts';
import { formatCrores } from '../../utils/formatters';

interface DashboardViewProps {
  section: 'dashboard' | 'cashflows' | 'sensitivity' | 'advisory';
}

export default function DashboardView({ section }: DashboardViewProps) {
  const { result } = useAnalysisStore();
  if (!result) return null;

  const renderSection = () => {
    switch (section) {
      case 'dashboard':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <RecommendationBanner />
            <KPICards />
            <WarningsPanel />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
              <NPVComparisonChart />
              <RevenueStackChart />
            </div>

            <ComparisonTable />
          </div>
        );
      case 'cashflows':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <CashFlowChart />
            
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">📈 Year-by-Year Cash Flow Projection</h2>
              </div>
              <div className="card-body">
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th className="num">Solar Gen (MWh)</th>
                        <th className="num">Solar Rev (₹ Cr)</th>
                        <th className="num">Solar Profit (₹ Cr)</th>
                        <th className="num">Solar Cumul. (₹ Cr)</th>
                        <th className="num">Hybrid Rev (₹ Cr)</th>
                        <th className="num">Hybrid Profit (₹ Cr)</th>
                        <th className="num">Hybrid Cumul. (₹ Cr)</th>
                        <th className="num">BESS Capacity (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.annual_cash_flows.map((row) => (
                        <tr key={row.year}>
                          <td>Yr {row.year}</td>
                          <td className="num">{row.generation_mwh.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          <td className="num">{formatCrores(row.solar_only_revenue_cr)}</td>
                          <td className="num">{formatCrores(row.solar_only_profit_cr)}</td>
                          <td className="num" style={{ color: row.solar_only_cumulative_cf_cr >= 0 ? 'var(--clr-bess-lt)' : '#fca5a5' }}>
                            {formatCrores(row.solar_only_cumulative_cf_cr)}
                          </td>
                          <td className="num">{formatCrores(row.hybrid_revenue_cr)}</td>
                          <td className="num">{formatCrores(row.hybrid_profit_cr)}</td>
                          <td className="num" style={{ color: row.hybrid_cumulative_cf_cr >= 0 ? 'var(--clr-bess-lt)' : '#fca5a5' }}>
                            {formatCrores(row.hybrid_cumulative_cf_cr)}
                          </td>
                          <td className="num">{(row.bess_degradation_factor * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 'sensitivity':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SensitivityChart />
          </div>
        );
      case 'advisory':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ExportPanel />
            <AdvisoryNote />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {renderSection()}
    </div>
  );
}
