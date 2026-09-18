import re
from typing import Optional, List, Tuple

ACTIVITY_PATTERNS: List[Tuple[str, str, int]] = [
    # (regex, canonical_activity, priority)
    (r"\bconfined space(?: entry)?\b|\bvessel entry\b|\btank entry\b", "confined space entry", 100),
    (r"\bhot[- ]work\b|\bwelding\b|\btorch cutting\b", "hot work", 95),
    (r"\bgrinding machine\b|\bgrind(?:er|ing)\b|\bmachinery operation\b", "machinery operation / grinding", 92),
    (r"\blifting(?:\s+operation)?\b|\bcrane lift\b|\brigging\b", "lifting operation", 90),
    (r"\bpressur(?:e|ized)\s+(?:system\s+)?maintenance\b|\bflange\s+(?:unbolting|breaking)\b|\bline break\b", "pressurized system maintenance", 90),
    (r"\bworking at height\b|\bwork at height\b|\bscaffold(?:ing)?\b|\broof work\b|\belevated\b", "work at height", 85),
    (r"\bexcavat(?:e|ed|ion)(?:\s+work)?\b|\btrench(?:ing)?\b", "excavation work", 85),
    (r"\bpedestrian\b.*?\b(?:vehicle|forklift|truck)\b|\b(?:vehicle|forklift|truck)\b.*?\bpedestrian\b|\bvehicle operating zone\b", "vehicle / pedestrian interaction", 82),
    (r"\bvehicle\s+(?:movement|operation)\b|\bforklift\b|\btruck\b|\bdriving\b", "vehicle operation", 80),
    (r"\bmachin(?:ery|e)\s+maintenance\b|\bpump maintenance\b|\brotating equipment\b", "machinery maintenance", 80),
    (r"\belectrical\s+(?:maintenance|work)\b|\bswitchgear\b|\bcable repair\b", "electrical work", 80),
    (r"\bchemical\s+(?:transfer|handling)\b|\bacid\b|\btoxic\b", "chemical handling", 75),
    (r"\broutine inspection\b|\boffice inspection\b|\badministrative\b", "routine inspection", 50),
    (r"\bgeneral maintenance\b|\bhousekeeping\b", "general maintenance", 40)
]


class ActivityRuleEngine:
    def evaluate(self, text: str) -> Optional[str]:
        lower = text.lower()
        for pattern, activity_name, _ in sorted(ACTIVITY_PATTERNS, key=lambda x: x[2], reverse=True):
            if re.search(pattern, lower):
                return activity_name
        return None


activity_rule_engine = ActivityRuleEngine()
