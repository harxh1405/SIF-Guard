from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.core.security import setup_cors
from app.api.router import api_router
from app.db.database import engine, Base, SessionLocal
import app.db.models  # Ensure all models are registered with Base.metadata
from app.db.models.lsr import LifeSavingRule
from app.services.lsr.matcher import IOGP_LSR_DEFINITIONS


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables for SQLite / local testing
    Base.metadata.create_all(bind=engine)
    # Auto-seed LSR rules if database has none
    db = SessionLocal()
    try:
        if db.query(LifeSavingRule).count() == 0:
            for rule_def in IOGP_LSR_DEFINITIONS:
                rule_obj = LifeSavingRule(
                    id=f"lsr_{rule_def['code']}",
                    rule_code=rule_def["code"],
                    rule_name=rule_def["name"],
                    description=rule_def["description"],
                    keywords=rule_def["keywords"]
                )
                db.add(rule_obj)
            db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI/NLP-powered Serious Injury & Fatality Precursor Intelligence Platform Backend for Oil India Limited",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

setup_cors(app)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }
