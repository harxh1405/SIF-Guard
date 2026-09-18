import re
from typing import Tuple, Optional

# Contextual negation patterns indicating safety control was absent, failed, or omitted
NEGATION_PRE_PATTERNS = [
    r"\b(?:not|no|wasn't|was not|were not|weren't|did not|didn't|had not|hadn't)\b(?:\s+\w+){0,3}\s+",
    r"\bwithout\b(?:\s+\w+){0,3}\s+",
    r"\bfailure to\b\s+",
    r"\bfailed to\b\s+",
    r"\bomitted\b\s+",
    r"\bmissing\b\s+",
    r"\blacking\b\s+",
    r"\binadequate\b\s+",
    r"\bnever\b\s+"
]

NEGATION_POST_PATTERNS = [
    r"\s+(?:was not|were not|wasn't|weren't|not|never)\s+(?:performed|applied|verified|conducted|completed|followed|installed|established|used|obtained|issued)",
    r"\s+(?:was|had been)\s+(?:bypassed|removed|defeated|disabled|missing|omitted|breached|skipped|compromised)",
    r"\s+(?:not confirmed|not verified|not in place)"
]

# Affirmatives/completions that counteract naive keyword matches
AFFIRMATIVE_PATTERNS = [
    r"\b(?:was|were|had been|properly|fully|correctly)\s+(?:performed|completed|verified|applied|installed|followed|established|used)\b",
    r"\bcompleted\s+(?:20\.9%|0ppm|0%\s*lel|satisfactorily|successfully)\b",
    r"\bin place and (?:verified|active|functional)\b"
]


class NegationEngine:
    """
    Evaluates safety control phrases within sentence context to distinguish:
    - Control performed/verified (positive/effective barrier)
    - Control missing/omitted/bypassed (barrier failure)
    - Post-incident corrective control
    """

    def is_barrier_failed(self, concept_phrase: str, text: str) -> bool:
        return self.is_negated_or_failed(text, concept_phrase)

    def is_negated_or_failed(self, text: str, concept_phrase: str) -> bool:
        lower_text = text.lower()
        phrase = concept_phrase.lower()

        # Check post-incident corrective context first
        if "after the" in lower_text or "following the incident" in lower_text:
            # If the phrase appears ONLY in the post-incident clause
            parts = re.split(r"\b(?:after the incident|after the event|following the incident|remedial action|corrective action)\b", lower_text)
            if len(parts) > 1:
                pre_event_text = parts[0]
                post_event_text = parts[1]
                if phrase in post_event_text and phrase not in pre_event_text:
                    return False  # Corrective action, not original failure

        # Check explicit post-pattern failures: e.g. "gas testing was not performed", "loto was not applied"
        for post_pat in NEGATION_POST_PATTERNS:
            full_pattern = re.escape(phrase) + post_pat
            if re.search(full_pattern, lower_text):
                return True

        # Check explicit pre-pattern failures: e.g. "without gas testing", "no gas testing"
        for pre_pat in NEGATION_PRE_PATTERNS:
            full_pattern = pre_pat + re.escape(phrase)
            if re.search(full_pattern, lower_text):
                return True

        # Check specific phrase-level patterns
        if re.search(r"without (?:completing |conducting |performing )?(?:the required )?" + re.escape(phrase), lower_text):
            return True
        if re.search(r"no " + re.escape(phrase) + r" (?:was |had been )?(?:performed|conducted|completed|done)", lower_text):
            return True
        if re.search(re.escape(phrase) + r" (?:had not been|was not|not) (?:completed|performed)", lower_text):
            return True

        # Check if affirmative pattern is present
        for aff in AFFIRMATIVE_PATTERNS:
            full_pattern = re.escape(phrase) + r"\s+" + aff
            if re.search(full_pattern, lower_text):
                return False

        # Fallback check for "not performed" / "missing" in the same clause
        sentences = re.split(r"[.;,]", lower_text)
        for sent in sentences:
            if phrase in sent:
                if any(neg in sent for neg in ["not performed", "not completed", "not applied", "was not", "had not", "without", "no ", "missing", "bypassed", "removed", "defeated", "breached", "not verified"]):
                    return True
                if any(pos in sent for pos in ["was performed", "was completed", "was applied", "was verified", "was installed", "completed satisfactorily"]):
                    return False

        return False


negation_engine = NegationEngine()
