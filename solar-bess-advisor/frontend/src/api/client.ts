import axios from 'axios';
import type { ProjectInputs, AnalysisResult, AdvisoryNoteResponse } from '../types/api';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export async function runAnalysis(inputs: ProjectInputs): Promise<AnalysisResult> {
  const { data } = await client.post<AnalysisResult>('/analyze', inputs);
  return data;
}

export async function fetchAdvisoryNote(
  result: AnalysisResult,
  projectName: string,
  consultantName: string
): Promise<AdvisoryNoteResponse> {
  const { data } = await client.post<AdvisoryNoteResponse>('/advisory', {
    result,
    project_name: projectName,
    consultant_name: consultantName,
  });
  return data;
}

export async function downloadExcel(result: AnalysisResult, projectName: string): Promise<void> {
  const response = await client.post(
    `/export/excel?project_name=${encodeURIComponent(projectName)}`,
    result,
    { responseType: 'blob' }
  );
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, '_')}_analysis.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPDF(result: AnalysisResult, projectName: string): Promise<void> {
  const response = await client.post(
    `/export/pdf?project_name=${encodeURIComponent(projectName)}`,
    result,
    { responseType: 'blob' }
  );
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.replace(/\s+/g, '_')}_report.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
