import os
import json
from training.ner.validate_annotations import validate_spans, convert_to_bio_tokens
from training.ner.export_model import train_ner_pipeline

if __name__ == "__main__":
    train_ner_pipeline()
