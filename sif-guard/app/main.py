from fastapi import FastAPI
from app.core.config import settings
from app.core.security import setup_cors
from app.api.router import api_router
from app.db.database import engine, Base

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI/NLP-powered Serious Injury & Fatality Precursor Intelligence Platform Backend for Oil India Limited",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

setup_cors(app)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def startup_event():
    # Auto-create tables for SQLite / local testing
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }
