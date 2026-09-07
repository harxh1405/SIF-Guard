import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.report import SafetyReport
from app.db.models.review import SIFLabel
from app.schemas.report import SafetyReportRead
from app.schemas.review import ReviewCreate, ReviewRead

router = APIRouter()


@router.get("/review/queue", response_model=List[SafetyReportRead])
def get_review_queue(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    # Queue consists of reports marked UNCERTAIN or with low confidence
    return db.query(SafetyReport).filter(
        (SafetyReport.sif_potential == "UNCERTAIN") | (SafetyReport.sif_confidence < 0.70)
    ).limit(limit).all()


@router.post("/review/{report_id}", response_model=ReviewRead)
def submit_review(
    report_id: str,
    review: ReviewCreate,
    db: Session = Depends(get_db)
):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Safety report '{report_id}' not found")

    # Update report with reviewed label
    report.sif_potential = review.label
    report.sif_confidence = review.confidence

    label_obj = SIFLabel(
        id=f"lbl_{uuid.uuid4().hex[:12]}",
        report_id=report_id,
        label=review.label,
        confidence=review.confidence,
        source="expert_review",
        reviewer=review.reviewer,
        comments=review.comments
    )
    db.add(label_obj)
    db.commit()
    db.refresh(label_obj)

    return label_obj
