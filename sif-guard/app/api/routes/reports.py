import io
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session
import pandas as pd
from app.db.database import get_db
from app.db.models.report import SafetyReport
from app.schemas.report import SafetyReportRead, ImportSummary
from app.services.ingestion.osha_severe import OSHASevereInjuryAdapter
from app.services.ingestion.osha_construction import OSHAConstructionAdapter
from app.services.ingestion.oil import OILHSSEAdapter
from app.services.preprocessing.cleaner import TextCleaner

router = APIRouter()
cleaner = TextCleaner()


@router.post("/reports/import", response_model=ImportSummary)
async def import_reports(
    file: UploadFile = File(...),
    source: str = Form("osha_severe"),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        elif filename.endswith((".json", ".jsonl")):
            lines = contents.decode("utf-8").strip().split("\n")
            if len(lines) == 1 or filename.endswith(".json"):
                data = json.loads(contents)
                df = pd.DataFrame(data if isinstance(data, list) else [data])
            else:
                data = [json.loads(line) for line in lines if line.strip()]
                df = pd.DataFrame(data)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, XLSX, or JSON/JSONL.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse uploaded file: {str(e)}")

    total_received = len(df)

    if source == "osha_severe":
        adapter = OSHASevereInjuryAdapter()
    elif source == "osha_construction":
        adapter = OSHAConstructionAdapter()
    elif source == "oil_hsse":
        adapter = OILHSSEAdapter()
    else:
        # Generic adapter
        adapter = OSHASevereInjuryAdapter()

    try:
        valid_df, invalid_count = adapter.validate(df)
        reports = adapter.ingest(valid_df)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Source adapter validation failed: {str(e)}")

    imported_count = 0
    duplicate_count = 0

    for r in reports:
        # Preprocess report text
        r.report_text = cleaner.preprocess(r.report_text)
        
        # Check duplicate by id
        existing = db.query(SafetyReport).filter(SafetyReport.id == r.id).first()
        if existing:
            duplicate_count += 1
            continue
        
        db.add(r)
        imported_count += 1

    db.commit()

    return ImportSummary(
        records_received=total_received,
        records_imported=imported_count,
        duplicates=duplicate_count,
        invalid=invalid_count,
        source=source
    )


@router.get("/reports", response_model=List[SafetyReportRead])
def list_reports(
    skip: int = 0,
    limit: int = 50,
    source: Optional[str] = None,
    sif_potential: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SafetyReport)
    if source:
        query = query.filter(SafetyReport.source_dataset == source)
    if sif_potential:
        query = query.filter(SafetyReport.sif_potential == sif_potential)
    
    return query.offset(skip).limit(limit).all()


@router.get("/reports/{report_id}", response_model=SafetyReportRead)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Safety report '{report_id}' not found")
    return report
