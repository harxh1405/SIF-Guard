import uuid
from typing import Dict, Any, Optional, List
from app.schemas.ingestion import NormalizedReport, IngestionMethodType
from app.db.models.report import SafetyReport
from app.services.preprocessing.cleaner import TextCleaner

cleaner = TextCleaner()


class ReportNormalizer:
    """
    Normalizes any raw input channel into a canonical NormalizedReport instance
    prior to NLP feature extraction and pipeline analysis.
    """

    @staticmethod
    def from_text(
        text: str,
        report_id: Optional[str] = None,
        source: str = "manual_narrative",
        report_type: str = "observation",
        site: str = "Not specified",
        metadata: Optional[Dict[str, Any]] = None
    ) -> NormalizedReport:
        rec_id = report_id or f"RAW-{uuid.uuid4().hex[:6].upper()}"
        cleaned = cleaner.preprocess(text.strip())
        return NormalizedReport(
            report_id=rec_id,
            report_type=report_type,
            text=cleaned,
            source=source,
            ingestion_method="manual",
            ocr_used=False,
            ocr_confidence=None,
            site=site,
            metadata=metadata or {"original_source": "manual_narrative"}
        )

    @staticmethod
    def from_ocr(
        extracted_text: str,
        confidence: float,
        source_type: str = "image",  # "image", "pdf_native", "pdf_ocr", "camera"
        report_id: Optional[str] = None,
        filename: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> NormalizedReport:
        rec_id = report_id or f"OCR-{uuid.uuid4().hex[:6].upper()}"
        cleaned = cleaner.preprocess(extracted_text.strip())

        if source_type == "camera" or (filename and "camera" in filename.lower()):
            method: IngestionMethodType = "camera"
            ocr_used = True
        elif source_type == "pdf_native":
            method = "pdf_native"
            ocr_used = False
        elif source_type in ("pdf_ocr", "pdf"):
            method = "pdf_ocr"
            ocr_used = True
        elif source_type == "image":
            method = "image"
            ocr_used = True
        else:
            method = "image"
            ocr_used = True

        meta = metadata or {}
        if filename:
            meta["filename"] = filename

        return NormalizedReport(
            report_id=rec_id,
            report_type="incident_report",
            text=cleaned,
            source="ocr_pipeline",
            ingestion_method=method,
            ocr_used=ocr_used,
            ocr_confidence=confidence if ocr_used else None,
            site="Not specified",
            metadata=meta
        )

    @staticmethod
    def from_dict(
        record: Dict[str, Any],
        source: str = "oil_hsse",
        ingestion_method: IngestionMethodType = "structured"
    ) -> NormalizedReport:
        possible_text_cols = [
            "report_text", "description", "narrative", "observation",
            "incident_description", "event_description", "details", "summary", "text", "report"
        ]
        text_val = ""
        for col in possible_text_cols:
            if col in record and record[col]:
                text_val = str(record[col]).strip()
                break

        rec_id = str(record.get("source_record_id", record.get("report_id", record.get("id", f"REC-{uuid.uuid4().hex[:6].upper()}"))))
        cleaned = cleaner.preprocess(text_val)

        return NormalizedReport(
            report_id=rec_id,
            report_type=str(record.get("report_type", record.get("type", record.get("category", "observation")))),
            text=cleaned,
            source=source,
            ingestion_method=ingestion_method,
            ocr_used=False,
            ocr_confidence=None,
            site=str(record.get("site", record.get("facility", record.get("installation", record.get("field", "Not specified"))))),
            employer=str(record.get("employer", "Oil India Limited")),
            activity=str(record.get("activity")) if record.get("activity") else None,
            hazard=str(record.get("hazard")) if record.get("hazard") else None,
            metadata=record
        )

    @staticmethod
    def to_db_model(report: NormalizedReport) -> SafetyReport:
        return SafetyReport(
            id=f"oil_{report.report_id}" if not str(report.report_id).startswith("oil_") else str(report.report_id),
            source_dataset=report.source,
            source_record_id=report.report_id,
            data_origin="MANUAL_NARRATIVE" if report.ingestion_method == "manual" else report.source,
            report_type=report.report_type or "observation",
            report_text=report.text,
            site=report.site or "Not specified",
            employer=report.employer or "Oil India Limited",
            activity=report.activity,
            hazard=report.hazard,
            raw_data=report.metadata
        )


report_normalizer = ReportNormalizer()
