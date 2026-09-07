import { apiClient } from './client';
import type { SafetyReportRead, ReviewCreate, ReviewRead, HealthResponse } from '../types/api';

export async function getReviewQueue(limit: number = 20): Promise<SafetyReportRead[]> {
  const res = await apiClient.get<SafetyReportRead[]>('/review/queue', { params: { limit } });
  return res.data;
}

export async function submitReview(
  reportId: string,
  review: ReviewCreate
): Promise<ReviewRead> {
  const res = await apiClient.post<ReviewRead>(`/review/${reportId}`, review);
  return res.data;
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await apiClient.get<HealthResponse>('/health');
  return res.data;
}
