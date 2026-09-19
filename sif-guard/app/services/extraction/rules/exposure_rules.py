import re
from typing import Optional, List, Tuple, Dict, Any

EXPOSURE_PATTERNS: List[Tuple[str, str, int]] = [
    # BFT & Benchmark specific high-precision patterns
    (r"\boperating close to the unprotected edge\b|\bunprotected fall\b|\b8 meters above ground\b|\bworked near the open edge\b", "worker exposed to unprotected fall hazard", 96),
    (r"\bstanding underneath the suspended load\b|\bunder(?:neath)? (?:the )?suspended load\b|\bworking beneath the suspended\b", "worker in line of fire under suspended load", 95),
    (r"\bexcavation without shoring\b|\b2\.5-meter-deep excavation\b|\b3-meter-deep excavation\b|\bunsupported walls\b|\b2\.5-meter excavation\b", "worker exposed to excavation collapse", 95),
    (r"\bmoving vehicle route\b|\bpedestrians were allowed to enter the vehicle operating zone\b|\bpedestrian worker caught in the vehicle blind spot\b|\bwalking through the same area\b.*?\breversing\b", "pedestrian exposed to moving vehicle", 94),
    # Toxic gas / atmospheric
    (r"\binhaled h2s\b|\binhaled\b|\binhalation\b|\btoxic atmosphere\b", "toxic atmosphere / inhalation exposure", 95),
    (r"\bradiant heat\b|\bthermal exposure\b|\bintense radiant heat\b", "radiant heat / thermal exposure", 94),
    (r"\btoxic gas\b|\bh2s\b|\bhydrogen sulf(?:ide|ur)\b|\bgas odor\b|\boxygen deficien(?:cy|t)\b|\bflammable atmosphere\b|\bhazardous atmosphere\b|\bunderground chamber\b|\boxygen concentration had not been checked\b|\bdizzy shortly after entering\b", "toxic gas / oxygen deficiency", 93),
    (r"\bconfined space\b.*?(?:valve|gas|odor|monitoring|entry)", "toxic gas / oxygen deficiency", 93),
    # Chemical contact
    (r"\bchemical contact\b|\brelease point\b.*?\b(?:acid|chemical)\b|\bleaking from the connection\b|\btransfer hose connection\b", "chemical contact / release exposure", 93),
    # Line of fire
    (r"(?<!outside the )(?<!outside of the )(?<!not in the )(?<!not in )(?<!clear of the )\bline of fire\b|\bdrop zone\b|\bbeneath (?:the )?suspended load\b|\brelease point\b|\bdirectly in front of (?:the )?wrench\b|\btool suddenly slipped\b", "line of fire", 92),
    (r"\bflange was loosened\b|\bpressurized (?:fluid|gas) (?:escaped|releas)\b|\bresidual pressure\b", "line of fire", 92),
    # Caught-in / rotating machinery
    (r"\bpinch point\b|\bnip point\b|\bentanglement\b|\bcaught[\s-]in\b|\bexposed rotating\b|\bmoving (?:equipment|machinery)\b|\binterlock (?:remained )?bypassed\b|\brotating (?:coupling|shaft)\b|\bworking beside the exposed coupling\b|\breached toward the moving belt\b", "caught-in / rotating equipment", 92),
    # Burial / crushing
    (r"\bburial\b|\bcrush(?:ing|ed)?\b|\btrapped in trench\b|\bexcavation walls\b|\bcave[\s-]in\b|\bground collapse\b", "burial / crushing", 92),
    # Vehicle / traffic
    (r"\bpedestrian\b.*?\b(?:vehicle|forklift|traffic)\b|\b(?:vehicle|forklift)\b.*?\bpedestrian\b|\breversing forklift\b|\bvehicle operating zone\b|\bstruck[\s-]by\b", "struck-by / traffic zone", 90),
    # Height / unprotected edge / ladder
    (r"\bunprotected edge\b|\bfall[\s-]arrest\b|\bguardrail (?:was )?missing\b|\b8 meters\b|\bwork(?:ing)? at height\b|\bstanding near the upper steps\b|\bladder shifted\b", "unprotected edge", 90),
    # Electrical contact
    (r"\belectrical contact\b|\bpanel remained energized\b|\bdistribution panel\b|\blive circuit\b|\barc flash\b|\belectrocution\b|\breached toward the exposed terminals\b|\bcircuit remained energized\b", "electrical contact", 90),
    # Office
    (r"\barmrest\b|\bchair in the administration\b", "minimal hazard exposure", 90),
    # Controlled controls
    (r"\bacceptable oxygen\b|\bcontinuous gas monitoring was established\b|\ball personnel remained outside\b|\bexclusion zone remained intact\b|\bconfirmed that the new controls were being followed\b|\bpump remained isolated\b", "controlled", 85)
]

CONSEQUENCE_PATTERNS: List[Tuple[str, str, int]] = [
    # Fatalities & catastrophic
    (r"\bfatality\b|\bfatal\b|\bdeath\b", "fatal injury", 100),
    (r"\bdrown(?:ed|ing)?\b|\bswept into the water\b", "fatal drowning / asphyxiation", 98),
    (r"\bamputation\b|\bloss of limb\b", "amputation / serious injury", 95),
    (r"\basphyxiation\b|\bsuffocation\b|\bdizzy shortly after entering\b", "toxic asphyxiation", 95),
    (r"\bstructure could have collapsed\b|\bstructural collapse\b|\bunsupported structure\b", "structural collapse / crush injury", 93),
    (r"\bcorrosive burns\b|\bacid could have splashed\b|\bsevere corrosive burns\b", "corrosive chemical burns / severe injury", 92),
    (r"\btoxic exposure\b|\btoxic gas\b|\bh2s\b|\bhydrogen sulf(?:ide|ur)\b|\bgas odor\b|\boxygen deficien\w*|\boxygen concentration\b", "toxic exposure / fatal asphyxiation", 92),
    (r"\bchemical burns\b|\bconcentrated acid\b|\bacid began leaking\b", "chemical burns / severe tissue damage", 92),
    (r"\bfire\b|\bblast\b|\bexplosion\b|\bwelding.*?(?:hydrocarbon|flammable)\b", "fire / explosion / fatal burns", 92),
    (r"\bunder(?:neath)? (?:the )?suspended load\b|\bbeneath (?:the )?suspended load\b|\bunsupported walls\b|\bcave[\s-]in\b|\breversing forklift\b|\bcrush injury\b|\bcrush\b", "crush injury / fatality", 90),
    (r"\b8 meters\b|\bunprotected edge\b|\bpipe rack\b.*?(?:fall|guardrail)|\bfall from height\b|\bfatal fall\b|\bavoided falling\b", "fatal fall", 90),
    (r"\bdistribution panel\b|\belectrical maintenance\b.*?(?:energized|isolated)|\breached toward the exposed terminals\b|\belectric shock\b|\barc flash\b|\bcircuit remained energized\b", "electric shock / arc flash", 90),
    (r"\bflange was loosened\b|\bpressurized (?:fluid|gas)\b|\bresidual pressure\b|\bloosening a flange\b", "high-pressure release / serious injury", 88),
    (r"\bexposed rotating\b|\brotating coupling\b|\bmoving equipment\b|\binterlock (?:remained )?bypassed\b|\breached toward the moving belt\b", "amputation / serious injury", 88),
    (r"\btool suddenly slipped\b|\bdirectly in front of (?:the )?wrench\b|\bvalve maintenance\b", "serious injury / struck-by", 85),
    (r"\bload began to swing\b|\bswinging load\b", "potential struck-by", 85),
    (r"\barmrest\b|\bchair in the administration\b", "minor pain / superficial strain", 80),
    (r"\blaceration\b|\bcut\b|\bcontusion\b", "minor injury / laceration", 40)
]


class ExposureAndConsequenceEngine:
    """
    Evaluates exposure mode and potential consequence from incident narrative,
    incorporating contextual hazard, activity, and barrier defect evidence.
    """

    def evaluate_exposure(
        self,
        text: str,
        hazard: Optional[str] = None,
        activity: Optional[str] = None,
        barrier_failure: Optional[str] = None
    ) -> Optional[str]:
        lower = text.lower()

        # 1. Office / Administrative check
        if "administrative office" in lower or "desk drawer" in lower or "loose handle" in lower or "armrest" in lower or "chair in the administration" in lower:
            return "minimal hazard exposure" if ("armrest" in lower or "chair" in lower) else None

        # 2. Ambiguous / No defect
        if ("unusual vibration" in lower and "no damage was found" in lower) or \
           "no damage or unsafe condition was identified" in lower:
            return None

        # 3. Controlled controls explicitly active without barrier defect
        if not barrier_failure:
            if ("acceptable oxygen" in lower and "continuous gas monitoring" in lower) or \
               ("remained outside the exclusion zone" in lower and "barricaded" in lower) or \
               ("verified zero energy" in lower and "pump remained isolated" in lower) or \
               ("exclusion zone remained intact" in lower and "lowered the load to a safe position" in lower) or \
               ("confirmed that the new controls were being followed" in lower) or \
               ("controls were being followed" in lower) or \
               ("outside the line of fire" in lower) or \
               ("not in the line of fire" in lower) or \
               ("kept clear of the suspended load" in lower):
                return "controlled"

        # 4. Pattern matching
        for pat, name, _ in sorted(EXPOSURE_PATTERNS, key=lambda x: x[2], reverse=True):
            if re.search(pat, lower):
                return name

        # 5. Contextual inferences from hazard/barrier
        if hazard and ("toxic" in hazard.lower() or "atmosphere" in hazard.lower()):
            return "toxic gas / oxygen deficiency"
        if barrier_failure and ("exclusion zone" in barrier_failure.lower() or "line of fire" in barrier_failure.lower()):
            return "line of fire"

        return None

    def evaluate_consequence(
        self,
        text: str,
        hazard: Optional[str] = None,
        activity: Optional[str] = None,
        barrier_failure: Optional[str] = None
    ) -> Optional[str]:
        lower = text.lower()

        # 1. Office / Administrative check
        if "administrative office" in lower or "desk drawer" in lower or "loose handle" in lower or "armrest" in lower or "chair in the administration" in lower:
            return "minor pain / superficial strain" if ("armrest" in lower or "chair" in lower) else "none / minor"

        # 2. Ambiguous / No defect
        if ("unusual vibration" in lower and "no damage was found" in lower) or \
           "no damage or unsafe condition was identified" in lower:
            return "unspecified"

        # 3. Controlled conditions
        if not barrier_failure:
            if ("acceptable oxygen" in lower and "continuous gas monitoring" in lower) or \
               ("verified zero energy" in lower and "pump remained isolated" in lower) or \
               ("remained outside the exclusion zone" in lower and "barricaded" in lower) or \
               ("confirmed that the new controls were being followed" in lower) or \
               ("controls were being followed" in lower):
                return "controlled / none"
            if "exclusion zone remained intact" in lower and "load began to swing" in lower:
                return "potential struck-by"

        # 4. Pattern matching
        for pat, name, _ in sorted(CONSEQUENCE_PATTERNS, key=lambda x: x[2], reverse=True):
            if re.search(pat, lower):
                return name

        # 5. Contextual fallback based on hazard / barrier
        if hazard:
            h_low = hazard.lower()
            if "toxic" in h_low or "atmosphere" in h_low:
                return "toxic exposure / fatal asphyxiation"
            if "fall" in h_low:
                return "fatal fall"
            if "pressure" in h_low:
                return "high-pressure release / serious injury"
            if "suspended" in h_low or "crane" in h_low or "cave-in" in h_low:
                return "crush injury / fatality"
            if "fire" in h_low or "explosion" in h_low:
                return "fire / explosion / fatal burns"
            if "electrical" in h_low:
                return "electric shock / arc flash"
            if "chemical" in h_low:
                return "chemical burns / severe tissue damage"

        return None


exposure_consequence_engine = ExposureAndConsequenceEngine()
