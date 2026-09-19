import os
import json
from typing import Dict, Any

MODEL_OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../app/ml/models/ner"))
os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)


def export_ner_artifacts(model_config: Dict[str, Any], id2label: Dict[int, str]):
    """
    Exports NER model schema and configuration artifacts for inference.
    """
    label2id = {v: k for k, v in id2label.items()}
    config_data = {
        "model_type": model_config.get("model_type", "transformer_ner"),
        "base_model": model_config.get("base_model", "dslim/bert-base-NER"),
        "id2label": id2label,
        "label2id": label2id,
        "entity_types": list(set([lbl.replace("B-", "").replace("I-", "") for lbl in id2label.values() if lbl != "O"]))
    }

    out_path = os.path.join(MODEL_OUTPUT_DIR, "config.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(config_data, f, indent=2)
    print(f"Exported NER model config -> {out_path}")


def train_ner_pipeline(annotations_path: str = None, epochs: int = 3):
    """
    Modular training harness for safety Transformer NER model.
    """
    from training.ner.validate_annotations import VALID_LABELS

    bio_labels = ["O"]
    for lbl in sorted(VALID_LABELS):
        bio_labels.extend([f"B-{lbl}", f"I-{lbl}"])

    id2label = {idx: tag for idx, tag in enumerate(bio_labels)}
    export_ner_artifacts({"model_type": "distilbert_token_classifier"}, id2label)
    print("NER fine-tuning training infrastructure initialized successfully.")


if __name__ == "__main__":
    train_ner_pipeline()
