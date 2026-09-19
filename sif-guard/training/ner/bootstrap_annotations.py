import os
import re
import json
import pandas as pd
from typing import List, Dict, Any

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "data"))
os.makedirs(DATA_DIR, exist_ok=True)

FIELD_TO_LABEL = {
    "activity": "ACTIVITY",
    "hazard": "HAZARD",
    "hazardous_substance": "HAZARDOUS_SUBSTANCE",
    "exposure": "EXPOSURE",
    "energy_source": "ENERGY_SOURCE",
    "equipment": "EQUIPMENT",
    "human_factor": "HUMAN_FACTOR",
    "environmental_factor": "ENVIRONMENTAL_FACTOR",
    "barrier": "BARRIER",
    "barrier_failure": "BARRIER_FAILURE",
    "potential_consequence": "POTENTIAL_CONSEQUENCE"
}


def find_entity_spans(text: str, target_phrase: str, label: str) -> List[Dict[str, Any]]:
    spans = []
    if not target_phrase or not isinstance(target_phrase, str) or target_phrase.lower() in ("none", "unknown", "not specified"):
        return spans

    phrase = target_phrase.strip()
    # Try exact match first
    pattern = re.compile(re.escape(phrase), re.IGNORECASE)
    for match in pattern.finditer(text):
        spans.append({
            "start": match.start(),
            "end": match.end(),
            "label": label,
            "text": text[match.start():match.end()],
            "confidence": 0.85,
            "status": "candidate_label"
        })

    # If no exact match and phrase contains slashes or keywords, try sub-phrases
    if not spans and ("/" in phrase or " " in phrase):
        tokens = [t.strip() for t in re.split(r"[/,]", phrase) if len(t.strip()) > 3]
        for sub in tokens:
            sub_pattern = re.compile(r"\b" + re.escape(sub) + r"\b", re.IGNORECASE)
            for m in sub_pattern.finditer(text):
                spans.append({
                    "start": m.start(),
                    "end": m.end(),
                    "label": label,
                    "text": text[m.start():m.end()],
                    "confidence": 0.70,
                    "status": "candidate_label"
                })
                break

    return spans


def bootstrap_candidate_annotations(input_csv: str = None) -> List[Dict[str, Any]]:
    csv_path = input_csv or os.path.join(DATA_DIR, "ner_corpus_selection.csv")
    if not os.path.exists(csv_path):
        from training.ner.prepare_dataset import prepare_ner_selection
        df = prepare_ner_selection(750)
    else:
        df = pd.read_csv(csv_path)

    annotated_dataset = []

    for _, row in df.iterrows():
        text = str(row.get("report_text", "")).strip()
        if not text:
            continue

        report_id = str(row.get("report_id", ""))
        all_spans = []

        for field, label in FIELD_TO_LABEL.items():
            field_val = row.get(field)
            if pd.notna(field_val) and str(field_val).strip():
                spans = find_entity_spans(text, str(field_val), label)
                all_spans.extend(spans)

        # Sort spans and remove exact duplicates or overlaps
        all_spans = sorted(all_spans, key=lambda x: (x["start"], -(x["end"] - x["start"])))
        filtered_spans = []
        last_end = -1
        for s in all_spans:
            if s["start"] >= last_end:
                filtered_spans.append(s)
                last_end = s["end"]

        annotated_dataset.append({
            "report_id": report_id,
            "text": text,
            "entities": filtered_spans,
            "is_reviewed": False,
            "metadata": {
                "source": "bootstrapped_candidate_pipeline",
                "original_fields": {k: str(row.get(k, "")) for k in FIELD_TO_LABEL.keys() if pd.notna(row.get(k))}
            }
        })

    out_file = os.path.join(DATA_DIR, "candidate_annotations.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(annotated_dataset, f, indent=2)

    print(f"Bootstrapped candidate entity spans for {len(annotated_dataset)} reports -> {out_file}")
    return annotated_dataset


if __name__ == "__main__":
    bootstrap_candidate_annotations()
