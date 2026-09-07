import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "SIF-Guard" in data["service"]


def test_lsr_rules_endpoint():
    response = client.get("/api/v1/lsr/rules")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 9


def test_lsr_map_endpoint():
    response = client.post("/api/v1/lsr/map", json={"text": "Worker entered vessel without gas testing."})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["rule_name"] == "Confined Space"


def test_dashboard_summary_endpoint():
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_reports" in data
    assert "sif_precursor_density" in data
