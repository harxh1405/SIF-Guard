import pytest
from fastapi.testclient import TestClient
from app.main import app as fastapi_app
from app.services.facility.service import facility_service, FACILITY_ZONES_CONFIG
from app.schemas.facility import DemoSimulationRequest


@pytest.fixture
def client():
    with TestClient(fastapi_app) as test_client:
        yield test_client


def test_zone_inference_heuristics():
    # 1. Wellhead
    z_well = facility_service.infer_zone_id(
        report_text="Blowout preventer annular packoff pressure spiked during drilling on wellpad 2.",
        activity="Tripping drill pipe",
        hazard="Pressure kick",
        equipment="BOP wellhead"
    )
    assert z_well == "wellhead-area"

    # 2. Pump Station
    z_pump = facility_service.infer_zone_id(
        report_text="Crude booster centrifugal pump bearing showed severe vibration and overheating.",
        activity="Booster maintenance",
        hazard="Mechanical failure",
        equipment="Centrifugal pump"
    )
    assert z_pump == "pump-station"

    # 3. Tank Farm
    z_tank = facility_service.infer_zone_id(
        report_text="Atmospheric storage tank TK-104 rim seal showed vapor leakage into the bund containment.",
        activity="Hydrocarbon storage transfer",
        hazard="Vapor leak",
        equipment="Storage tank"
    )
    assert z_tank == "tank-farm"

    # 4. Pipeline Corridor
    z_pipe = facility_service.infer_zone_id(
        report_text="Gathering pipeline flange pinhole leak discovered along the main corridor crossing.",
        activity="Pipeline survey",
        hazard="Hydrocarbon release",
        equipment="Gathering line spool"
    )
    assert z_pipe == "pipeline-corridor"

    # 5. Control Room
    z_ctrl = facility_service.infer_zone_id(
        report_text="SCADA operator console experienced intermittent loss of DCS communication with ESD loop.",
        activity="Process monitoring",
        hazard="Alarm failure",
        equipment="SCADA console"
    )
    assert z_ctrl == "control-room"

    # 6. Maintenance Area
    z_maint = facility_service.infer_zone_id(
        report_text="Overhead crane in workshop hoisted a heavy motor with a frayed rigging sling.",
        activity="Workshop overhaul",
        hazard="Suspended load",
        equipment="Overhead crane"
    )
    assert z_maint == "maintenance-area"

    # 7. Loading Area
    z_load = facility_service.infer_zone_id(
        report_text="Road tanker fuel transfer at loading gantry operated with broken static grounding clamp.",
        activity="Truck loading",
        hazard="Static discharge",
        equipment="Loading gantry rack"
    )
    assert z_load == "loading-area"


def test_facility_overview_endpoint(client):
    response = client.get("/api/v1/facility/overview")
    assert response.status_code == 200
    data = response.json()

    assert "overall_risk_score" in data
    assert 0 <= data["overall_risk_score"] <= 100
    assert data["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert "zones" in data
    assert len(data["zones"]) == 7

    zone_ids = [z["id"] for z in data["zones"]]
    expected_ids = ["wellhead-area", "pump-station", "tank-farm", "pipeline-corridor", "control-room", "maintenance-area", "loading-area"]
    for eid in expected_ids:
        assert eid in zone_ids

    # Check first zone structure
    z0 = data["zones"][0]
    assert "risk_score" in z0
    assert "risk_factors" in z0
    assert "recommended_actions" in z0
    assert "svg_center" in z0
    assert "x" in z0["svg_center"] and "y" in z0["svg_center"]


def test_zone_details_endpoint(client):
    # Valid zone
    response = client.get("/api/v1/facility/zones/tank-farm")
    assert response.status_code == 200
    zone = response.json()
    assert zone["id"] == "tank-farm"
    assert zone["name"] == "Tank Farm"
    assert len(zone["recommended_actions"]) >= 1

    # Invalid zone 404
    bad_res = client.get("/api/v1/facility/zones/non-existent-zone-99")
    assert bad_res.status_code == 404


def test_demo_scenarios_endpoint(client):
    response = client.get("/api/v1/facility/demo/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 5
    assert scenarios[0]["id"].startswith("demo-")
    assert "simulated_text" in scenarios[0]


def test_demo_simulation_and_reset_flow(client):
    # Reset initially
    reset_res = client.post("/api/v1/facility/demo/reset")
    assert reset_res.status_code == 200

    # Simulate a scenario
    sim_res = client.post("/api/v1/facility/demo/simulate", json={
        "scenario_id": "demo-tank-farm-pressure"
    })
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["success"] is True
    assert sim_data["affected_zone_id"] == "tank-farm"
    assert sim_data["incident"]["zone_id"] == "tank-farm"
    assert sim_data["incident"]["is_demo"] is True

    # Check updated overview reflects the new incident
    summary = sim_data["updated_facility_summary"]
    tank_zone = next(z for z in summary["zones"] if z["id"] == "tank-farm")
    assert tank_zone["total_incidents"] >= 1
    assert any(i["id"] == sim_data["incident"]["id"] for i in tank_zone["incidents"])

    # Simulate custom incident
    custom_res = client.post("/api/v1/facility/demo/simulate", json={
        "custom_text": "Severe high pressure kick at drilling wellhead floor with BOP alarm sound.",
        "custom_title": "Custom High Pressure Kick",
        "severity": "CRITICAL"
    })
    assert custom_res.status_code == 200
    custom_data = custom_res.json()
    assert custom_data["affected_zone_id"] == "wellhead-area"

    # Reset demo data
    reset_res2 = client.post("/api/v1/facility/demo/reset")
    assert reset_res2.status_code == 200
    reset_summary = reset_res2.json()
    # Confirm demo items are cleared
    assert not any(i.get("is_demo") for i in reset_summary["recent_timeline"])
