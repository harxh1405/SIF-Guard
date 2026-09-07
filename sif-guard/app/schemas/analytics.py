from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class SiteRanking(BaseModel):
    site: str
    total_reports: int
    sif_count: int
    sif_density: float


class ActivityRanking(BaseModel):
    activity: str
    total_reports: int
    sif_count: int
    sif_density: float


class HazardRanking(BaseModel):
    hazard: str
    total_reports: int
    sif_count: int
    sif_density: float


class BarrierRanking(BaseModel):
    barrier_failure: str
    total_reports: int
    sif_count: int
    sif_density: float


class LSRRanking(BaseModel):
    rule_name: str
    count: int
    percentage: float


class TrendData(BaseModel):
    period: str
    total_reports: int
    sif_precursors: int
    sif_density: float
    percentage_change: float
    trend: str # INCREASE, DECREASE, STABLE


class DashboardSummary(BaseModel):
    total_reports: int
    sif_precursor_count: int
    sif_precursor_density: float
    sites: int
    activities: int
    top_lsr: List[LSRRanking]
    top_hazards: List[HazardRanking]
    top_barrier_failures: List[BarrierRanking]
    emerging_patterns: List[Dict[str, Any]]
