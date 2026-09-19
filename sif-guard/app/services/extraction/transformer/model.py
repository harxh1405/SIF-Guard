import os
import torch
from typing import Optional, Any
from app.services.extraction.transformer.config import ner_config
from app.core.logging import logger

try:
    from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
    HAS_TRANSFORMERS = True
except Exception:
    HAS_TRANSFORMERS = False


class TransformerNERModel:
    """
    Singleton wrapper managing Hugging Face Transformer NER model & tokenizer.
    Loaded once at startup. Supports auto device placement and graceful degradation.
    """

    def __init__(self):
        self.is_available = False
        self.pipeline = None
        self.device = self._resolve_device()

        if ner_config.SAFETY_NER_ENABLED and HAS_TRANSFORMERS:
            self._load_model()
        else:
            logger.info("Transformer NER is disabled or transformers library unavailable.")

    def _resolve_device(self) -> str:
        dev_setting = ner_config.SAFETY_NER_DEVICE.lower()
        if dev_setting == "cpu":
            return "cpu"
        elif dev_setting == "cuda" and torch.cuda.is_available():
            return "cuda"
        elif dev_setting in ("mps", "auto") and hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        elif dev_setting == "auto" and torch.cuda.is_available():
            return "cuda"
        return "cpu"

    def _load_model(self):
        try:
            model_name = ner_config.SAFETY_NER_MODEL
            logger.info(f"Loading Safety Transformer NER model: {model_name} on device: {self.device}")

            device_idx = -1 if self.device == "cpu" else (0 if self.device == "cuda" else 0)
            # Use aggregation_strategy='simple' to merge subwords into whole entity spans
            self.pipeline = pipeline(
                "ner",
                model=model_name,
                tokenizer=model_name,
                aggregation_strategy="simple",
                device=device_idx if self.device != "mps" else "mps"
            )
            self.is_available = True
            logger.info(f"Safety Transformer NER model initialized successfully.")
        except Exception as e:
            logger.warning(f"Could not load Transformer NER model '{ner_config.SAFETY_NER_MODEL}': {e}. Graceful fallback active.")
            self.is_available = False
            self.pipeline = None


transformer_model = TransformerNERModel()
