import { apiClient } from './client';
import type { PrecursorCluster, SimilarReport } from '../types/api';

export async function getClusters(): Promise<PrecursorCluster[]> {
  const res = await apiClient.get<PrecursorCluster[]>('/patterns/clusters');
  return res.data;
}

export async function triggerClustering(minClusterSize: number = 3): Promise<{
  status: string;
  clusters_discovered: number;
  clusters: PrecursorCluster[];
}> {
  const res = await apiClient.post('/patterns/cluster-now', null, {
    params: { min_cluster_size: minClusterSize },
  });
  return res.data;
}

export async function getSimilarReports(
  reportId: string,
  limit: number = 5,
  site?: string,
  activity?: string,
  hazard?: string
): Promise<{ report_id: string; similar_reports: SimilarReport[] }> {
  const params: Record<string, any> = { limit };
  if (site) params.site = site;
  if (activity) params.activity = activity;
  if (hazard) params.hazard = hazard;

  const res = await apiClient.get<{ report_id: string; similar_reports: SimilarReport[] }>(
    `/reports/${reportId}/similar`,
    { params }
  );
  return res.data;
}
