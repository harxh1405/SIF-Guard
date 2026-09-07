import uuid
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


@pytest.mark.parametrize("bft_id,text,expected_barrier", [
    ("BFT-001", "During maintenance of a centrifugal pump, the worker started removing the coupling guard without applying lockout/tagout. The pump was not electrically isolated and another operator was able to start the equipment from the control panel.", "energy isolation (LOTO)"),
    ("BFT-002", "A technician opened a process line after the valve was closed, but zero pressure was not verified before loosening the flange. Residual pressure was released unexpectedly.", "pressure isolation / depressurization"),
    ("BFT-005", "During operation of a grinding machine, the machine guard had been removed to make access easier. The equipment continued to operate without the guard installed.", "machine guarding"),
    ("BFT-008", "Workers entered a 2.5-meter-deep excavation without shoring or a suitable protective system. The excavation walls showed signs of instability.", "excavation protection"),
    ("BFT-009", "Maintenance work was being performed near a moving vehicle route. The work area was not barricaded and pedestrians were allowed to enter the vehicle operating zone.", "exclusion zone / barricading"),
    ("BFT-010", "A worker began maintenance on a pressurized system without confirming that the upstream valve was isolated and the system had been depressurized. No independent isolation verification was performed.", "pressure isolation / depressurization"),
])
def test_bft_analysis_end_to_end(bft_id, text, expected_barrier):
    unique_key = f"{bft_id.lower()}_{uuid.uuid4().hex[:8]}"
    json_data = [{
        "id": unique_key,
        "description": text,
        "site": "Test Facility",
        "type": "near_miss"
    }]
    
    file_bytes = bytes(str(json_data).replace("'", '"'), 'utf-8')
    import_res = client.post(
        "/api/v1/reports/import",
        files={"file": (f"{unique_key}.json", file_bytes, "application/json")},
        data={"source": "oil_hsse"}
    )
    assert import_res.status_code == 200
    
    # Analyze the imported report
    analyze_res = client.post(f"/api/v1/reports/oil_{unique_key}/analyze")
    assert analyze_res.status_code == 200
    
    payload = analyze_res.json()
    assert payload["report_id"] == f"oil_{unique_key}"
    assert payload["extraction"]["barrier"] == expected_barrier
    assert payload["extraction"]["barrier_failure"] is not None
    assert payload["fingerprint"]["barrier"] == expected_barrier
