import io
import json
import pytest
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.report import ImportSummary

client = TestClient(app)


def test_camera_capture_ocr_extract():
    """
    Simulate live camera capture image upload to /api/v1/ocr/extract
    """
    # Create a synthetic photo taken by field camera
    img = Image.new("RGB", (600, 200), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((30, 80), "FIELD CAMERA SNAPSHOT: UNGUARDED PUMP ROTATING SHAFT", fill=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    camera_bytes = buf.getvalue()

    response = client.post(
        "/api/v1/ocr/extract",
        files={"file": ("camera_capture_20260918_163000.jpg", camera_bytes, "image/jpeg")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["source_type"] in ["camera", "image"]
    assert data["ocr_provider"] == "tesseract"
    assert data["confidence"] > 0.0
    assert len(data["text"]) > 0


def test_import_json_single_record():
    """
    Test importing a single JSON safety incident record
    """
    payload = {
        "source_record_id": "TEST-JSON-001",
        "description": "Pressure relief valve RV-102 failed to lift during routine overpressure testing on crude unit.",
        "site": "Digboi Refinery",
        "category": "Unsafe Condition",
        "activity": "Pressure Testing"
    }
    json_bytes = json.dumps(payload).encode("utf-8")

    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("single_incident.json", json_bytes, "application/json")},
        data={"source": "oil_hsse"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["records_received"] == 1
    assert data["records_imported"] + data["duplicates"] == 1
    assert data["first_imported_id"] is not None


def test_import_json_batch_records():
    """
    Test importing a batch array of JSON records
    """
    payload = [
        {
            "source_record_id": "TEST-JSON-BATCH-001",
            "narrative": "Rig floor worker stepped into unguarded rotary table opening while tripping pipe.",
            "site": "Field Location A",
            "category": "Near Miss"
        },
        {
            "source_record_id": "TEST-JSON-BATCH-002",
            "narrative": "High pressure gas leak detected near compressor C-301 suction header.",
            "site": "Field Location B",
            "category": "Incident"
        }
    ]
    json_bytes = json.dumps(payload).encode("utf-8")

    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("batch_incidents.json", json_bytes, "application/json")},
        data={"source": "oil_hsse"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["records_received"] == 2
    assert data["records_imported"] + data["duplicates"] == 2


def test_import_json_nested_structure():
    """
    Test importing nested JSON with a top-level key like 'reports'
    """
    payload = {
        "metadata": {"exported_at": "2026-09-18"},
        "reports": [
            {
                "source_record_id": "TEST-NESTED-001",
                "report_text": "Scaffolding planks were missing toe-boards at elevation 15 meters on pipe rack.",
                "site": "Guwahati Refinery"
            }
        ]
    }
    json_bytes = json.dumps(payload).encode("utf-8")

    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("nested_export.json", json_bytes, "application/json")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["records_received"] == 1


def test_import_csv_batch():
    """
    Test importing a CSV file with multiple incident records
    """
    csv_content = (
        "source_record_id,site,report_text,category\n"
        "TEST-CSV-001,Duliajan Field,Electric cable insulation damaged on 440V distribution box,Unsafe Condition\n"
        "TEST-CSV-002,Moran Field,Crane load line twisted during heavy lift of separator vessel,Near Miss\n"
    )

    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("safety_reports_batch.csv", csv_content.encode("utf-8"), "text/csv")},
        data={"source": "oil_hsse"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["records_received"] == 2
    assert data["records_imported"] + data["duplicates"] == 2


def test_import_invalid_format_error():
    """
    Test invalid CSV/JSON with missing required text column
    """
    csv_content = "id,site,timestamp\n101,Site A,2026-09-18\n"
    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("invalid.csv", csv_content.encode("utf-8"), "text/csv")}
    )

    assert response.status_code == 422
    assert "Missing narrative column" in response.json()["detail"]
