
import type { ProjectInputs, AnalysisResult, AdvisoryNoteResponse } from '../types/api';

const BASE_URL = '/api';
const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };
const TIMEOUT = 30000;

async function fetchJson<T>(path: string, body?: any, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: DEFAULT_HEADERS,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      ...(init || {}),
    });
    clearTimeout(id);
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(id);
  }
}

export async function runAnalysis(inputs: ProjectInputs): Promise<AnalysisResult> {
  return fetchJson<AnalysisResult>('/analyze', inputs);
}

export async function fetchAdvisoryNote(
  result: AnalysisResult,
  projectName: string,
  consultantName: string
): Promise<AdvisoryNoteResponse> {
  return fetchJson<AdvisoryNoteResponse>('/advisory', {
    result,
    project_name: projectName,
    consultant_name: consultantName,
  });
}

async function fetchBlob(path: string, body: any): Promise<Blob> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    return await res.blob();
  } finally {
    clearTimeout(id);
  }
}

export async function downloadExcel(result: AnalysisResult, projectName: string): Promise<void> {
  const blob = await fetchBlob(`/export/excel?project_name=${encodeURIComponent(projectName)}`, result);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, '_')}_analysis.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPDF(result: AnalysisResult, projectName: string): Promise<void> {
  const blob = await fetchBlob(`/export/pdf?project_name=${encodeURIComponent(projectName)}`, result);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, '_')}_report.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
