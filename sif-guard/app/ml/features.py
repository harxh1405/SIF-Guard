from typing import Dict, Any, Optional
from app.schemas.analysis import ExtractionSchema

# Authoritative feature column list for SIF classification (Training & Inference)
SIF_FEATURE_COLUMNS = [
    "activity",
    "hazard",
    "hazardous_substance",
    "exposure",
    "energy_source",
    "equipment",
    "human_factor",
    "environmental_factor",
    "barrier",
    "barrier_failure",
    "potential_consequence",
]

DEFAULT_MISSING_VALUE = "unknown"


def extraction_to_feature_record(extraction: ExtractionSchema) -> Dict[str, str]:
    """
    Converts ExtractionSchema into a standardized dictionary matching SIF_FEATURE_COLUMNS.
    Handles missing values by mapping None/empty strings to canonical 'unknown'.
    """
    def clean_val(val: Optional[str]) -> str:
        if val is None:
            return DEFAULT_MISSING_VALUE
        s = str(val).strip().lower()
        return s if s else DEFAULT_MISSING_VALUE

    return {
        "activity": clean_val(extraction.activity),
        "hazard": clean_val(extraction.hazard),
        "hazardous_substance": clean_val(extraction.hazardous_substance),
        "exposure": clean_val(extraction.exposure),
        "energy_source": clean_val(extraction.energy_source),
        "equipment": clean_val(extraction.equipment),
        "human_factor": clean_val(extraction.human_factor),
        "environmental_factor": clean_val(extraction.environmental_factor),
        "barrier": clean_val(extraction.barrier),
        "barrier_failure": clean_val(extraction.barrier_failure),
        "potential_consequence": clean_val(extraction.potential_consequence),
    }
