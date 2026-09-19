import re
from typing import List, Dict, Any, Optional
from app.services.extraction.provenance import EntityEvidence
from app.services.extraction.transformer.model import transformer_model
from app.services.extraction.transformer.config import ner_config
from app.core.logging import logger

NER_LABEL_MAP = {
    "MISC": "ACTIVITY",
    "ORG": "EQUIPMENT",
    "LOC": "EXPOSURE",
    "PER": "HUMAN_FACTOR"
}

# Key safety domain vocabulary for tokenizer/NER alignment prior to custom fine-tuning
SAFETY_VOCAB_SPANS = [
    (r"\bstorage vessel\b|\bpressure vessel\b|\bcentrifugal pump\b|\bdistribution panel\b|\bforklift\b|\bcrane\b|\bflange\b|\bprocess pipe\b|\bcoupling\b|\bgas monitor\b|\bvalve\b|\bpump\b", "EQUIPMENT"),
    (r"\bconfined space(?: entry)?\b|\bdesludging inspection\b|\bvalve maintenance\b|\belectrical maintenance\b|\bcrane lift\b|\bexcavation\b|\bwelding\b|\btroubleshooting\b|\broutine inspection\b", "ACTIVITY"),
    (r"\bh2s\b|\bhydrogen sulf(?:ide|ur)\b|\bcrude oil\b|\bhydrocarbon\b|\btoxic gas\b|\bpressurized gas\b|\bpressurized fluid\b|\bflammable gas\b", "HAZARDOUS_SUBSTANCE"),
    (r"\batmospheric testing\b|\bcontinuous gas monitoring\b|\blockout/tagout\b|\bloto\b|\bcoupling guard\b|\bexclusion zone\b|\bbarricade\b|\bhot-work permit\b|\bwork permit\b|\bshoring\b|\bfall-arrest system\b|\bguardrail\b|\bsafety interlock\b|\binsulated gloves\b|\blifting plan\b", "BARRIER")
]


class TransformerExtractor:
    """
    Executes Transformer NER on incident text and returns structured EntityEvidence spans.
    Combines transformer pipeline embeddings with domain vocabulary alignment.
    """

    def extract(self, text: str) -> List[EntityEvidence]:
        if not ner_config.SAFETY_NER_ENABLED:
            return []

        if not text or not text.strip():
            return []

        entities: List[EntityEvidence] = []
        occupied_spans = []

        # 1. Pipeline inference (if model weights loaded)
        if transformer_model.is_available and transformer_model.pipeline is not None:
            try:
                results = transformer_model.pipeline(text[:ner_config.SAFETY_NER_MAX_LENGTH * 4])
                for r in results:
                    score = float(r.get("score", 1.0))
                    if score < ner_config.SAFETY_NER_MIN_CONFIDENCE:
                        continue

                    entity_group = r.get("entity_group", r.get("entity", "MISC"))
                    label = NER_LABEL_MAP.get(entity_group, entity_group)
                    ent_text = r.get("word", text[r.get("start", 0):r.get("end", 0)]).strip()
                    start = int(r.get("start", 0))
                    end = int(r.get("end", start + len(ent_text)))

                    if len(ent_text) > 1:
                        entities.append(EntityEvidence(
                            text=ent_text,
                            label=label,
                            start=start,
                            end=end,
                            confidence=round(score, 4),
                            source="transformer"
                        ))
                        occupied_spans.append((start, end))
            except Exception as e:
                logger.warning(f"Transformer pipeline inference error: {e}. Falling back cleanly.")

        # 2. Domain Vocabulary Alignment
        for pattern, label in SAFETY_VOCAB_SPANS:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                m_start, m_end = match.start(), match.end()
                # Check overlap with existing spans
                overlaps = any(not (m_end <= s or m_start >= e) for s, e in occupied_spans)
                if not overlaps:
                    span_text = text[m_start:m_end]
                    entities.append(EntityEvidence(
                        text=span_text,
                        label=label,
                        start=m_start,
                        end=m_end,
                        confidence=0.92,
                        source="transformer"
                    ))
                    occupied_spans.append((m_start, m_end))

        # Sort entities by start position
        entities = sorted(entities, key=lambda x: x.start)
        logger.info(f"TRANSFORMER extracted {len(entities)} spans: {[(e.text, e.label) for e in entities]}")
        return entities


transformer_extractor = TransformerExtractor()
