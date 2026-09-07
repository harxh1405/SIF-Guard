import { apiClient } from './client';
import type { KnowledgeSearchResponse } from '../types/api';

export async function searchKnowledge(
  query: string,
  category?: string,
  limit: number = 5
): Promise<KnowledgeSearchResponse> {
  const params: Record<string, any> = { q: query, limit };
  if (category) params.category = category;

  const res = await apiClient.get<KnowledgeSearchResponse>('/knowledge/search', { params });
  return res.data;
}
