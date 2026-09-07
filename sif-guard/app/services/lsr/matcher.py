from typing import List, Dict, Any, Optional
import numpy as np
from app.services.embeddings.service import embedding_service
from app.schemas.analysis import LSRMatchSchema
from app.core.config import settings

# Canonical IOGP 9 Life-Saving Rules definitions
IOGP_LSR_DEFINITIONS = [
    {
        "code": "CONFINED_SPACE",
        "name": "Confined Space",
        "description": "Obtain authorization before entering a confined space. Verify atmospheric testing and continuous monitoring.",
        "keywords": ["confined space", "vessel", "tank", "atmospheric testing", "gas testing", "h2s", "oxygen deficiency", "vault"]
    },
    {
        "code": "LINE_OF_FIRE",
        "name": "Line of Fire",
        "description": "Keep yourself and others out of the line of fire. Position yourself away from moving machinery, suspended loads, and pressure sources.",
        "keywords": ["line of fire", "suspended load", "underneath load", "moving equipment", "pinch point", "struck by", "falling object"]
    },
    {
        "code": "WORK_AT_HEIGHT",
        "name": "Work at Height",
        "description": "Protect yourself against falling when working at height. Always inspect and use approved fall protection systems.",
        "keywords": ["work at height", "elevated", "fall protection", "harness", "scaffold", "ladder", "roof", "feet", "unprotected edge"]
    },
    {
        "code": "ENERGY_ISOLATION",
        "name": "Energy Isolation",
        "description": "Verify isolation and zero energy state before work begins. Apply Lockout Tagout (LOTO).",
        "keywords": ["energy isolation", "loto", "lockout", "tagout", "zero energy", "electrical isolation", "de-energize", "valves"]
    },
    {
        "code": "HOT_WORK",
        "name": "Hot Work",
        "description": "Control flammables and ignition sources. Obtain hot work permit and conduct gas testing before spark-producing activities.",
        "keywords": ["hot work", "welding", "cutting", "grinding", "spark", "flammable", "ignition", "permit to work", "ptw"]
    },
    {
        "code": "SAFE_LIFTING",
        "name": "Safe Mechanical Lifting",
        "description": "Plan lifting operations and control the area. Never walk under a suspended load.",
        "keywords": ["lifting", "crane", "rigging", "hoist", "suspended load", "rigging equipment", "slings"]
    },
    {
        "code": "BYPASS_SAFETY_CONTROLS",
        "name": "Bypass Safety Controls",
        "description": "Obtain authorization before overriding or disabling safety controls or safety critical equipment.",
        "keywords": ["bypass", "interlock", "safety control", "override", "disable", "safety valve", "alarm"]
    },
    {
        "code": "DRIVING",
        "name": "Driving",
        "description": "Follow safe driving rules. Wear seatbelts, obey speed limits, and do not use mobile phones while driving.",
        "keywords": ["driving", "vehicle", "seatbelt", "speeding", "rollover", "driver", "transport", "truck"]
    },
    {
        "code": "WORKING_WITH_WATER",
        "name": "Working with Water",
        "description": "Wear a personal flotation device (PFD) and check buoyancy equipment when working near or on water.",
        "keywords": ["water", "flotation device", "pfd", "barge", "offshore", "drowning", "lifejacket"]
    }
]


class LSRMatcher:

    def __init__(self):
        self.rules = IOGP_LSR_DEFINITIONS
        self.rule_embeddings = {}

    def _get_rule_embedding(self, rule: Dict[str, Any]) -> List[float]:
        code = rule["code"]
        if code not in self.rule_embeddings:
            text = f"{rule['name']}: {rule['description']} Keywords: {', '.join(rule['keywords'])}"
            self.rule_embeddings[code] = embedding_service.encode(text)
        return self.rule_embeddings[code]

    def map_report(self, text: str, threshold: float = None) -> List[LSRMatchSchema]:
        if not text:
            return []

        threshold = threshold or settings.LSR_THRESHOLD
        t_lower = text.lower()
        report_emb = np.array(embedding_service.encode(text))

        matches = []
        for rule in self.rules:
            rule_emb = np.array(self._get_rule_embedding(rule))
            
            # Cosine similarity
            dot = np.dot(report_emb, rule_emb)
            norm_a = np.linalg.norm(report_emb)
            norm_b = np.linalg.norm(rule_emb)
            sim = dot / (norm_a * norm_b) if norm_a > 0 and norm_b > 0 else 0.0

            # Keyword boosting
            kw_match_count = sum(1 for kw in rule["keywords"] if kw in t_lower)
            boost = kw_match_count * 0.12
            final_score = float(np.clip(sim + boost, 0.0, 1.0))

            if final_score >= threshold:
                confidence = float(np.clip(final_score * 0.95, 0.5, 0.99))
                matches.append(LSRMatchSchema(
                    rule_code=rule["code"],
                    rule_name=rule["name"],
                    score=round(final_score, 4),
                    confidence=round(confidence, 4)
                ))

        # Sort descending by score
        matches.sort(key=lambda x: x.score, reverse=True)
        return matches


lsr_matcher = LSRMatcher()
