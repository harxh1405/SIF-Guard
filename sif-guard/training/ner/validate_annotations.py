import re
import json
from typing import List, Dict, Any, Tuple

VALID_LABELS = {
    "ACTIVITY", "HAZARD", "HAZARDOUS_SUBSTANCE", "EXPOSURE",
    "ENERGY_SOURCE", "EQUIPMENT", "HUMAN_FACTOR", "ENVIRONMENTAL_FACTOR",
    "BARRIER", "BARRIER_FAILURE", "POTENTIAL_CONSEQUENCE"
}


def validate_spans(record: Dict[str, Any]) -> Tuple[bool, List[str]]:
    errors = []
    text = record.get("text", "")
    entities = record.get("entities", [])

    for idx, ent in enumerate(entities):
        start, end = ent.get("start"), ent.get("end")
        label = ent.get("label")

        if start is None or end is None or start >= end:
            errors.append(f"Entity #{idx}: Invalid span boundary [{start}, {end}]")
            continue

        if start < 0 or end > len(text):
            errors.append(f"Entity #{idx}: Span [{start}, {end}] out of bounds for text length {len(text)}")
            continue

        if label not in VALID_LABELS:
            errors.append(f"Entity #{idx}: Invalid label '{label}'. Must be one of {VALID_LABELS}")

        expected_text = ent.get("text")
        if expected_text and text[start:end] != expected_text:
            errors.append(f"Entity #{idx}: Slice mismatch! '{text[start:end]}' != expected '{expected_text}'")

    return len(errors) == 0, errors


def convert_to_bio_tokens(text: str, entities: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Simple regex tokenizer for baseline BIO alignment
    token_matches = list(re.finditer(r"\S+", text))
    tokens = [m.group(0) for m in token_matches]
    ner_tags = ["O"] * len(tokens)

    for ent in entities:
        start, end = ent["start"], ent["end"]
        label = ent["label"]
        is_first = True

        for i, m in enumerate(token_matches):
            t_start, t_end = m.start(), m.end()
            # If token overlaps with entity span
            if max(start, t_start) < min(end, t_end):
                tag = f"B-{label}" if is_first else f"I-{label}"
                ner_tags[i] = tag
                is_first = False

    return {
        "tokens": tokens,
        "ner_tags": ner_tags
    }
