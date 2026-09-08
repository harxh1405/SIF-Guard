import { apiClient } from './client';
import type {
  FacilityRiskSummary,
  FacilityZone,
  DemoScenario,
  DemoSimulationRequest,
  DemoSimulationResponse,
} from '../types/facility';

export async function getFacilityOverview(): Promise<FacilityRiskSummary> {
  const res = await apiClient.get<FacilityRiskSummary>('/facility/overview');
  return res.data;
}

export async function getZoneDetails(zoneId: string): Promise<FacilityZone> {
  const res = await apiClient.get<FacilityZone>(`/facility/zones/${zoneId}`);
  return res.data;
}

export async function getDemoScenarios(): Promise<DemoScenario[]> {
  const res = await apiClient.get<DemoScenario[]>('/facility/demo/scenarios');
  return res.data;
}

export async function simulateDemoIncident(
  request: DemoSimulationRequest
): Promise<DemoSimulationResponse> {
  const res = await apiClient.post<DemoSimulationResponse>(
    '/facility/demo/simulate',
    request
  );
  return res.data;
}

export async function resetDemoData(): Promise<FacilityRiskSummary> {
  const res = await apiClient.post<FacilityRiskSummary>('/facility/demo/reset');
  return res.data;
}
