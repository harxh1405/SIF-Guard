import re
from typing import Optional, List, Tuple

HAZARD_PATTERNS: List[Tuple[str, str, int]] = [
    (r"\btoxic gas\b|\bhazardous atmosphere\b|\bh2s\b|\boxygen deficien(?:cy|t)\b|\boxygen concentration\b|\basphyxiation\b|\bsour-water\b", "toxic gas / hazardous atmosphere", 100),
    (r"\bpressure release\b|\bpressurized fluid\b|\bresidual pressure\b|\bline rupture\b", "pressure release", 95),
    (r"\bsuspended load\b|\bstruck[- ]by(?:\s+object)?\b|\bfalling object\b", "suspended load / struck-by", 90),
    (r"\bfall from height\b|\bunprotected edge\b|\bopen hole\b|\bopen edge\b|\bladder shifted\b|\bavoided falling\b", "fall from height", 90),
    (r"\bflammable (?:atmosphere|vapour|vapor)\b|\bfire\b|\bexplosion\b|\bflash fire\b", "fire / explosion / flammable atmosphere", 90),
    (r"\bcave[- ]in\b|\bcollapse\b|\btrench collapse\b|\bexcavation collapse\b|\bground collapse\b", "excavation collapse / cave-in", 89),
    (r"\bpedestrian\b.*?\b(?:vehicle|forklift|traffic|route)\b|\b(?:vehicle|forklift|traffic|moving vehicle|route)\b.*?\bpedestrian\b|\bvehicle operating zone\b|\breversing alarm\b", "vehicle-pedestrian interaction / struck-by", 89),
    (r"\brotating (?:machinery|equipment|shaft|coupling)\b|\bcaught[\s-]in\b|\bmoving (?:machinery|equipment)\b|\bnip point\b|\bentanglement\b", "rotating machinery / caught-in", 88),
    (r"\benergized\b|\belectrical (?:energy|maintenance|shock)\b|\bdistribution panel\b|\blive circuit\b|\bexposed terminals\b", "electrical energy / live circuit", 87),
    (r"\bforklift\b|\bvehicle\s+collision\b|\btraffic\b|\bmoving vehicle\b|\bmobile plant\b", "vehicle struck-by / collision", 85),
    (r"\bstored mechanical energy\b|\bseized valve\b|\blong wrench\b|\btool suddenly slipped\b", "stored mechanical energy", 85),
    (r"\bswinging load\b|\bload began to swing\b", "suspended / swinging load", 85),
    (r"\bchemical spill\b|\bcorrosive\b|\bconcentrated acid\b|\bcorrosive chemical\b|\bacid began leaking\b", "chemical exposure", 85),
    (r"\bunusual vibration\b", "unusual vibration", 60)
]


class HazardRuleEngine:
    def evaluate(self, text: str) -> Optional[str]:
        lower = text.lower()
        # Office check: Do not fabricate serious hazards for minor office items
        if "desk drawer" in lower or "office chair" in lower or "routine inspection of an administrative office" in lower or "armrest" in lower:
            return "ergonomic / minor office hazard" if ("armrest" in lower or "chair" in lower) else None

        for pattern, hazard_name, _ in sorted(HAZARD_PATTERNS, key=lambda x: x[2], reverse=True):
            if re.search(pattern, lower):
                return hazard_name
        return None


hazard_rule_engine = HazardRuleEngine()
