import json
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_jsonl_import():
    lines = [
        json.dumps({"report_id": "JSONL-01", "description": "LOTO applied on booster pump prior to impeller maintenance.", "site": "Site Alpha"}),
        json.dumps({"report_id": "JSONL-02", "description": "Atmospheric testing revealed 0% LEL before hot work permit issued.", "site": "Site Beta"}),
        json.dumps({"report_id": "JSONL-03", "description": "Worker found inside excavation without protective trench box.", "site": "Site Gamma"})
    ]
    jsonl_bytes = "\n".join(lines).encode("utf-8")

    response = client.post(
        "/api/v1/reports/import",
        files={"file": ("reports.jsonl", jsonl_bytes, "application/jsonl")},
        data={"source": "oil_hsse"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["records_received"] == 3
    assert data["records_imported"] + data["duplicates"] == 3
