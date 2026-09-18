from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.database import get_db
from app.services.sif.classifier import sif_classifier

router = APIRouter()


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"

    sif_model_status = "loaded" if sif_classifier.is_loaded else f"fallback_{sif_classifier.mode}"

    return {
        "status": "healthy" if (db_status == "healthy" and sif_classifier.is_loaded) else "degraded",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "components": {
            "database": db_status,
            "sif_model": sif_model_status,
            "sif_model_type": sif_classifier.mode,
            "embedding_model": settings.EMBEDDING_MODEL,
            "ocr_provider": settings.OCR_PROVIDER
        }
    }
