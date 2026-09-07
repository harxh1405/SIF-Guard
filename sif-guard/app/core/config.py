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
    SIF_MODEL_PATH: str = "app/ml/models/sif_xgboost_v1.json"
    MODEL_DIR: str = "app/ml/models"
    LSR_THRESHOLD: float = 0.55
    SIMILARITY_THRESHOLD: float = 0.65
    BATCH_SIZE: int = 32

    # MLflow
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
