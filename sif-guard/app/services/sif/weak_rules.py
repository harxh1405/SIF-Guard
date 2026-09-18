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

        # 0. Proactive Controls / Low Risk Detection (e.g., removed from service, office observation, minor repairs)
        if any(term in t_lower for term in [
            "removed from service", "tagged out immediately", "chair height", "desk chair",
            "office ergonomics", "pre-use inspection completed", "green tag in place",
            "desk drawer", "desk", "drawer", "loose handle", "loose armrest", "administrative office",
            "taken out of use", "repaired by facilities", "no employee was exposed", "no injury or near miss"
        ]) or extraction.hazard == "ergonomic / minor office hazard":
            if "fall" not in t_lower and "explosion" not in t_lower and "h2s" not in t_lower and "fatal" not in t_lower and "rotating" not in t_lower:
                risk_factors.append("Proactive hazard control or low consequence observation")
                return "NON_SIF", 0.05, risk_factors

        # 1. Confined Space Precursor
        if "confined space" in t_lower or "storage tank" in t_lower or "vessel entry" in t_lower or extraction.activity == "confined space entry":
            if extraction.barrier_failure or "without atmospheric testing" in t_lower or "h2s" in t_lower or "gas" in t_lower or "no gas" in t_lower:
                risk_factors.append("Confined space entry without atmospheric testing / gas verification")
                if extraction.potential_consequence:
                    risk_factors.append(f"Potential consequence: {extraction.potential_consequence}")
                return "SIF_POTENTIAL", 0.95, risk_factors

        # 2. Energy Isolation Precursor
        if any(k in t_lower for k in ["loto", "energy isolation", "lockout", "tagout"]) or extraction.barrier == "energy isolation (LOTO)":
            if extraction.barrier_failure or any(k in t_lower for k in ["bypassed", "without isolation", "energized", "not electrically isolated", "without applying"]):
                risk_factors.append("Energy isolation (LOTO) missing, bypassed, or not verified")
                return "SIF_POTENTIAL", 0.92, risk_factors

        # 3. Line of Fire & Suspended Load Precursor
        if "suspended load" in t_lower or "underneath" in t_lower or "line of fire" in t_lower or extraction.exposure == "worker in line of fire under suspended load":
            risk_factors.append("Worker positioned in line of fire / underneath suspended load")
            return "SIF_POTENTIAL", 0.94, risk_factors

        # 4. Work at Height Precursor
        if "fall" in t_lower or "height" in t_lower or "roof" in t_lower or "elevated" in t_lower or (metadata and metadata.get("fall_height") and metadata["fall_height"] > 6):
            if "without fall protection" in t_lower or extraction.barrier_failure or "unprotected edge" in t_lower or "harness" in t_lower or (metadata and metadata.get("fall_height") and metadata["fall_height"] > 10):
                height_str = f" from {metadata['fall_height']} feet" if metadata and metadata.get("fall_height") else ""
                risk_factors.append(f"Elevated work activity{height_str} without mandatory fall protection")
                return "SIF_POTENTIAL", 0.93, risk_factors

        # 5. Toxic Gas & Gas Testing Precursor
        if "h2s" in t_lower or "toxic gas" in t_lower or "gas test" in t_lower or extraction.hazard == "toxic gas / hazardous atmosphere" or extraction.barrier == "gas testing":
            if extraction.barrier_failure or any(k in t_lower for k in ["h2s", "toxic", "without gas", "no gas", "required gas test"]):
                risk_factors.append("Required gas testing missing or toxic gas hazard exposure")
                return "SIF_POTENTIAL", 0.95, risk_factors

        # 6. Pressure Isolation Precursor
        if "pressure" in t_lower or "flange" in t_lower or "depressuriz" in t_lower or extraction.barrier == "pressure isolation / depressurization":
            if extraction.barrier_failure or any(k in t_lower for k in ["not verified", "without depressuriz", "residual pressure"]):
                risk_factors.append("Pressure isolation or zero-energy verification missing")
                return "SIF_POTENTIAL", 0.93, risk_factors

        # 7. Machine Guarding Precursor
        if "guard" in t_lower or "grind" in t_lower or extraction.barrier == "machine guarding":
            if extraction.barrier_failure or any(k in t_lower for k in ["removed", "missing", "bypassed", "without the guard"]):
                risk_factors.append("Machine guard removed or bypassed")
                return "SIF_POTENTIAL", 0.91, risk_factors

        # 8. Exclusion Zone & Barricading Precursor (Vehicles / Cranes)
        if "barricad" in t_lower or "exclusion zone" in t_lower or "pedestrian" in t_lower or extraction.barrier == "exclusion zone / barricading":
            if extraction.barrier_failure or any(k in t_lower for k in ["not barricaded", "no barricade", "breached", "pedestrians", "operating zone"]):
                risk_factors.append("Exclusion zone or barricading missing in high-hazard operating area")
                return "SIF_POTENTIAL", 0.93, risk_factors

        # 9. Excavation Protection Precursor
        if "excavation" in t_lower or "trench" in t_lower or extraction.barrier == "excavation protection":
            if extraction.barrier_failure or any(k in t_lower for k in ["without shoring", "no shoring", "instability"]):
                risk_factors.append("Excavation / trench protective shoring missing")
                return "SIF_POTENTIAL", 0.94, risk_factors

        # 10. High Severity Actual Outcomes (Fatalities, Amputations, Eye Loss)
        if metadata:
            if metadata.get("amputation") == 1.0 or metadata.get("loss_of_eye") == 1.0 or str(metadata.get("actual_severity")).lower() == "fatal":
                risk_factors.append("Severe actual consequence outcome (fatality / amputation / loss of eye)")
                return "SIF_POTENTIAL", 0.98, risk_factors

        # Default fallback if no definitive rule matched
        return "UNCERTAIN", 0.50, ["Ambiguous narrative features requiring reviewer evaluation"]


weak_rules_engine = WeakSupervisionRules()
