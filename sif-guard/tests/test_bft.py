import pytest
from app.services.extraction.service import extraction_service
from app.schemas.analysis import ExtractionSchema


# BFT Scenario Data
BFT_CASES = {
    "BFT-001": {
        "text": "During maintenance of a centrifugal pump, the worker started removing the coupling guard without applying lockout/tagout. The pump was not electrically isolated and another operator was able to start the equipment from the control panel.",
        "expected_barrier": "energy isolation (LOTO)",
        "expected_barrier_failure": "energy isolation bypassed, missing, or not verified"
    },
    "BFT-002": {
        "text": "A technician opened a process line after the valve was closed, but zero pressure was not verified before loosening the flange. Residual pressure was released unexpectedly.",
        "expected_barrier": "pressure isolation / depressurization",
        "expected_barrier_failure": "pressure isolation or zero-energy verification not confirmed"
    },
    "BFT-003": {
        "text": "A worker entered a storage tank for cleaning without atmospheric testing. No oxygen, H2S (Hydrogen Sulfide), or LEL (Lower Explosive Limit) measurement was performed before entry.",
        "expected_barrier": "atmospheric testing",
        "expected_barrier_failure": "atmospheric testing missing or not performed"
    },
    "BFT-004": {
        "text": "A worker was performing maintenance approximately 8 meters above ground on an elevated platform. No safety harness or lifeline was provided, and the worker was operating close to the unprotected edge.",
        "expected_barrier": "fall protection system",
        "expected_barrier_failure": "fall protection missing or not used",
        "expected_activity": "work at height",
        "expected_hazard": "fall from height",
        "expected_exposure": "worker exposed to unprotected fall hazard"
    },
    "BFT-005": {
        "text": "During operation of a grinding machine, the machine guard had been removed to make access easier. The equipment continued to operate without the guard installed.",
        "expected_barrier": "machine guarding",
        "expected_barrier_failure": "machine guard removed, missing, or bypassed",
        "expected_activity": "machinery operation / grinding",
        "expected_hazard": "rotating machinery / caught-in",
        "expected_potential_consequence": "severe / fatal caught-in or struck-by injury"
    },
    "BFT-006": {
        "text": "A crane was lifting a heavy valve while workers were standing underneath the suspended load. The lifting area had not been barricaded and no exclusion zone was established.",
        "expected_barrier": "exclusion zone / barricading",
        "expected_barrier_failure": "exclusion zone or barricading missing/breached",
        "expected_activity": "lifting operation",
        "expected_hazard": "suspended load / struck-by",
        "expected_exposure": "worker in line of fire under suspended load"
    },
    "BFT-007": {
        "text": "Welding was performed near hydrocarbon-containing equipment without completing the required gas test. No valid hot-work permit was available at the work location.",
        "expected_barrier_options": ["hot work permit", "gas testing"],
        "expected_activity": "hot work",
        "expected_hazard": "fire / explosion / flammable atmosphere"
    },
    "BFT-008": {
        "text": "Workers entered a 2.5-meter-deep excavation without shoring or a suitable protective system. The excavation walls showed signs of instability.",
        "expected_barrier": "excavation protection",
        "expected_barrier_failure": "shoring / excavation protective system missing",
        "expected_activity": "excavation work",
        "expected_hazard": "excavation collapse / cave-in",
        "expected_exposure": "worker exposed to excavation collapse",
        "expected_potential_consequence": "fatal crush / burial"
    },
    "BFT-009": {
        "text": "Maintenance work was being performed near a moving vehicle route. The work area was not barricaded and pedestrians were allowed to enter the vehicle operating zone.",
        "expected_barrier": "exclusion zone / barricading",
        "expected_barrier_failure": "exclusion zone or barricading missing/breached",
        "expected_activity": "vehicle / pedestrian interaction",
        "expected_hazard": "vehicle-pedestrian interaction / struck-by",
        "expected_exposure": "pedestrian exposed to moving vehicle",
        "expected_potential_consequence": "fatal struck-by / crush injury"
    },
    "BFT-010": {
        "text": "A worker began maintenance on a pressurized system without confirming that the upstream valve was isolated and the system had been depressurized. No independent isolation verification was performed.",
        "expected_barrier": "pressure isolation / depressurization",
        "expected_barrier_failure": "pressure isolation or zero-energy verification not confirmed",
        "expected_activity": "pressurized system maintenance",
        "expected_hazard": "pressure release",
        "expected_energy_source": "pressurized fluid / gas energy"
    }
}


@pytest.mark.parametrize("bft_id,case", BFT_CASES.items())
def test_barrier_failure_scenarios(bft_id, case):
    extraction = extraction_service.extract(case["text"])
    
    # Assert barrier category & failure
    if "expected_barrier" in case:
        assert extraction.barrier == case["expected_barrier"], f"[{bft_id}] Barrier mismatch"
    elif "expected_barrier_options" in case:
        assert extraction.barrier in case["expected_barrier_options"], f"[{bft_id}] Barrier not in expected options"

    if "expected_barrier_failure" in case:
        assert extraction.barrier_failure == case["expected_barrier_failure"], f"[{bft_id}] Barrier failure mismatch"
    else:
        assert extraction.barrier_failure is not None, f"[{bft_id}] Expected non-null barrier_failure"

    # Optional assertions for 10-dimension attributes
    if "expected_activity" in case:
        assert extraction.activity == case["expected_activity"], f"[{bft_id}] Activity mismatch"
    if "expected_hazard" in case:
        assert extraction.hazard == case["expected_hazard"], f"[{bft_id}] Hazard mismatch"
    if "expected_exposure" in case:
        assert extraction.exposure == case["expected_exposure"], f"[{bft_id}] Exposure mismatch"
    if "expected_energy_source" in case:
        assert extraction.energy_source == case["expected_energy_source"], f"[{bft_id}] Energy source mismatch"
    if "expected_potential_consequence" in case:
        assert extraction.potential_consequence == case["expected_potential_consequence"], f"[{bft_id}] Consequence mismatch"
