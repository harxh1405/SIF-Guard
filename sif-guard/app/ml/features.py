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
    "barrier",
    "barrier_failure",
    "potential_consequence",
]

DEFAULT_MISSING_VALUE = "unknown"


def extraction_to_feature_record(extraction: ExtractionSchema) -> Dict[str, str]:
    """
    Converts ExtractionSchema into a standardized dictionary matching SIF_FEATURE_COLUMNS.
    Aligns controlled/safe states canonically to match trained distributions.
    """
    def clean_val(val: Optional[str]) -> str:
        if val is None:
            return DEFAULT_MISSING_VALUE
        s = str(val).strip().lower()
        return s if s else DEFAULT_MISSING_VALUE

    bf = extraction.barrier_failure
    if bf is None or str(bf).strip().lower() in ("none", "unknown", "no failure", "null", ""):
        bf_clean = "none"
    else:
        bf_clean = str(bf).strip().lower()

    pc = extraction.potential_consequence
    if pc is None or str(pc).strip().lower() in ("none", "unknown", "controlled / none", "no consequence / controlled operation", "none / minor", "controlled", "unspecified", "null", ""):
        pc_clean = "no consequence / controlled operation" if bf_clean == "none" else "unknown"
    else:
        pc_clean = str(pc).strip().lower()

    exp = extraction.exposure
    if exp is None or str(exp).strip().lower() in ("controlled", "safe", "none", "unknown", "exposure unspecified", "null", ""):
        if bf_clean == "none":
            act = str(extraction.activity or "").lower()
            if "confined" in act:
                exp_clean = "safe atmospheric conditions verified prior to entry"
            elif "lift" in act:
                exp_clean = "workers stationed outside drop radius using tag lines"
            elif "height" in act:
                exp_clean = "worker fully secured with dual-leg shock-absorbing lanyards"
            else:
                exp_clean = "minimal hazard exposure"
        else:
            exp_clean = "unknown"
    else:
        exp_clean = str(exp).strip().lower()

    return {
        "activity": clean_val(extraction.activity),
        "hazard": clean_val(extraction.hazard),
        "hazardous_substance": clean_val(extraction.hazardous_substance),
        "exposure": exp_clean,
        "energy_source": clean_val(extraction.energy_source),
        "equipment": clean_val(extraction.equipment),
        "barrier": clean_val(extraction.barrier),
        "barrier_failure": bf_clean,
        "potential_consequence": pc_clean,
    }
