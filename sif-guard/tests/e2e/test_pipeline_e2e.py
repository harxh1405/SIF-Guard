import uuid
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app as fastapi_app
from app.db.database import Base, engine, SessionLocal
from app.db.models.report import SafetyReport
from app.db.models.lsr import LifeSavingRule
from app.services.lsr.matcher import IOGP_LSR_DEFINITIONS


@pytest.fixture(scope="module", autouse=True)
def setup_e2e_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(LifeSavingRule).count() == 0:
            for rule_def in IOGP_LSR_DEFINITIONS:
                rule_obj = LifeSavingRule(
                    id=f"lsr_{rule_def['code']}",
                    rule_code=rule_def["code"],
                    rule_name=rule_def["name"],
                    description=rule_def["description"],
                    keywords=rule_def["keywords"]
                )
                db.add(rule_obj)
            db.commit()
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    with TestClient(fastapi_app) as test_client:
        yield test_client


def test_e2e_confined_space_pipeline(client):
    """E2E flow: Ingest severe confined space report, analyze it, verify response and DB persistence."""
    unique_key = f"e2e_cs_{uuid.uuid4().hex[:8]}"
    payload = [{
        "id": unique_key,
        "description": "Technician entered nitrogen vessel without gas testing or entry permit. Oxygen deficiency detected.",
        "site": "Offshore Platform Bravo",
        "department": "Production Operations",
        "severity": "High"
    }]
    file_bytes = bytes(json.dumps(payload), "utf-8")

    # 1. Ingestion via API
    resp = client.post(
        "/api/v1/reports/import",
        files={"file": (f"{unique_key}.json", file_bytes, "application/json")},
        data={"source": "oil_hsse"}
    )
    assert resp.status_code == 200
    report_data = resp.json()
    assert report_data["records_imported"] >= 1
    report_id = f"oil_{unique_key}"

    # 2. Pipeline Analysis via API
    anl_resp = client.post(f"/api/v1/reports/{report_id}/analyze")
    assert anl_resp.status_code == 200
    anl_data = anl_resp.json()

    assert anl_data["report_id"] == report_id
    assert anl_data["trace_id"] is not None

    # Extraction assertions
    extraction = anl_data["extraction"]
    assert extraction["activity"] is not None
    assert extraction["barrier_failure"] is not None

    # SIF ensemble assertions
    sif = anl_data["sif"]
    assert sif["classification"] == "SIF_POTENTIAL"
    assert sif["score"] >= 0.70
    assert "model_breakdown" in sif
    assert "xgboost_probability" in sif["model_breakdown"]
    assert "catboost_probability" in sif["model_breakdown"]
    assert "ensemble_probability" in sif["model_breakdown"]
    assert len(sif["top_factors"]) >= 1

    # Life saving rules mapping
    lsr = anl_data["life_saving_rules"]
    assert len(lsr) >= 1
    assert any("Confined Space" in r["rule_name"] for r in lsr)

    # Fingerprint assertions
    fp = anl_data["fingerprint"]
    assert fp["activity"] is not None or fp["hazard"] is not None


def test_e2e_low_risk_office_pipeline(client):
    """E2E flow: Low-risk office observation through full pipeline must score <= 0.15."""
    unique_key = f"e2e_off_{uuid.uuid4().hex[:8]}"
    payload = [{
        "id": unique_key,
        "description": "Routine safety walk: noticed loose screw on desk drawer handle in administrative office building. No injury.",
        "site": "Corporate HQ",
        "department": "HR/Admin"
    }]
    file_bytes = bytes(json.dumps(payload), "utf-8")

    resp = client.post(
        "/api/v1/reports/import",
        files={"file": (f"{unique_key}.json", file_bytes, "application/json")},
        data={"source": "oil_hsse"}
    )
    assert resp.status_code == 200
    report_id = f"oil_{unique_key}"

    anl_resp = client.post(f"/api/v1/reports/{report_id}/analyze")
    assert anl_resp.status_code == 200
    anl_data = anl_resp.json()

    sif = anl_data["sif"]
    assert sif["classification"] == "NON_SIF"
    assert sif["score"] <= 0.15
    assert anl_data["extraction"]["barrier_failure"] is None or anl_data["extraction"]["barrier_failure"] == ""
