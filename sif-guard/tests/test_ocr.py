import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ocr.service import ocr_service
from app.services.ocr.schemas import OCRResultSchema
from app.services.ocr.preprocessing import normalize_ocr_text

client = TestClient(app)


def test_normalize_ocr_text():
    raw_text = "  LOTO   procedure   was   bypassed  \n\n  H2S gas test missing  "
    norm = normalize_ocr_text(raw_text)
    assert "LOTO procedure was bypassed" in norm
    assert "H2S gas test missing" in norm


def test_ocr_service_empty_file():
    res = ocr_service.extract(b"", "empty.jpg")
    assert isinstance(res, OCRResultSchema)
    assert res.requires_verification is True
    assert "Uploaded file is empty" in res.warnings[0]


def test_ocr_service_unsupported_extension():
    res = ocr_service.extract(b"123", "document.docx")
    assert res.requires_verification is True
    assert "Unsupported file format" in res.warnings[0]


def test_ocr_api_endpoint_empty_file():
    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("empty.txt", b"", "text/plain")}
    )
    assert response.status_code == 400


def test_ocr_api_endpoint_unsupported_format():
    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("test.docx", b"some bytes", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]
