from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.facility import (
    FacilityRiskSummary,
    FacilityZone,
    DemoScenario,
    DemoSimulationRequest,
    DemoSimulationResponse,
)
from app.services.facility.service import facility_service

router = APIRouter(prefix="/facility", tags=["Facility Digital Twin"])


@router.get(
    "/overview",
    response_model=FacilityRiskSummary,
    summary="Get facility digital twin risk summary and zones",
    description="Returns aggregated risk metrics, all 7 facility zones with explainable risk breakdown, and active timeline.",
)
def get_facility_overview(db: Session = Depends(get_db)):
    return facility_service.get_facility_overview(db)


@router.get(
    "/zones/{zone_id}",
    response_model=FacilityZone,
    summary="Get specific facility zone details",
    description="Returns deep inspection data, risk factors, recommended safety controls, and zone-specific incidents.",
)
def get_zone_details(zone_id: str, db: Session = Depends(get_db)):
    zone = facility_service.get_zone_details(db, zone_id)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Facility zone '{zone_id}' not found.",
        )
    return zone


@router.get(
    "/demo/scenarios",
    response_model=List[DemoScenario],
    summary="List available demo simulation scenarios",
    description="Returns catalog of realistic oilfield/industrial near-miss scenarios for live demonstration.",
)
def get_demo_scenarios():
    return facility_service.get_demo_scenarios()


@router.post(
    "/demo/simulate",
    response_model=DemoSimulationResponse,
    summary="Simulate a new incident and trigger dynamic facility risk updates",
    description="Processes scenario or custom text through NLP extraction, SIF scoring, LSR mapping, zone inference, and recalculates risk in real time.",
)
def simulate_incident(request: DemoSimulationRequest, db: Session = Depends(get_db)):
    return facility_service.simulate_demo_incident(db, request)


@router.post(
    "/demo/reset",
    response_model=FacilityRiskSummary,
    summary="Reset simulated demo incidents",
    description="Clears all active transient demo incidents and restores baseline facility data.",
)
def reset_demo_data(db: Session = Depends(get_db)):
    return facility_service.reset_demo_incidents(db)
