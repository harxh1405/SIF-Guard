import re
import unicodedata
from typing import Dict, List, Optional


DEFAULT_TERMINOLOGY = {
    "LOTO": "Lockout Tagout",
    "PTW": "Permit to Work",
    "PPE": "Personal Protective Equipment",
    "H2S": "Hydrogen Sulfide",
    "SIMOPS": "Simultaneous Operations",
    "JSA": "Job Safety Analysis",
    "RA": "Risk Assessment",
    "LEL": "Lower Explosive Limit",
    "CO": "Carbon Monoxide",
    "SCBA": "Self Contained Breathing Apparatus",
    "MOC": "Management of Change",
}


class TextCleaner:

    def __init__(self, terminology: Optional[Dict[str, str]] = None):
        self.terminology = terminology or DEFAULT_TERMINOLOGY

    def normalize_text(self, text: str) -> str:
        if not text:
            return ""
        
        # Unicode normalization
        text = unicodedata.normalize("NFKD", text)
        
        # Clean malformed/non-printable chars except standard whitespace
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
        
        # Whitespace normalization
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    def expand_terminology(self, text: str) -> str:
        """
        Expands acronyms in text while preserving safety terms.
        E.g., 'Worker did not apply LOTO' -> 'Worker did not apply Lockout Tagout (LOTO)'
        """
        if not text:
            return ""
        
        expanded = text
        for term, expansion in self.terminology.items():
            # Match whole word
            pattern = re.compile(rf'\b{re.escape(term)}\b', re.IGNORECASE)
            # Expand only if expansion not already present
            if term.lower() in expanded.lower() and expansion.lower() not in expanded.lower():
                expanded = pattern.sub(f"{term} ({expansion})", expanded)
                
        return expanded

    def preprocess(self, text: str) -> str:
        cleaned = self.normalize_text(text)
        return self.expand_terminology(cleaned)
