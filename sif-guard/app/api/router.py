from fastapi import APIRouter
from app.api.routes import health, reports, analysis, patterns, analytics, lsr, knowledge, review, dashboard

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(reports.router, tags=["Reports"])
api_router.include_router(analysis.router, tags=["Analysis"])
api_router.include_router(patterns.router, tags=["Patterns & Similarity"])
api_router.include_router(analytics.router, tags=["Analytics & Hotspots"])
api_router.include_router(lsr.router, tags=["Life-Saving Rules"])
api_router.include_router(knowledge.router, tags=["Knowledge Base"])
api_router.include_router(review.router, tags=["Human Review"])
api_router.include_router(dashboard.router, tags=["Dashboard"])
