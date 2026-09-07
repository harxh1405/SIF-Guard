export interface ExtractionSchema {
  activity?: string | null;
  hazard?: string | null;
  hazardous_substance?: string | null;
  exposure?: string | null;
  energy_source?: string | null;
  equipment?: string | null;
  human_factor?: string | null;
  environmental_factor?: string | null;
  barrier?: string | null;
  barrier_failure?: string | null;
  potential_consequence?: string | null;
}

export interface SIFResultSchema {
  classification: 'SIF_POTENTIAL' | 'NON_SIF' | 'UNCERTAIN' | string;
  score: number;
  confidence: number;
  risk_factors: string[];
}

export interface LSRMatchSchema {
  rule_code: string;
  rule_name: string;
  score: number;
  confidence: number;
}

export interface FingerprintSchema {
  activity?: string | null;
  hazard?: string | null;
  hazardous_substance?: string | null;
  exposure?: string | null;
  energy_source?: string | null;
  barrier?: string | null;
  barrier_failure?: string | null;
  human_factor?: string | null;
  environmental_factor?: string | null;
  potential_consequence?: string | null;
  life_saving_rules: string[];
}

export interface SimilarReport {
  id: string;
  source_record_id: string;
  report_text: string;
  activity?: string | null;
  hazard?: string | null;
  barrier_failure?: string | null;
  sif_potential?: string | null;
  similarity: number;
}

export interface AnalysisResponse {
  report_id: string;
  extraction: ExtractionSchema;
  sif: SIFResultSchema;
  life_saving_rules: LSRMatchSchema[];
  fingerprint: FingerprintSchema;
  similar_reports: SimilarReport[];
}

export interface SafetyReportRead {
  id: string;
  source_dataset: string;
  source_record_id: string;
  report_type?: string | null;
  report_text: string;
  report_summary?: string | null;
  keywords?: string | null;
  event_date?: string | null;
  employer?: string | null;
  site?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  industry?: string | null;
  naics?: string | null;
  activity?: string | null;
  task_assigned?: string | null;
  event_type?: string | null;
  hazard?: string | null;
  hazardous_substance?: string | null;
  exposure?: string | null;
  energy_source?: string | null;
  equipment?: string | null;
  human_factor?: string | null;
  environmental_factor?: string | null;
  barrier?: string | null;
  barrier_failure?: string | null;
  actual_severity?: string | null;
  immediate_consequence?: string | null;
  potential_consequence?: string | null;
  affected_body_part?: string | null;
  fatal_cause?: string | null;
  fall_height?: number | null;
  project_type?: string | null;
  construction_end_use?: string | null;
  building_stories?: number | null;
  project_cost?: string | null;
  life_saving_rules?: LSRMatchSchema[] | null;
  sif_potential?: 'SIF_POTENTIAL' | 'NON_SIF' | 'UNCERTAIN' | string | null;
  sif_score?: number | null;
  sif_confidence?: number | null;
  raw_data?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ImportSummary {
  records_received: number;
  records_imported: number;
  duplicates: number;
  invalid: number;
  source: string;
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total: number;
  processed: number;
  failed: number;
  created_at: string;
  completed_at?: string | null;
  error_message?: string | null;
}

export interface PrecursorCluster {
  id: string;
  cluster_id: number;
  name: string;
  description?: string | null;
  report_count: number;
  sif_precursor_count: number;
  sif_density: number;
  dominant_activity?: string | null;
  dominant_hazard?: string | null;
  dominant_barrier?: string | null;
  dominant_barrier_failure?: string | null;
  dominant_lsr?: string | null;
  representative_report_ids?: string[] | null;
}

export interface SiteRanking {
  site: string;
  total_reports: number;
  sif_count: number;
  sif_density: number;
}

export interface ActivityRanking {
  activity: string;
  total_reports: number;
  sif_count: number;
  sif_density: number;
}

export interface HazardRanking {
  hazard: string;
  total_reports: number;
  sif_count: number;
  sif_density: number;
}

export interface BarrierRanking {
  barrier_failure: string;
  total_reports: number;
  sif_count: number;
  sif_density: number;
}

export interface LSRRanking {
  rule_name: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  period: string;
  total_reports: number;
  sif_precursors: number;
  sif_density: number;
  percentage_change: number;
  trend: 'INCREASE' | 'DECREASE' | 'STABLE' | string;
}

export interface DashboardSummary {
  total_reports: number;
  sif_precursor_count: number;
  sif_precursor_density: number;
  sites: number;
  activities: number;
  top_lsr: LSRRanking[];
  top_hazards: HazardRanking[];
  top_barrier_failures: BarrierRanking[];
  emerging_patterns: PrecursorCluster[];
}

export interface LSRRead {
  id: string;
  rule_code: string;
  rule_name: string;
  description: string;
  keywords: string[];
  icon?: string | null;
}

export interface KnowledgeItemSchema {
  id: string;
  source: string;
  title: string;
  content: string;
  category?: string | null;
  similarity_score?: number | null;
}

export interface KnowledgeSearchResponse {
  query: string;
  results: KnowledgeItemSchema[];
}

export interface ReviewCreate {
  label: 'SIF_POTENTIAL' | 'NON_SIF' | 'UNCERTAIN' | string;
  confidence?: number;
  reviewer?: string;
  comments?: string;
}

export interface ReviewRead {
  id: string;
  report_id: string;
  label: string;
  confidence: number;
  source: string;
  reviewer?: string | null;
  comments?: string | null;
  created_at: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  environment: string;
  embedding_model: string;
}
