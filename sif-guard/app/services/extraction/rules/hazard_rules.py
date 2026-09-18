import re
from typing import Optional, List, Tuple

HAZARD_PATTERNS: List[Tuple[str, str, int]] = [
    (r"\btoxic gas\b|\bhazardous atmosphere\b|\bh2s\b|\boxygen deficien(?:cy|t)\b", "toxic gas / hazardous atmosphere", 100),
    (r"\bpressure release\b|\bpressurized fluid\b|\bresidual pressure\b|\bline rupture\b", "pressure release", 95),
    (r"\bsuspended load\b|\bstruck[- ]by(?:\s+object)?\b|\bfalling object\b", "suspended load / struck-by", 90),
    (r"\bfall from height\b|\bunprotected edge\b|\bopen hole\b", "fall from height", 90),
    (r"\bflammable atmosphere\b|\bfire\b|\bexplosion\b|\bflash fire\b", "fire / explosion / flammable atmosphere", 90),
    (r"\bcave[- ]in\b|\bcollapse\b|\btrench collapse\b", "cave-in / collapse", 85),
    (r"\benergized (?:circuit|conductor)\b|\belectrical shock\b|\barc flash\b", "electrical shock / arc flash", 85),
    (r"\bpedestrian\b.*?\b(?:vehicle|forklift|traffic|route)\b|\b(?:vehicle|forklift|traffic|moving vehicle|route)\b.*?\bpedestrian\b|\bvehicle operating zone\b", "vehicle-pedestrian interaction / struck-by", 86),
    (r"\bforklift\b|\bvehicle\s+collision\b|\btraffic\b|\bmoving vehicle\b|\bmobile plant\b", "vehicle struck-by / collision", 85),
    (r"\bchemical spill\b|\bcorrosive\b", "chemical exposure", 70)
]


class HazardRuleEngine:
    def evaluate(self, text: str) -> Optional[str]:
        lower = text.lower()
        # Office check: Do not fabricate serious hazards for minor office items
        if "desk drawer" in lower or "office chair" in lower or "routine inspection of an administrative office" in lower:
            return None

        for pattern, hazard_name, _ in sorted(HAZARD_PATTERNS, key=lambda x: x[2], reverse=True):
            if re.search(pattern, lower):
                return hazard_name
        return None


hazard_rule_engine = HazardRuleEngine()
