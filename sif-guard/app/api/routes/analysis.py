import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.db.models.report import SafetyReport
from app.db.models.analysis import ReportAnalysis
from app.db.models.job import AnalysisJob
from app.schemas.analysis import AnalysisResponse, SIFResultSchema, LSRMatchSchema
from app.services.extraction.service import extraction_service
from app.services.sif.classifier import sif_classifier
from app.services.lsr.matcher import lsr_matcher
from app.services.fingerprint.service import fingerprint_service
from app.services.similarity.service import similarity_service
from app.services.embeddings.service import embedding_service

router = APIRouter()


def run_single_report_analysis(db: Session, report: SafetyReport) -> AnalysisResponse:
    # 1. Extraction
    extraction = extraction_service.extract(report.report_text, report.raw_data)
    
    # Update report structured fields if not already populated
    if not report.activity and extraction.activity:
        report.activity = extraction.activity
    if not report.hazard and extraction.hazard:
        report.hazard = extraction.hazard
    if not report.barrier_failure and extraction.barrier_failure:
        report.barrier_failure = extraction.barrier_failure

    # 2. Embeddings
    if not report.embedding:
        report.embedding = embedding_service.encode(report.report_text)

    # 3. SIF Classification
    sif_res = sif_classifier.predict(report.report_text, extraction, report.raw_data)
    report.sif_potential = sif_res.classification
    report.sif_score = sif_res.score
    report.sif_confidence = sif_res.confidence

    # 4. LSR Mapping
    lsr_matches = lsr_matcher.map_report(report.report_text)
    report.life_saving_rules = [m.model_dump() for m in lsr_matches]

    # 5. Fingerprint
    fingerprint = fingerprint_service.generate_fingerprint(extraction, lsr_matches)

    # 6. Similarity
    similar = similarity_service.find_similar_reports(db, report, limit=3)

    # Persist ReportAnalysis
    existing_analysis = db.query(ReportAnalysis).filter(ReportAnalysis.report_id == report.id).first()
    if existing_analysis:
        existing_analysis.sif_classification = sif_res.classification
        existing_analysis.sif_score = sif_res.score
        existing_analysis.confidence = sif_res.confidence
        existing_analysis.risk_factors = sif_res.risk_factors
        existing_analysis.extraction = extraction.model_dump()
        existing_analysis.life_saving_rules = [m.model_dump() for m in lsr_matches]
        existing_analysis.fingerprint = fingerprint.model_dump()
    else:
        new_analysis = ReportAnalysis(
            id=f"analysis_{report.id}",
            report_id=report.id,
            sif_classification=sif_res.classification,
            sif_score=sif_res.score,
            confidence=sif_res.confidence,
            risk_factors=sif_res.risk_factors,
            extraction=extraction.model_dump(),
            life_saving_rules=[m.model_dump() for m in lsr_matches],
            fingerprint=fingerprint.model_dump()
        )
        db.add(new_analysis)

    db.commit()

    return AnalysisResponse(
        report_id=report.id,
        extraction=extraction,
        sif=sif_res,
        life_saving_rules=lsr_matches,
        fingerprint=fingerprint,
        similar_reports=similar
    )


@router.post("/reports/{report_id}/analyze", response_model=AnalysisResponse)
def analyze_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Safety report '{report_id}' not found")
    return run_single_report_analysis(db, report)


def process_batch_job(job_id: str, force: bool = False):
    db = SessionLocal()
    try:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job:
            return
        
        job.status = "running"
        db.commit()

        if force:
            reports_to_process = db.query(SafetyReport).all()
        else:
            reports_to_process = db.query(SafetyReport).filter(SafetyReport.sif_potential.is_(None)).all()
            if not reports_to_process:
                # If no unanalyzed reports exist, re-analyze all reports in database
                reports_to_process = db.query(SafetyReport).all()

        job.total = len(reports_to_process)
        db.commit()

        processed_count = 0
        failed_count = 0

        for r in reports_to_process:
            try:
                run_single_report_analysis(db, r)
                processed_count += 1
            except Exception as e:
                logger.error(f"Batch analysis error for report {r.id}: {e}")
                failed_count += 1
            
            job.processed = processed_count
            job.failed = failed_count
            db.commit()

        job.status = "completed"
        job.completed_at = datetime.datetime.utcnow()
        db.commit()
    except Exception as ex:
        if job:
            job.status = "failed"
            job.error_message = str(ex)
            db.commit()
    finally:
        db.close()


@router.post("/reports/analyze-batch")
def analyze_batch(force: bool = Query(False), background_tasks: BackgroundTasks = None, db: Session = Depends(get_db)):
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    
    if force:
        total_count = db.query(SafetyReport).count()
    else:
        unprocessed_count = db.query(SafetyReport).filter(SafetyReport.sif_potential.is_(None)).count()
        total_count = unprocessed_count if unprocessed_count > 0 else db.query(SafetyReport).count()

    job = AnalysisJob(
        id=job_id,
        total=total_count,
        processed=0,
        failed=0,
        status="pending"
    )
    db.add(job)
    db.commit()

    if background_tasks:
        background_tasks.add_task(process_batch_job, job_id, force)

    return {
        "job_id": job_id,
        "status": "pending",
        "total_reports_queued": total_count
    }


@router.get("/reports/jobs/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return {
        "job_id": job.id,
        "status": job.status,
        "total": job.total,
        "processed": job.processed,
        "failed": job.failed,
        "created_at": job.created_at,
        "completed_at": job.completed_at,
        "error_message": job.error_message
    }
