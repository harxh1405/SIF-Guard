from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class RiskFactor(BaseModel):
    title: str
    impact: str  # e.g., "+28 pts", "+15 pts"
    description: str
    category: str  # e.g., "sif_precursor", "barrier_breach", "frequency", "lsr_violation"


class ZoneIncident(BaseModel):
    id: str
    source_record_id: str
    report_text: str
    report_summary: Optional[str] = None
    event_date: Optional[str] = None
    formatted_time: str
    severity: str  # "CRITICAL", "HIGH", "MODERATE", "LOW"
    sif_potential: Optional[str] = None
    sif_score: Optional[float] = None
    sif_confidence: Optional[float] = None
    activity: Optional[str] = None
    hazard: Optional[str] = None
    barrier_failure: Optional[str] = None
    life_saving_rules: Optional[List[Dict[str, Any]]] = None
    zone_id: str
    zone_name: str
    is_demo: bool = False


class FacilityZone(BaseModel):
    id: str
    name: str
    code: str
    description: str
    risk_score: int  # 0 - 100
    risk_level: str  # "LOW", "MODERATE", "HIGH", "CRITICAL"
    total_incidents: int
    active_incidents: int
    critical_incidents: int
    recent_incident_state: bool
    risk_trend: str  # "INCREASE", "DECREASE", "STABLE"
    risk_trend_delta: int  # e.g. +14, -5, 0
    risk_factors: List[RiskFactor]
    dominant_hazard: Optional[str] = None
    dominant_activity: Optional[str] = None
    dominant_barrier_failure: Optional[str] = None
    dominant_lsr: Optional[str] = None
    recommended_actions: List[str]
    incidents: List[ZoneIncident]
    svg_center: Dict[str, float] = Field(default_factory=dict)


class FacilityRiskSummary(BaseModel):
    overall_risk_score: int  # 0 - 100
    risk_level: str  # "LOW", "MODERATE", "HIGH", "CRITICAL"
    total_incidents: int
    active_incidents: int
    critical_incidents: int
    high_risk_zones_count: int
    zones: List[FacilityZone]
    recent_timeline: List[ZoneIncident]
    last_updated: str


class DemoScenario(BaseModel):
    id: str
    title: str
    zone_id: str
    zone_name: str
    severity: str  # "CRITICAL", "HIGH", "MODERATE"
    description: str
    simulated_text: str


class DemoSimulationRequest(BaseModel):
    scenario_id: Optional[str] = None
    zone_id: Optional[str] = None
    custom_text: Optional[str] = None
    custom_title: Optional[str] = None
    severity: Optional[str] = "CRITICAL"


class DemoSimulationResponse(BaseModel):
    success: bool
    message: str
    incident: ZoneIncident
    affected_zone_id: str
    affected_zone_name: str
    updated_facility_summary: FacilityRiskSummary
