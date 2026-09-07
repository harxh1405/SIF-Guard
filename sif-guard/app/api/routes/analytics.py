from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.analytics import (
    SiteRanking, ActivityRanking, HazardRanking, BarrierRanking, LSRRanking, TrendData
)
from app.services.analytics.service import analytics_service
from app.services.trends.service import trend_service

router = APIRouter()


@router.get("/analytics/sites", response_model=List[SiteRanking])
def get_site_analytics(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    return analytics_service.get_site_rankings(db, limit=limit)


@router.get("/analytics/activities", response_model=List[ActivityRanking])
def get_activity_analytics(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    return analytics_service.get_activity_rankings(db, limit=limit)


@router.get("/analytics/hazards", response_model=List[HazardRanking])
def get_hazard_analytics(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    return analytics_service.get_hazard_rankings(db, limit=limit)


@router.get("/analytics/barriers", response_model=List[BarrierRanking])
def get_barrier_analytics(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    return analytics_service.get_barrier_rankings(db, limit=limit)


@router.get("/analytics/lsr", response_model=List[LSRRanking])
def get_lsr_analytics(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    return analytics_service.get_lsr_rankings(db, limit=limit)


@router.get("/analytics/trends", response_model=List[TrendData])
def get_trend_analytics(grouping: str = Query("month", pattern="^(month|quarter)$"), db: Session = Depends(get_db)):
    return trend_service.calculate_trends(db, grouping=grouping)
