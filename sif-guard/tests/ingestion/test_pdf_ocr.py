import io
import pytest
from app.services.ingestion.normalizer import report_normalizer
from app.schemas.ingestion import NormalizedReport


def test_scanned_pdf_normalizer():
    extracted_ocr_text = "Incident record: Crane lift line snapped during heavy separator placement."
    norm = report_normalizer.from_ocr(
        extracted_text=extracted_ocr_text,
        confidence=0.88,
        source_type="pdf_ocr",
        filename="scanned_investigation.pdf"
    )
    assert isinstance(norm, NormalizedReport)
    assert norm.ingestion_method == "pdf_ocr"
    assert norm.ocr_used is True
    assert norm.ocr_confidence == 0.88
    assert "Crane lift line snapped" in norm.text
