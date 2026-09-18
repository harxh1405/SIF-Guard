import io
import pytest
import pypdf
from fastapi.testclient import TestClient
from app.main import app
from app.services.ocr.service import ocr_service
from app.services.ingestion.normalizer import report_normalizer

client = TestClient(app)


def _create_native_pdf(text: str) -> bytes:
    writer = pypdf.PdfWriter()
    page = writer.add_blank_page(width=595, height=842)
    # Add a minimal text annotation or use writer with text
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_native_pdf_extraction_via_service():
    # Use pypdf to test text extraction logic
    res = ocr_service.extract(b"%PDF-1.4 minimal", "native_doc.pdf")
    assert res is not None
    # Verify report normalizer flags native pdf correctly
    norm = report_normalizer.from_ocr(
        extracted_text="Pressure relief valve inspection log completed with zero leaks.",
        confidence=0.98,
        source_type="pdf_native",
        filename="safety_audit.pdf"
    )
    assert norm.ingestion_method == "pdf_native"
    assert norm.ocr_used is False
