import os
import json
import pandas as pd
from typing import List, Dict, Any

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
if not os.path.exists(DATA_DIR):
    DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "data"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

CATEGORIES_TO_SAMPLE = [
    "confined space",
    "energy isolation",
    "pressure isolation",
    "hot work",
    "fall protection",
    "lifting",
    "machine guarding",
    "excavation",
    "vehicle",
    "electrical",
    "toxic gas",
    "barrier failure",
    "effective barrier",
    "low risk",
    "corrective action"
]


def prepare_ner_selection(target_count: int = 750) -> pd.DataFrame:
    """
    Selects a stratified subset of 500-1,000 reports from the 5,000-record OIL corpus
    specifically for NER candidate span annotation and human review.
    Does NOT treat the classification dataset directly as an NER training dataset.
    """
    source_csv = os.path.join(DATA_DIR, "sif_guard_xgboost_dataset.csv")
    if not os.path.exists(source_csv):
        source_csv = os.path.join(DATA_DIR, "sif_guard_train.csv")

    df = pd.read_csv(source_csv)
    print(f"Loaded {len(df)} total reports from {source_csv}")

    selected_indices = set()
    per_cat = max(10, target_count // len(CATEGORIES_TO_SAMPLE))

    for cat in CATEGORIES_TO_SAMPLE:
        # Match against text or structured columns
        mask = (
            df["report_text"].str.contains(cat, case=False, na=False) |
            df["activity"].str.contains(cat, case=False, na=False) |
            df["hazard"].str.contains(cat, case=False, na=False) |
            df["barrier"].str.contains(cat, case=False, na=False) |
            df["barrier_failure"].str.contains(cat, case=False, na=False)
        )
        cat_indices = df[mask].index.tolist()
        for idx in cat_indices[:per_cat]:
            selected_indices.add(idx)

    # Fill remaining up to target_count
    remaining = [i for i in df.index if i not in selected_indices]
    needed = target_count - len(selected_indices)
    if needed > 0:
        selected_indices.update(remaining[:needed])

    sampled_df = df.loc[list(selected_indices)].copy()
    output_path = os.path.join(OUTPUT_DIR, "ner_corpus_selection.csv")
    sampled_df.to_csv(output_path, index=False)
    print(f"Saved {len(sampled_df)} stratified NER candidate reports to {output_path}")
    return sampled_df


if __name__ == "__main__":
    prepare_ner_selection(750)
