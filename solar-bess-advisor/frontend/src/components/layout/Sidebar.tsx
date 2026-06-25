import React from 'react';
import { useAnalysisStore } from '../../store/analysisStore';

const NAV_ITEMS = [
  { icon: '☀️', label: 'Solar Parameters', step: 0 as const },
  { icon: '🔋', label: 'BESS Parameters', step: 1 as const },
  { icon: '💰', label: 'Revenue Stack', step: 2 as const },
];

export default function Sidebar() {
  const { activeTab, inputStep, resultsSection, result, setActiveTab, setInputStep, setResultsSection } = useAnalysisStore();

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚡</div>
        <h1>Solar BESS<br />Advisor</h1>
        <p>India Utility-Scale Analysis</p>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section-label">Configuration</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.step}
            className={`nav-item ${activeTab === 'inputs' && inputStep === item.step ? 'active' : ''}`}
            onClick={() => { setActiveTab('inputs'); setInputStep(item.step); }}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        {result && (
          <>
            <div className="nav-section-label" style={{ marginTop: 16 }}>Analysis</div>
            {([
              { key: 'dashboard', label: 'Dashboard', icon: '📊' },
              { key: 'cashflows', label: 'Cash Flows', icon: '📈' },
              { key: 'sensitivity', label: 'Sensitivity', icon: '🌪️' },
              { key: 'advisory', label: 'Advisory', icon: '📄' },
            ] as const).map((item) => (
              <button
                key={item.key}
                className={`nav-item ${activeTab === 'results' && resultsSection === item.key ? 'active' : ''}`}
                onClick={() => { setActiveTab('results'); setResultsSection(item.key); }}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div>v1.0 · INR Crores</div>
        <div style={{ marginTop: 4, fontSize: 10 }}>Indian RE Market · 2024</div>
      </div>
    </nav>
  );
}
