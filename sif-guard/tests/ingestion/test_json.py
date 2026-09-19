import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.ingestion.normalizer import report_normalizer

client = TestClient(app)


def test_single_json_object_import():
    payload = {
        "report_id": "JSON-SINGLE-01",
        "report_type": "near_miss",
        "report_text": "Forklift backed into chemical storage area without sound horn or spotter.",
        "site": "Warehouse 4"
    }
    json_bytes = json.dumps(payload).encode("utf-8")
    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("incident.json", json_bytes, "application/json")},
        data={"source": "oil_hsse"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["records_received"] == 1
    assert data["records_imported"] + data["duplicates"] == 1


def test_json_array_import():
    payload = [
        {
            "report_id": "JSON-ARR-01",
            "report_type": "observation",
            "narrative": "Eye wash station inspection passed with good water pressure.",
            "site": "Unit 1"
        },
        {
            "report_id": "JSON-ARR-02",
            "report_type": "incident",
            "narrative": "Steam trap failed open discharging high pressure steam onto walkway.",
            "site": "Unit 2"
        }
    ]
    json_bytes = json.dumps(payload).encode("utf-8")
    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("batch_reports.json", json_bytes, "application/json")},
        data={"source": "oil_hsse"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["records_received"] == 2
    assert data["records_imported"] + data["duplicates"] == 2


def test_malformed_json_error():
    malformed = b"{\"report_id\": \"INVALID\", broken_json"
    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("corrupt.json", malformed, "application/json")}
    )
    assert response.status_code == 400
    assert "Failed to parse" in response.json()["detail"]
