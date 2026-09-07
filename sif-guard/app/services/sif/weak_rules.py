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
        if any(kw in t_lower for kw in ["confined space", "storage tank", "vessel entry", "tank cleaning", "reactor"]) or extraction.activity == "confined space entry":
            if extraction.barrier_failure or any(kw in t_lower for kw in ["without atmospheric testing", "gas test", "h2s", "toxic", "oxygen", "gas"]):
                risk_factors.append("Confined space / tank entry without mandatory atmospheric gas testing")
                if extraction.potential_consequence:
                    risk_factors.append(f"Potential consequence: {extraction.potential_consequence}")
                return "SIF_POTENTIAL", 0.95, risk_factors

        # 2. Energy Isolation (LOTO) & Electrical Precursor
        if any(kw in t_lower for kw in ["loto", "energy isolation", "lockout", "tagout", "electrical work", "energized", "breaker"]) or extraction.barrier == "energy isolation (LOTO)":
            if extraction.barrier_failure or any(kw in t_lower for kw in ["bypassed", "without isolation", "energized", "live", "isolation not verified"]):
                risk_factors.append("Energy isolation (LOTO) missing, bypassed, or not verified on energized system")
                return "SIF_POTENTIAL", 0.92, risk_factors

        # 3. Line of Fire & Suspended Load Precursor
        if any(kw in t_lower for kw in ["suspended load", "underneath", "line of fire", "crane", "hoisting", "rigging", "struck-by"]) or extraction.exposure == "worker in line of fire under suspended load":
            risk_factors.append("Worker positioned in line of fire or underneath a suspended load during lifting")
            return "SIF_POTENTIAL", 0.94, risk_factors

        # 4. Work at Height & Elevated Platform Precursor
        if any(kw in t_lower for kw in ["fall", "height", "roof", "scaffold", "ladder", "elevated", "rig floor", "derrick", "8 meters"]) or (metadata and metadata.get("fall_height") and metadata["fall_height"] > 6):
            if any(kw in t_lower for kw in ["without fall protection", "unprotected edge", "harness", "lanyard", "scaffolding"]) or extraction.barrier_failure:
                height_str = f" from {metadata['fall_height']} feet" if metadata and metadata.get("fall_height") else ""
                risk_factors.append(f"Elevated work activity{height_str} performed without required fall protection / harness")
                return "SIF_POTENTIAL", 0.93, risk_factors

        # 5. Pressurized System & Depressurization Precursor
        if any(kw in t_lower for kw in ["pressurized", "pressure line", "process line", "flange", "depressurized", "zero pressure", "valve"]) or extraction.activity == "pressurized system maintenance":
            if extraction.barrier_failure or any(kw in t_lower for kw in ["without confirming", "residual pressure", "loosening", "un-isolated", "pressure release"]):
                risk_factors.append("Pressurized system opened or serviced without zero-energy / depressurization verification")
                return "SIF_POTENTIAL", 0.93, risk_factors

        # 6. Machinery Guarding & Rotating Equipment Precursor
        if any(kw in t_lower for kw in ["grinding", "machine guard", "rotating machinery", "centrifugal pump", "caught-in", "nip point"]) or extraction.hazard == "rotating machinery / caught-in":
            if extraction.barrier_failure or any(kw in t_lower for kw in ["removed", "bypassed", "guard missing", "un-guarded"]):
                risk_factors.append("Operation of rotating machinery with safety guard removed, missing, or bypassed")
                return "SIF_POTENTIAL", 0.92, risk_factors

        # 7. Excavation & Trenching Precursor
        if any(kw in t_lower for kw in ["excavation", "trench", "shoring", "cave-in", "digging"]) or extraction.activity == "excavation work":
            if extraction.barrier_failure or any(kw in t_lower for kw in ["without shoring", "unprotected", "unstable", "deep"]):
                risk_factors.append("Excavation entry without required shoring or trench cave-in protective system")
                return "SIF_POTENTIAL", 0.91, risk_factors

        # 8. Toxic Gas & Hazardous Atmosphere Exposure
        if any(kw in t_lower for kw in ["h2s", "toxic gas", "hazardous atmosphere", "methane", "gas leak"]) or extraction.hazard == "toxic gas / hazardous atmosphere":
            risk_factors.append("Worker exposure to toxic gas (H2S) or hazardous asphyxiating atmosphere")
            return "SIF_POTENTIAL", 0.95, risk_factors

        # 9. Vehicle & Mobile Equipment Interaction Precursor
        if any(kw in t_lower for kw in ["vehicle", "moving vehicle", "forklift", "truck", "traffic", "pedestrian"]) or extraction.activity == "vehicle / pedestrian interaction":
            if extraction.barrier_failure or any(kw in t_lower for kw in ["not barricaded", "un-barricaded", "exclusion zone", "struck-by"]):
                risk_factors.append("Work in vehicle pathway without exclusion zone barricades or traffic isolation")
                return "SIF_POTENTIAL", 0.90, risk_factors

        # 10. Hot Work Near Flammables Precursor
        if any(kw in t_lower for kw in ["welding", "hot work", "hydrocarbon", "flammable", "combustible"]) or extraction.activity == "hot work":
            if extraction.barrier_failure or any(kw in t_lower for kw in ["without confirming", "gas test", "sparks"]):
                risk_factors.append("Hot work / welding near hydrocarbon equipment without flammable gas verification")
                return "SIF_POTENTIAL", 0.94, risk_factors

        # 11. High Severity Actual Outcomes (Fatalities, Amputations, Eye Loss)
        if metadata:
            if metadata.get("amputation") == 1.0 or metadata.get("loss_of_eye") == 1.0 or str(metadata.get("actual_severity")).lower() in ["fatal", "fatality", "severe"]:
                risk_factors.append("Severe actual consequence outcome (fatality / amputation / loss of eye)")
                return "SIF_POTENTIAL", 0.98, risk_factors

        # 12. Low Risk Office / Administrative Observation Case
        if any(kw in t_lower for kw in ["office chair", "damaged chair", "desk", "office", "paper cut", "water dispenser", "stationery", "trash can"]):
            if not any(kw in t_lower for kw in ["fall", "explosion", "gas", "pressure", "electrical", "chemical"]):
                risk_factors.append("Administrative office environment / low consequence furniture defect")
                return "NON_SIF", 0.92, risk_factors

        # 13. Fallback Evaluation Based on Extracted Attributes
        if extraction.barrier_failure or extraction.hazard or extraction.activity:
            if extraction.barrier_failure and extraction.barrier_failure != "None Detected":
                risk_factors.append(f"Detected safety barrier failure: {extraction.barrier_failure}")
                return "SIF_POTENTIAL", 0.85, risk_factors
            if extraction.hazard and extraction.hazard != "Unspecified Hazard":
                risk_factors.append(f"Operational hazard present: {extraction.hazard}")
                return "SIF_POTENTIAL", 0.80, risk_factors

        # Default fallback if narrative is benign
        return "NON_SIF", 0.80, ["Routine operational observation without critical barrier failures"]


weak_rules_engine = WeakSupervisionRules()
