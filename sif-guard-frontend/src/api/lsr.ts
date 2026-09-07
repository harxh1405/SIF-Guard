import { apiClient } from './client';
import type { LSRRead, LSRMatchSchema } from '../types/api';

export async function getLSRRules(): Promise<LSRRead[]> {
  const res = await apiClient.get<LSRRead[]>('/lsr/rules');
  return res.data;
}

export async function mapTextToLSR(text: string): Promise<LSRMatchSchema[]> {
  const res = await apiClient.post<LSRMatchSchema[]>('/lsr/map', { text });
  return res.data;
}
