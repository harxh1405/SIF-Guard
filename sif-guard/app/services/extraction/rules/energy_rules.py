import re
from typing import Optional, List, Tuple

ENERGY_PATTERNS: List[Tuple[str, str, int]] = [
    (r"\bpressur(?:e|ized)\s+(?:gas|fluid|line)\b|\bhydraulic\b|\bpneumatic\b", "pressurized fluid/gas energy", 95),
    (r"\bchemical energy\b|\btoxic gas\b|\bh2s\b|\bflammable gas\b|\blel\b", "hazardous atmosphere / toxic gas", 95),
    (r"\bgravitational\b|\bsuspended load\b|\bheight\b|\belevation\b", "gravitational energy", 90),
    (r"\belectrical\b|\bhigh voltage\b|\b440v\b|\benergized\b", "electrical energy", 90),
    (r"\bmechanical\b|\brotat(?:ing|ional)\b|\bkinetic\b", "mechanical / rotational energy", 85),
    (r"\bthermal\b|\bsteam\b|\bhot surface\b", "thermal energy", 80)
]


class EnergyRuleEngine:
    def evaluate(self, text: str) -> Optional[str]:
        lower = text.lower()
        if "administrative office" in lower or "desk drawer" in lower:
            return None

        for pattern, energy_name, _ in sorted(ENERGY_PATTERNS, key=lambda x: x[2], reverse=True):
            if re.search(pattern, lower):
                return energy_name
        return None


energy_rule_engine = EnergyRuleEngine()
