import os
from pydantic_settings import BaseSettings


class SafetyNERConfig(BaseSettings):
    SAFETY_NER_ENABLED: bool = os.getenv("SAFETY_NER_ENABLED", "true").lower() in ("true", "1", "yes")
    SAFETY_NER_MODEL: str = os.getenv("SAFETY_NER_MODEL", "dslim/bert-base-NER")
    SAFETY_NER_DEVICE: str = os.getenv("SAFETY_NER_DEVICE", "auto")
    SAFETY_NER_MIN_CONFIDENCE: float = float(os.getenv("SAFETY_NER_MIN_CONFIDENCE", "0.50"))
    SAFETY_NER_MAX_LENGTH: int = 512

    class Config:
        case_sensitive = True


ner_config = SafetyNERConfig()
