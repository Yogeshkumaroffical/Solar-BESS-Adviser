import React from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import { runAnalysis } from '../../api/client';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { inputs, result, loading, setResult, setLoading, setError, setActiveTab } = useAnalysisStore();

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await runAnalysis(inputs);
      setResult(r);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } }; message?: string })
        ?.response?.data?.detail ?? (e as { message?: string })?.message ?? 'Analysis failed';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="page-header">
      <div>
        <div className="page-header-title">
          <span>⚡</span>
          <span>{title}</span>
        </div>
        {subtitle && <div className="page-header-sub">{subtitle}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {result && (
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('results')}>
            📊 View Results
          </button>
        )}
        <button
          id="run-analysis-btn"
          className="btn btn-primary"
          onClick={handleRunAnalysis}
          disabled={loading}
        >
          {loading ? <><span className="spinner" /> Running…</> : '▶ Run Analysis'}
        </button>

        <div className="header-status">
          <div className="status-dot" />
          <span>API</span>
        </div>
      </div>
    </header>
  );
}
