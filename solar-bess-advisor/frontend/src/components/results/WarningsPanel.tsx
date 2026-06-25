import React from 'react';
import { useAnalysisStore } from '../../store/analysisStore';

export default function WarningsPanel() {
  const { result } = useAnalysisStore();
  if (!result || !result.warnings || result.warnings.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header">
        <h2 className="card-title">⚠️ Design Warnings & Alerts</h2>
      </div>
      <div className="card-body">
        <div className="warning-list">
          {result.warnings.map((w, idx) => {
            let itemClass = 'warning-item ';
            let icon = 'ℹ️';
            if (w.severity === 'error') {
              itemClass += 'error';
              icon = '🚨';
            } else if (w.severity === 'warning') {
              itemClass += 'warning';
              icon = '⚠️';
            } else {
              itemClass += 'info';
              icon = 'ℹ️';
            }

            return (
              <div key={idx} className={itemClass}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div>
                  <strong>{w.field.replace('_', ' ').toUpperCase()}:</strong> {w.message}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
