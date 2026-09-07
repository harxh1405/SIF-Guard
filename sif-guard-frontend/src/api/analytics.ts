import { apiClient } from './client';
import type {
  SiteRanking,
  ActivityRanking,
  HazardRanking,
  BarrierRanking,
  LSRRanking,
  TrendData,
  DashboardSummary,
} from '../types/api';

export async function getSiteAnalytics(limit: number = 10): Promise<SiteRanking[]> {
  const res = await apiClient.get<SiteRanking[]>('/analytics/sites', { params: { limit } });
  return res.data;
}

export async function getActivityAnalytics(limit: number = 10): Promise<ActivityRanking[]> {
  const res = await apiClient.get<ActivityRanking[]>('/analytics/activities', { params: { limit } });
  return res.data;
}

export async function getHazardAnalytics(limit: number = 10): Promise<HazardRanking[]> {
  const res = await apiClient.get<HazardRanking[]>('/analytics/hazards', { params: { limit } });
  return res.data;
}

export async function getBarrierAnalytics(limit: number = 10): Promise<BarrierRanking[]> {
  const res = await apiClient.get<BarrierRanking[]>('/analytics/barriers', { params: { limit } });
  return res.data;
}

export async function getLSRAnalytics(limit: number = 10): Promise<LSRRanking[]> {
  const res = await apiClient.get<LSRRanking[]>('/analytics/lsr', { params: { limit } });
  return res.data;
}

export async function getTrendAnalytics(grouping: 'month' | 'quarter' = 'month'): Promise<TrendData[]> {
  const res = await apiClient.get<TrendData[]>('/analytics/trends', { params: { grouping } });
  return res.data;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return res.data;
}
