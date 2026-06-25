import React, { useState } from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import { fetchAdvisoryNote } from '../../api/client';
import { AdvisoryNoteResponse } from '../../types/api';

// Simple regex-based Markdown to HTML converter
function parseMarkdown(md: string): string {
  let html = md;
  
  // Escape html characters to prevent XSS (but allow standard markup tags we will generate)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Restore blockquote tag helper from &gt;
  html = html.replace(/^\s*&gt;\s*(.*$)/gim, '<blockquote>$1</blockquote>');

  // Headings
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');

  // Horizontal Rules
  html = html.replace(/^---$/gim, '<hr />');

  // Bold / Italics
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Tables parsing line-by-line
  const lines = html.split('\n');
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        lines[i] = '<table><thead><tr>' + line.split('|').slice(1, -1).map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead><tbody>';
      } else if (line.includes('---') || line.includes('-|-')) {
        lines[i] = ''; // skip divider row
      } else {
        lines[i] = '<tr>' + line.split('|').slice(1, -1).map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
      }
    } else {
      if (inTable) {
        inTable = false;
        lines[i] = '</tbody></table>' + lines[i];
      }
    }
  }
  html = lines.join('\n');

  // Unordered lists
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
  
  // Clean paragraphs — wrap text that isn't inside a tag block in <p>
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed === '') return '';
    if (
      trimmed.startsWith('<h') || 
      trimmed.startsWith('<table') || 
      trimmed.startsWith('</table') || 
      trimmed.startsWith('<tr') || 
      trimmed.startsWith('<td') || 
      trimmed.startsWith('<th') || 
      trimmed.startsWith('<thead') || 
      trimmed.startsWith('<tbody') || 
      trimmed.startsWith('<ul') || 
      trimmed.startsWith('<li') || 
      trimmed.startsWith('<blockquote') || 
      trimmed.startsWith('<hr')
    ) {
      return line;
    }
    return `<p>${trimmed}</p>`;
  }).join('\n');

  return html;
}

export default function AdvisoryNote() {
  const { result, projectName } = useAnalysisStore();
  const [consultantName, setConsultantName] = useState('Solar BESS Advisor');
  const [note, setNote] = useState<AdvisoryNoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!result) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdvisoryNote(result, projectName, consultantName);
      setNote(data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } }; message?: string })
        ?.response?.data?.detail ?? (e as { message?: string })?.message ?? 'Failed to generate advisory note';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!note && !loading && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">📄 Generate Financial Advisory Note</h2>
          </div>
          <div className="card-body">
            <div className="form-group mb-16" style={{ maxWidth: 400 }}>
              <label className="form-label" htmlFor="consultantName">Consultant / Firm Name</label>
              <input
                id="consultantName"
                type="text"
                className="form-input"
                value={consultantName}
                onChange={(e) => setConsultantName(e.target.value)}
                placeholder="Enter your name or firm name..."
              />
            </div>
            <button className="btn btn-primary" onClick={handleGenerate}>
              🪄 Generate Advisory Note
            </button>
            {error && (
              <div className="warning-item error mt-16">
                <span>🚨</span>
                <div>{error}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="card flex-center" style={{ padding: 48 }}>
          <div style={{ textAlign: 'center' }}>
            <span className="spinner" style={{ width: 40, height: 40 }} />
            <p className="text-muted mt-16">Drafting report and analysis narrative via Google Gemini...</p>
          </div>
        </div>
      )}

      {note && !loading && (
        <div>
          <div className="card mb-16">
            <div className="card-header">
              <h2 className="card-title">📝 Advisory Note Settings</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setNote(null)}>
                🔄 Re-Generate
              </button>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ maxWidth: 400 }}>
                <label className="form-label" htmlFor="consultantNameSettings">Consultant Name</label>
                <input
                  id="consultantNameSettings"
                  type="text"
                  className="form-input"
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="advisory-note" dangerouslySetInnerHTML={{ __html: parseMarkdown(note.markdown) }} />
        </div>
      )}
    </div>
  );
}
