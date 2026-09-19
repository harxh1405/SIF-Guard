import io
import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session
import pandas as pd
from app.db.database import get_db
from app.db.models.report import SafetyReport
from app.schemas.report import SafetyReportRead, ImportSummary
from app.services.ingestion.oil import OILHSSEAdapter
from app.services.preprocessing.cleaner import TextCleaner

router = APIRouter()
cleaner = TextCleaner()


@router.post("/reports/import", response_model=ImportSummary)
async def import_reports(
    file: UploadFile = File(...),
    source: str = Form("oil_hsse"),
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
            lines = contents.decode("utf-8", errors="ignore").strip().split("\n")
            if len(lines) == 1 or filename.endswith(".json"):
                data = json.loads(contents)
                if isinstance(data, dict):
                    for k in ["reports", "data", "records", "items", "incidents"]:
                        if k in data and isinstance(data[k], list):
                            data = data[k]
                            break
                df = pd.DataFrame(data if isinstance(data, list) else [data])
            else:
                data = [json.loads(line) for line in lines if line.strip()]
                df = pd.DataFrame(data)
        elif filename.endswith((".txt", ".log")) or file.content_type == "text/plain":
            text_str = contents.decode("utf-8", errors="ignore").strip()
            if "," in text_str and ("description" in text_str.lower() or "narrative" in text_str.lower() or "report_text" in text_str.lower()):
                try:
                    df = pd.read_csv(io.BytesIO(contents))
                except Exception:
                    rec_prefix = "CAM" if ("camera" in filename or source == "camera") else ("MANUAL" if ("manual" in filename or source == "manual_narrative") else "RAW")
                    origin = "CAMERA_CAPTURE" if rec_prefix == "CAM" else ("MANUAL_NARRATIVE" if rec_prefix == "MANUAL" else "oil_hsse")
                    df = pd.DataFrame([{
                        "report_text": text_str,
                        "source_record_id": f"{rec_prefix}-{uuid.uuid4().hex[:6].upper()}",
                        "site": "Not specified",
                        "data_origin": origin
                    }])
            else:
                rec_prefix = "CAM" if ("camera" in filename or source == "camera") else ("MANUAL" if ("manual" in filename or source == "manual_narrative") else "RAW")
                origin = "CAMERA_CAPTURE" if rec_prefix == "CAM" else ("MANUAL_NARRATIVE" if rec_prefix == "MANUAL" else "oil_hsse")
                df = pd.DataFrame([{
                    "report_text": text_str,
                    "source_record_id": f"{rec_prefix}-{uuid.uuid4().hex[:6].upper()}",
                    "site": "Not specified",
                    "data_origin": origin
                }])
        elif filename.endswith((".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".tiff")):
            from app.services.ocr.service import ocr_service
            ocr_res = ocr_service.extract(contents, file.filename)
            if not ocr_res.text or not ocr_res.text.strip():
                raise HTTPException(status_code=400, detail="OCR engine could not extract readable text from document.")
            if "camera" in filename or source == "camera":
                rec_prefix, origin = "CAM", "CAMERA_CAPTURE"
            elif filename.endswith(".pdf"):
                rec_prefix, origin = "PDF", "PDF_DOCUMENT"
            else:
                rec_prefix, origin = "IMG", "IMAGE_UPLOAD"
            df = pd.DataFrame([{
                "report_text": ocr_res.text.strip(),
                "source_record_id": f"{rec_prefix}-{uuid.uuid4().hex[:6].upper()}",
                "site": "Not specified",
                "data_origin": origin
            }])
        else:
            text_str = contents.decode("utf-8", errors="ignore").strip()
            if text_str:
                df = pd.DataFrame([{
                    "report_text": text_str,
                    "source_record_id": f"RAW-{uuid.uuid4().hex[:6].upper()}",
                    "site": "Not specified"
                }])
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, XLSX, JSON, TXT, PDF, or Image.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse uploaded file: {str(e)}")

    total_received = len(df)
    adapter = OILHSSEAdapter()

    try:
        valid_df, invalid_count = adapter.validate(df)
        reports = adapter.ingest(valid_df)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Source adapter validation failed: {str(e)}")

    from app.api.routes.analysis import run_single_report_analysis

    imported_count = 0
    duplicate_count = 0

    imported_ids = []

    for r in reports:
        r.report_text = cleaner.preprocess(r.report_text)
        
        existing = db.query(SafetyReport).filter(SafetyReport.id == r.id).first()
        if existing:
            duplicate_count += 1
            imported_ids.append(existing.id)
            continue
        
        db.add(r)
        db.commit()
        db.refresh(r)
        imported_ids.append(r.id)

        # Run automated analysis pipeline on imported report
        try:
            run_single_report_analysis(db, r)
        except Exception:
            pass

        imported_count += 1

    return ImportSummary(
        records_received=total_received,
        records_imported=imported_count,
        duplicates=duplicate_count,
        invalid=invalid_count,
        source=source,
        imported_ids=imported_ids,
        first_imported_id=imported_ids[0] if imported_ids else None
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
    
    return query.order_by(SafetyReport.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/reports/{report_id}", response_model=SafetyReportRead)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Safety report '{report_id}' not found")
    return report
