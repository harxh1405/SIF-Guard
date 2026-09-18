import { apiClient } from './client';

export interface HealthStatusResponse {
  status: string;
  service: string;
  environment: string;
  embedding_model: string;
  xgboost_model_loaded?: boolean;
  ocr_available?: boolean;
  bge_available?: boolean;
  lsr_available?: boolean;
  hdbscan_available?: boolean;
}

export async function checkSystemHealth(): Promise<HealthStatusResponse> {
  const res = await apiClient.get<HealthStatusResponse>('/health');
  return res.data;
}
