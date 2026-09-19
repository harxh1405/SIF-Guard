import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_csv_single_and_batch_import():
    csv_data = (
        "source_record_id,site,report_text,report_type\n"
        "CSV-001,Duliajan Field,Atmospheric gas test verified safe before tank entry,observation\n"
        "CSV-002,Moran Field,Lifting sling damaged during rig mast movement,near_miss\n"
    )
    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("reports.csv", csv_data.encode("utf-8"), "text/csv")},
        data={"source": "oil_hsse"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["records_received"] == 2
    assert data["records_imported"] + data["duplicates"] == 2


def test_csv_missing_narrative_error():
    broken_csv = "id,site,date\n101,Site A,2026-09-19\n"
    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("missing_cols.csv", broken_csv.encode("utf-8"), "text/csv")}
    )
    assert response.status_code == 422
    assert "Missing narrative column" in response.json()["detail"]
