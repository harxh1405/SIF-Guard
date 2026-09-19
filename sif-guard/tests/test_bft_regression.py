import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

BFT_API_TEST_CASES = [
    {
        "id": "BFT-001",
        "text": "During maintenance of a centrifugal pump, the worker started removing the coupling guard without applying lockout/tagout. The pump was not electrically isolated and another operator was able to start the equipment from the control panel.",
        "expected_sif_min": 0.40,
    },
    {
        "id": "BFT-002",
        "text": "A technician opened a process line after the valve was closed, but zero pressure was not verified before loosening the flange. Residual pressure was released unexpectedly.",
        "expected_sif_min": 0.40,
    },
    {
        "id": "BFT-003",
        "text": "A worker entered a storage tank for cleaning without atmospheric testing. No oxygen, H2S (Hydrogen Sulfide), or LEL (Lower Explosive Limit) measurement was performed before entry.",
        "expected_sif_min": 0.40,
    },
    {
        "id": "BFT-004",
        "text": "A worker was performing maintenance approximately 8 meters above ground on an elevated platform. No safety harness or lifeline was provided, and the worker was operating close to the unprotected edge.",
        "expected_sif_min": 0.40,
    },
    {
        "id": "BFT-005",
        "text": "During operation of a grinding machine, the machine guard had been removed to make access easier. The equipment continued to operate without the guard installed.",
        "expected_sif_min": 0.40,
    },
    {
        "id": "BFT-006",
        "text": "A crane was lifting a heavy valve while workers were standing underneath the suspended load. The lifting area had not been barricaded and no exclusion zone was established.",
        "expected_sif_min": 0.40,
    },
    {
        "id": "BFT-007",
        "text": "Welding was performed near hydrocarbon-containing equipment without completing the required gas test. No valid hot-work permit was available at the work location.",
        "expected_sif_min": 0.40,
    },
    {
        "id": "BFT-008",
        "text": "Workers entered a 2.5-meter-deep excavation without shoring or a suitable protective system. The excavation walls showed signs of instability.",
        "expected_sif_min": 0.40,
    },
    {
        "id": "BFT-009",
        "text": "Maintenance work was being performed near a moving vehicle route. The work area was not barricaded and pedestrians were allowed to enter the vehicle operating zone.",
        "expected_sif_min": 0.40,
    },
    {
        "id": "BFT-010",
        "text": "A worker began maintenance on a pressurized system without confirming that the upstream valve was isolated and the system had been depressurized. No independent isolation verification was performed.",
        "expected_sif_min": 0.40,
    }
]

LOW_RISK_CONTROL_CASES = [
    {
        "id": "CTRL-001",
        "text": "Minor office ergonomics report regarding computer monitor height adjustment for desk employee.",
        "expected_max_sif": 0.40,
        "expected_classification": "NON_SIF"
    },
    {
        "id": "CTRL-002",
        "text": "Frayed extension cord identified during routine pre-work hand tool inspection and immediately removed from service.",
        "expected_max_sif": 0.40,
        "expected_classification": "NON_SIF"
    }
]


def test_bft_regression_complete_api_pipeline():
    for case in BFT_API_TEST_CASES:
        cid = case["id"]
        unique_src_id = f"REC-{cid}_{uuid.uuid4().hex[:6]}"
        payload = {
            "source_dataset": "oil_hsse",
            "source_record_id": unique_src_id,
            "report_text": case["text"]
        }

        csv_content = f"source_record_id,report_text\n{payload['source_record_id']},\"{payload['report_text']}\""
        imp_resp = client.post(
            "/api/v1/reports/import",
            files={"file": (f"{cid}.csv", csv_content.encode("utf-8"), "text/csv")},
            data={"source": "oil_hsse"}
        )
        assert imp_resp.status_code == 200

        rec_id = f"oil_{payload['source_record_id']}"
        an_resp = client.post(f"/api/v1/reports/{rec_id}/analyze")
        assert an_resp.status_code == 200
        
        data = an_resp.json()
        assert "extraction" in data
        assert "sif" in data
        assert "life_saving_rules" in data
        assert "fingerprint" in data
        assert data["sif"]["model_type"] in ["xgboost", "ensemble"]
        assert data["sif"]["score"] >= case["expected_sif_min"]


def test_low_risk_control_cases_complete_api_pipeline():
    for case in LOW_RISK_CONTROL_CASES:
        cid = case["id"]
        unique_src_id = f"REC-{cid}_{uuid.uuid4().hex[:6]}"
        payload = {
            "source_record_id": unique_src_id,
            "report_text": case["text"]
        }

        csv_content = f"source_record_id,report_text\n{payload['source_record_id']},\"{payload['report_text']}\""
        imp_resp = client.post(
            "/api/v1/reports/import",
            files={"file": (f"{cid}.csv", csv_content.encode("utf-8"), "text/csv")},
            data={"source": "oil_hsse"}
        )
        assert imp_resp.status_code == 200

        rec_id = f"oil_{payload['source_record_id']}"
        an_resp = client.post(f"/api/v1/reports/{rec_id}/analyze")
        assert an_resp.status_code == 200

        data = an_resp.json()
        assert data["sif"]["classification"] == case["expected_classification"]
        assert data["sif"]["score"] <= case["expected_max_sif"]
