from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ExtractionSchema(BaseModel):
    activity: Optional[str] = None
    hazard: Optional[str] = None
    hazardous_substance: Optional[str] = None
    exposure: Optional[str] = None
    energy_source: Optional[str] = None
    equipment: Optional[str] = None
    human_factor: Optional[str] = None
    environmental_factor: Optional[str] = None
    barrier: Optional[str] = None
    barrier_failure: Optional[str] = None
    potential_consequence: Optional[str] = None


class SIFResultSchema(BaseModel):
    classification: str # SIF_POTENTIAL, NON_SIF, UNCERTAIN
    score: float
    confidence: float
    risk_factors: List[str]


class LSRMatchSchema(BaseModel):
    rule_code: str
    rule_name: str
    score: float
    confidence: float


class FingerprintSchema(BaseModel):
    activity: Optional[str] = None
    hazard: Optional[str] = None
    hazardous_substance: Optional[str] = None
    exposure: Optional[str] = None
    energy_source: Optional[str] = None
    barrier: Optional[str] = None
    barrier_failure: Optional[str] = None
    human_factor: Optional[str] = None
    environmental_factor: Optional[str] = None
    potential_consequence: Optional[str] = None
    life_saving_rules: List[str] = []


class AnalysisResponse(BaseModel):
    report_id: str
    extraction: ExtractionSchema
    sif: SIFResultSchema
    life_saving_rules: List[LSRMatchSchema]
    fingerprint: FingerprintSchema
    similar_reports: List[Dict[str, Any]] = []
