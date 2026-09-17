import type { LSRMatchSchema } from './api';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type RiskTrend = 'INCREASE' | 'DECREASE' | 'STABLE';

export interface RiskFactor {
  title: string;
  impact: string;
  description: string;
  category: 'sif_precursor' | 'barrier_breach' | 'energy_exposure' | 'velocity' | 'baseline' | string;
}

export interface ZoneIncident {
  id: string;
  source_record_id: string;
  report_text: string;
  report_summary?: string | null;
  event_date?: string | null;
  formatted_time: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | string;
  sif_potential?: 'SIF_POTENTIAL' | 'NON_SIF' | 'UNCERTAIN' | string | null;
  sif_score?: number | null;
  sif_confidence?: number | null;
  activity?: string | null;
  hazard?: string | null;
  barrier_failure?: string | null;
  life_saving_rules?: LSRMatchSchema[] | null;
  zone_id: string;
  zone_name: string;
  is_demo: boolean;
}

export interface SvgCenter {
  x: number;
  y: number;
}

export interface FacilityZone {
  id: string;
  name: string;
  code: string;
  description: string;
  risk_score: number; // 0 - 100
  risk_level: RiskLevel;
  total_incidents: number;
  active_incidents: number;
  critical_incidents: number;
  recent_incident_state: boolean;
  risk_trend: RiskTrend;
  risk_trend_delta: number;
  risk_factors: RiskFactor[];
  dominant_hazard?: string | null;
  dominant_activity?: string | null;
  dominant_barrier_failure?: string | null;
  dominant_lsr?: string | null;
  recommended_actions: string[];
  incidents: ZoneIncident[];
  svg_center: SvgCenter;
}

export interface FacilityRiskSummary {
  overall_risk_score: number; // 0 - 100
  risk_level: RiskLevel;
  total_incidents: number;
  active_incidents: number;
  critical_incidents: number;
  high_risk_zones_count: number;
  zones: FacilityZone[];
  recent_timeline: ZoneIncident[];
  last_updated: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  zone_id: string;
  zone_name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | string;
  description: string;
  simulated_text: string;
}

export interface DemoSimulationRequest {
  scenario_id?: string;
  zone_id?: string;
  custom_text?: string;
  custom_title?: string;
  severity?: string;
}

export interface DemoSimulationResponse {
  success: boolean;
  message: string;
  incident: ZoneIncident;
  affected_zone_id: string;
  affected_zone_name: string;
  updated_facility_summary: FacilityRiskSummary;
}
