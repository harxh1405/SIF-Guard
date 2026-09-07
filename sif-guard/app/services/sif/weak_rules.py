from typing import Dict, Any, Tuple, List, Optional
from app.schemas.analysis import ExtractionSchema


class WeakSupervisionRules:
    """
    Configurable domain rules evaluating precursor indicators.
    Returns (suggested_label, confidence, risk_factors).
    """

    def evaluate(self, text: str, extraction: ExtractionSchema, metadata: Optional[Dict[str, Any]] = None) -> Tuple[str, float, List[str]]:
        t_lower = text.lower()
        risk_factors = []

        # 1. Confined Space Precursor
        if "confined space" in t_lower or extraction.activity == "confined space entry":
            if extraction.barrier_failure or "without atmospheric testing" in t_lower or "h2s" in t_lower or "gas" in t_lower:
                risk_factors.append("Confined space entry without atmospheric testing / gas verification")
                if extraction.potential_consequence:
                    risk_factors.append(f"Potential consequence: {extraction.potential_consequence}")
                return "SIF_POTENTIAL", 0.95, risk_factors

        # 2. Energy Isolation Precursor
        if "loto" in t_lower or "energy isolation" in t_lower or extraction.barrier == "energy isolation (LOTO)":
            if extraction.barrier_failure or "bypassed" in t_lower or "without isolation" in t_lower or "energized" in t_lower:
                risk_factors.append("Energy isolation (LOTO) missing, bypassed, or not verified")
                return "SIF_POTENTIAL", 0.92, risk_factors

        # 3. Line of Fire & Suspended Load Precursor
        if "suspended load" in t_lower or "underneath" in t_lower or "line of fire" in t_lower or extraction.exposure == "worker in line of fire under suspended load":
            risk_factors.append("Worker positioned in line of fire / underneath suspended load")
            return "SIF_POTENTIAL", 0.94, risk_factors

        # 4. Work at Height Precursor
        if "fall" in t_lower or "height" in t_lower or "roof" in t_lower or (metadata and metadata.get("fall_height") and metadata["fall_height"] > 6):
            if "without fall protection" in t_lower or extraction.barrier_failure or "unprotected edge" in t_lower or (metadata and metadata.get("fall_height") and metadata["fall_height"] > 10):
                height_str = f" from {metadata['fall_height']} feet" if metadata and metadata.get("fall_height") else ""
                risk_factors.append(f"Elevated work activity{height_str} without mandatory fall protection")
                return "SIF_POTENTIAL", 0.93, risk_factors

        # 5. Toxic Gas Exposure
        if "h2s" in t_lower or "toxic gas" in t_lower or extraction.hazard == "toxic gas / hazardous atmosphere":
            risk_factors.append("Worker exposure to acute toxic gas (H2S)")
            return "SIF_POTENTIAL", 0.95, risk_factors

        # 6. High Severity Actual Outcomes (Fatalities, Amputations, Eye Loss)
        if metadata:
            if metadata.get("amputation") == 1.0 or metadata.get("loss_of_eye") == 1.0 or str(metadata.get("actual_severity")).lower() == "fatal":
                risk_factors.append("Severe actual consequence outcome (fatality / amputation / loss of eye)")
                return "SIF_POTENTIAL", 0.98, risk_factors

        # 7. Low Risk Observation Case
        if "office chair" in t_lower or "damaged chair" in t_lower or "desk" in t_lower or "office" in t_lower:
            if "fall" not in t_lower and "explosion" not in t_lower and "gas" not in t_lower:
                risk_factors.append("Administrative office environment / low consequence furniture defect")
                return "NON_SIF", 0.92, risk_factors

        # Default fallback if no definitive rule matched
        return "UNCERTAIN", 0.50, ["Ambiguous narrative features requiring reviewer evaluation"]


weak_rules_engine = WeakSupervisionRules()
