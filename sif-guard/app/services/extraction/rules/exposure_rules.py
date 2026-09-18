import re
from typing import Optional, List, Tuple

EXPOSURE_PATTERNS: List[Tuple[str, str, int]] = [
    (r"\bline of fire\b|\bdrop zone\b|\bunder(?:neath)? suspended load\b", "line of fire", 95),
    (r"\btoxic gas\b|\boxygen deficien(?:cy|t)\b|\binhalation\b", "toxic gas / oxygen deficiency", 95),
    (r"\bpedestrian\b|\bwalkway\b|\btraffic zone\b", "pedestrian line of fire", 90),
    (r"\bburial\b|\bcrush(?:ed)?\b|\btrapped in trench\b", "burial / crush", 90),
    (r"\bpinch point\b|\bnip point\b|\bentanglement\b", "rotating equipment entanglement", 85)
]

CONSEQUENCE_PATTERNS: List[Tuple[str, str, int]] = [
    (r"\bfatality\b|\bfatal\b|\bdeath\b", "fatal injury", 100),
    (r"\bamputation\b|\bloss of limb\b", "amputation", 95),
    (r"\basphyxiation\b|\bsuffocation\b", "toxic asphyxiation", 95),
    (r"\bburn\b|\bblast\b|\bexplosion injury\b", "burn / blast", 90),
    (r"\bfracture\b|\bsevere injury\b", "serious / irreversible injury", 85),
    (r"\blaceration\b|\bcut\b|\bcontusion\b", "minor injury / laceration", 40)
]


class ExposureAndConsequenceEngine:
    def evaluate_exposure(self, text: str) -> Optional[str]:
        lower = text.lower()
        if "administrative office" in lower or "desk drawer" in lower:
            return None
        for pat, name, _ in sorted(EXPOSURE_PATTERNS, key=lambda x: x[2], reverse=True):
            if re.search(pat, lower):
                return name
        return None

    def evaluate_consequence(self, text: str) -> Optional[str]:
        lower = text.lower()
        if "administrative office" in lower or "desk drawer" in lower or "no injury or near miss occurred" in lower:
            return None
        for pat, name, _ in sorted(CONSEQUENCE_PATTERNS, key=lambda x: x[2], reverse=True):
            if re.search(pat, lower):
                return name
        return None


exposure_consequence_engine = ExposureAndConsequenceEngine()
