import React from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import SolarInputs from './components/inputs/SolarInputs';
import BESSInputs from './components/inputs/BESSInputs';
import RevenueInputs from './components/inputs/RevenueInputs';
import DashboardView from './components/results/DashboardView';
import { useAnalysisStore } from './store/analysisStore';

export default function App() {
  const { activeTab, inputStep, resultsSection, result, error, projectName, setProjectName, setInputStep } = useAnalysisStore();

  const renderInputStep = () => {
    switch (inputStep) {
      case 0:
        return <SolarInputs />;
      case 1:
        return <BESSInputs />;
      case 2:
        return <RevenueInputs />;
      default:
        return <SolarInputs />;
    }
  };

  const renderResultsSection = () => {
    if (!result) return null;
    return <DashboardView section={resultsSection} />;
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header 
          title={activeTab === 'inputs' ? 'Project Input Configuration' : 'Project Financial Analysis'} 
          subtitle={activeTab === 'inputs' ? 'Configure parameters for Solar and BESS design' : 'Viability dashboard and reports'}
        />
        <main className="page-content">
          {error && (
            <div className="warning-item error mb-16" style={{ width: '100%' }}>
              <span>⚠️</span>
              <div>
                <strong>Error running analysis:</strong> {error}
              </div>
            </div>
          )}

          {activeTab === 'inputs' ? (
            <div>
              <div className="project-name-bar">
                <label htmlFor="projectName">Project Name</label>
                <input
                  id="projectName"
                  type="text"
                  className="project-name-input"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name..."
                />
              </div>

              {/* Wizard Steps indicator */}
              <div className="steps-bar">
                <button 
                  className={`step-tab ${inputStep === 0 ? 'active' : ''} ${inputStep > 0 ? 'done' : ''}`}
                  onClick={() => setInputStep(0)}
                >
                  <span className="step-num">1</span>Solar Params
                </button>
                <button 
                  className={`step-tab ${inputStep === 1 ? 'active' : ''} ${inputStep > 1 ? 'done' : ''}`}
                  onClick={() => setInputStep(1)}
                >
                  <span className="step-num">2</span>BESS Params
                </button>
                <button 
                  className={`step-tab ${inputStep === 2 ? 'active' : ''}`}
                  onClick={() => setInputStep(2)}
                >
                  <span className="step-num">3</span>Revenue Stack
                </button>
              </div>

              {renderInputStep()}
            </div>
          ) : (
            renderResultsSection()
          )}
        </main>
      </div>
    </div>
  );
}
