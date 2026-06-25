import React, { useState } from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import { downloadExcel, downloadPDF } from '../../api/client';

export default function ExportPanel() {
  const { result, projectName } = useAnalysisStore();
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  if (!result) return null;

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await downloadExcel(result, projectName);
    } catch (e) {
      console.error(e);
      alert('Failed to export Excel report');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      await downloadPDF(result, projectName);
    } catch (e) {
      console.error(e);
      alert('Failed to export PDF report');
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="export-bar">
      <div className="export-bar-label">
        📊 Export Analysis for Project: <strong>{projectName}</strong>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleExportExcel}
          disabled={exportingExcel || exportingPDF}
        >
          {exportingExcel ? <span className="spinner" /> : '📥'} Export Excel
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleExportPDF}
          disabled={exportingExcel || exportingPDF}
        >
          {exportingPDF ? <span className="spinner" /> : '📄'} Export PDF
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => window.print()}
        >
          🖨️ Print Page
        </button>
      </div>
    </div>
  );
}
