import re
from typing import Tuple, List


CORRECTIVE_PREFIXES = [
    r"\bafter the (?:incident|event|occurrence|accident)\b",
    r"\bfollowing the (?:incident|event|occurrence|accident)\b",
    r"\bcorrective action(?:s)?(?:\s*:)?\b",
    r"\bremedial action(?:s)?(?:\s*:)?\b",
    r"\bsubsequently\b",
    r"\blater\b",
    r"\bas a result of the incident\b"
]


class CorrectiveActionDetector:
    """
    Separates the incident event description from post-incident remedial or corrective actions.
    Prevents newly introduced controls from being classified as the original barrier failure.
    """

    def partition_text(self, text: str) -> Tuple[str, str]:
        lower = text.lower()
        for pat in CORRECTIVE_PREFIXES:
            m = re.search(pat, lower)
            if m:
                incident_part = text[:m.start()].strip()
                corrective_part = text[m.start():].strip()
                return incident_part, corrective_part
        return text, ""

    def filter_narrative(self, text: str) -> str:
        incident_part, _ = self.partition_text(text)
        return incident_part

    def is_corrective_measure(self, text: str, phrase: str) -> bool:
        _, corrective_part = self.partition_text(text)
        if not corrective_part:
            return False
        return phrase.lower() in corrective_part.lower()

    def is_historical_audit_resolved(self, text: str) -> bool:
        lower = text.lower()
        has_historical_lead = bool(re.search(r"\b(?:an earlier|a previous|past|historical)\s+(?:inspection|audit|finding|report)\b", lower))
        has_current_compliance = bool(
            re.search(r"(?:follow-up\s+inspections?\s+)?(?:confirmed|verified)\s+that\s+(?:the\s+)?(?:new\s+)?controls\s+were\s+being\s+followed", lower) or
            "controls were being followed" in lower or
            "all controls were in place and verified" in lower
        )
        return has_historical_lead and has_current_compliance


corrective_detector = CorrectiveActionDetector()
corrective_action_filter = corrective_detector

