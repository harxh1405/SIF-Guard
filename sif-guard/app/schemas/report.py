from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class SafetyReportBase(BaseModel):
    source_dataset: str
    source_record_id: str
    report_type: Optional[str] = "incident"
    report_text: str
    report_summary: Optional[str] = None
    keywords: Optional[str] = None

    event_date: Optional[datetime] = None

    employer: Optional[str] = None
    site: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    industry: Optional[str] = None
    naics: Optional[str] = None

    activity: Optional[str] = None
    task_assigned: Optional[str] = None
    event_type: Optional[str] = None

    hazard: Optional[str] = None
    hazardous_substance: Optional[str] = None
    exposure: Optional[str] = None
    energy_source: Optional[str] = None
    equipment: Optional[str] = None

    human_factor: Optional[str] = None
    environmental_factor: Optional[str] = None

    barrier: Optional[str] = None
    barrier_failure: Optional[str] = None

    actual_severity: Optional[str] = None
    immediate_consequence: Optional[str] = None
    potential_consequence: Optional[str] = None
    affected_body_part: Optional[str] = None

    fatal_cause: Optional[str] = None
    fall_height: Optional[float] = None

    project_type: Optional[str] = None
    construction_end_use: Optional[str] = None
    building_stories: Optional[int] = None
    project_cost: Optional[str] = None

    raw_data: Optional[Dict[str, Any]] = None


class SafetyReportCreate(SafetyReportBase):
    pass


class SafetyReportRead(SafetyReportBase):
    id: str
    life_saving_rules: Optional[List[Dict[str, Any]]] = None
    sif_potential: Optional[str] = None
    sif_score: Optional[float] = None
    sif_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ImportSummary(BaseModel):
    records_received: int
    records_imported: int
    duplicates: int
    invalid: int
    source: str
