import { apiClient } from './client';
import type {
  SafetyReportRead,
  ImportSummary,
  AnalysisResponse,
  JobStatus,
} from '../types/api';

export async function importReports(
  file: File,
  source: string = 'osha_severe'
): Promise<ImportSummary> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('source', source);

  const res = await apiClient.post<ImportSummary>('/reports/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function listReports(
  skip: number = 0,
  limit: number = 50,
  source?: string,
  sifPotential?: string
): Promise<SafetyReportRead[]> {
  const params: Record<string, any> = { skip, limit };
  if (source) params.source = source;
  if (sifPotential) params.sif_potential = sifPotential;

  const res = await apiClient.get<SafetyReportRead[]>('/reports', { params });
  return res.data;
}

export async function getReport(reportId: string): Promise<SafetyReportRead> {
  const res = await apiClient.get<SafetyReportRead>(`/reports/${reportId}`);
  return res.data;
}

export async function analyzeReport(reportId: string): Promise<AnalysisResponse> {
  const res = await apiClient.post<AnalysisResponse>(`/reports/${reportId}/analyze`);
  return res.data;
}

export async function analyzeBatch(force: boolean = true): Promise<{
  job_id: string;
  status: string;
  total_reports_queued: number;
}> {
  const res = await apiClient.post('/reports/analyze-batch', null, {
    params: { force }
  });
  return res.data;
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await apiClient.get<JobStatus>(`/reports/jobs/${jobId}`);
  return res.data;
}
