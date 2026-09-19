import re
from typing import Optional, List, Tuple

ENERGY_PATTERNS: List[Tuple[str, str, int]] = [
    (r"\bpressur(?:e|ized)\s+(?:gas|fluid|line|system)\b|\bhydraulic\b|\bpneumatic\b", "pressurized fluid / gas energy", 95),
    (r"\bconcentrated acid\b|\bacid was released\b|\bchemical energy\b|\btoxic gas\b|\bh2s\b|\bflammable gas\b|\blel\b", "chemical energy", 95),
    (r"\bgravitational energy\b|\bgravity\b|\bgravitational\b|\bsuspended load\b|\bsuspended valve\b|\bheight\b|\belevation\b", "gravitational energy", 90),
    (r"\belectrical supply\b|\belectrical energy\b|\belectrical\b|\bhigh voltage\b|\b440v\b|\benergized\b", "electrical energy", 90),
    (r"\bthermal energy\b|\bthermal\b|\bsteam\b|\bhot surface\b|\bwelding operation\b|\bwelding\b", "thermal energy", 85),
    (r"\bstored mechanical energy\b|\bmechanical\b|\brotat(?:ing|ional)\b|\bkinetic\b|\bwrench\b", "mechanical / rotational energy", 80),
    (r"\bhazardous energy(?: sources)?\b|\bzero energy\b", "hazardous energy / unspecified type", 70)
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
