import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.ingestion import NormalizedReport
from app.services.ingestion.normalizer import report_normalizer

client = TestClient(app)


def test_manual_text_normalizer():
    raw_narrative = "Worker entered tank for visual inspection without gas check or ventilation."
    norm = report_normalizer.from_text(
        text=raw_narrative,
        report_id="MAN-001",
        source="manual_narrative",
        site="Digboi Refinery"
    )
    assert isinstance(norm, NormalizedReport)
    assert norm.report_id == "MAN-001"
    assert norm.ingestion_method == "manual"
    assert norm.ocr_used is False
    assert norm.ocr_confidence is None
    assert "Worker entered tank" in norm.text


def test_manual_text_api_import():
    """
    Test direct narrative text submission via API without passing through OCR.
    """
    narrative = "Technician noticed loose safety pin on scaffolding tower during routine round."
    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("manual_narrative.txt", narrative.encode("utf-8"), "text/plain")},
        data={"source": "manual_narrative"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["records_received"] == 1
    assert data["records_imported"] + data["duplicates"] == 1
    assert data["first_imported_id"] is not None

    # Fetch imported report to verify text and metadata
    report_resp = client.get(f"/api/v1/reports/{data['first_imported_id']}")
    assert report_resp.status_code == 200
    rep = report_resp.json()
    assert "loose safety pin on scaffolding" in rep["report_text"]
