from typing import List, Dict, Any, Optional
from app.services.extraction.provenance import EntityEvidence
from app.services.extraction.transformer.model import transformer_model
from app.services.extraction.transformer.config import ner_config
from app.core.logging import logger

# Label mapping from general NER entities into initial domain hints
NER_LABEL_MAP = {
    "MISC": "ACTIVITY",
    "ORG": "EQUIPMENT",
    "LOC": "EXPOSURE",
    "PER": "HUMAN_FACTOR"
}


class TransformerExtractor:
    """
    Executes Transformer NER on incident text and returns structured EntityEvidence spans.
    """

    def extract(self, text: str) -> List[EntityEvidence]:
        if not ner_config.SAFETY_NER_ENABLED or not transformer_model.is_available or transformer_model.pipeline is None:
            return []

        if not text or not text.strip():
            return []

        try:
            # Run inference (pipeline truncates/splits if length exceeds model max)
            results = transformer_model.pipeline(text[:ner_config.SAFETY_NER_MAX_LENGTH * 4])
            entities: List[EntityEvidence] = []

            for r in results:
                score = float(r.get("score", 1.0))
                if score < ner_config.SAFETY_NER_MIN_CONFIDENCE:
                    continue

                entity_group = r.get("entity_group", r.get("entity", "MISC"))
                label = NER_LABEL_MAP.get(entity_group, entity_group)
                ent_text = r.get("word", text[r.get("start", 0):r.get("end", 0)])

                entities.append(EntityEvidence(
                    text=ent_text.strip(),
                    label=label,
                    start=int(r.get("start", 0)),
                    end=int(r.get("end", len(ent_text))),
                    confidence=round(score, 4),
                    source="transformer"
                ))

            return entities
        except Exception as e:
            logger.warning(f"Transformer NER extraction error: {e}. Falling back cleanly.")
            return []


transformer_extractor = TransformerExtractor()
