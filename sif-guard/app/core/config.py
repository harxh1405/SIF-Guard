import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SIF-Guard"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = "super-secret-key-change-in-production"

    # Database
    DATABASE_URL: str = "sqlite:///./sif_guard.db"

    # NLP & Embeddings
    EMBEDDING_MODEL: str = "BAAI/bge-base-en-v1.5"
    MODEL_DIR: str = "app/ml/models"
    LSR_THRESHOLD: float = 0.65
    SIMILARITY_THRESHOLD: float = 0.70
    BATCH_SIZE: int = 32

    # SIF XGBoost Classifier Settings
    SIF_CLASSIFIER_MODE: str = "xgboost"  # xgboost, heuristic
    SIF_MODEL_PATH: str = "app/ml/models/sif/xgboost_model.json"
    SIF_PREPROCESSOR_PATH: str = "app/ml/models/sif/preprocessor.joblib"
    SIF_HIGH_THRESHOLD: float = 0.70
    SIF_UNCERTAIN_THRESHOLD: float = 0.40

    # OCR Settings
    OCR_PROVIDER: str = "tesseract"
    OCR_VERIFICATION_THRESHOLD: float = 0.85
    OCR_MAX_FILE_SIZE_MB: float = 15.0

    # MLflow
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
