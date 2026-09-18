import pytest
import requests
from app.db.database import SessionLocal
from app.db.models import SafetyReport
from app.services.extraction.service import extraction_service
# Imports clean

BASE_URL = "http://localhost:8000/api/v1"

NARRATIVE_A_HEIGHT = """During maintenance work on the upper section of a processing unit, a technician climbed onto an elevated platform approximately 7 meters above ground to inspect a pipe support. The platform had an unprotected edge and no guardrail was installed along one section. The technician was not wearing a safety harness and no lifeline had been connected. The worker was positioned close to the exposed edge while carrying out the inspection. The required fall protection controls had not been established before the work began."""

NARRATIVE_B_PRESSURE = """During routine process piping maintenance, a technician prepared to loosen bolts on a pipe flange downstream of an isolation valve. The upstream valve was closed, but zero pressure verification was not performed before breaking the flange connection. Residual line pressure remained trapped in the section. When the flange was unbolted, pressurized liquid sprayed out toward the technician. Isolation had not been verified prior to starting line breaking."""

NARRATIVE_C_MACHINE = """During routine maintenance of a centrifugal pump, a technician removed the protective guard from the rotating coupling to inspect the equipment. The pump was restarted while the guard was still removed. The technician was working within close proximity to the exposed rotating coupling and could have been caught in the moving equipment. No machine guarding was in place when the equipment was operated."""

NARRATIVE_D_OFFICE = """During a daily walkthrough of the administrative building, an employee noticed a loose armrest on an office chair in the second-floor conference room. The armrest wobbled slightly when pressed. No injuries occurred, and the chair was tagged for maintenance."""

NARRATIVE_E_MACHINE_REPEAT = NARRATIVE_C_MACHINE


def test_sequential_isolation_five_runs():
    """
    Executes the 5 sequential tests (A, B, C, D, E) via HTTP API.
    Verifies data flow isolation, report ID uniqueness, and field integrity.
    """
    history_report_ids = []

    tests = [
        ("TEST A (Height)", NARRATIVE_A_HEIGHT, "work at height", "fall from height", "fall protection"),
        ("TEST B (Pressure Isolation)", NARRATIVE_B_PRESSURE, "pressurized system maintenance", "pressure release", "pressure isolation"),
        ("TEST C (Machine Guarding)", NARRATIVE_C_MACHINE, "machinery maintenance", "rotating machinery", "machine guarding"),
        ("TEST D (Office Observation)", NARRATIVE_D_OFFICE, "ergonomic / minor office hazard", "minimal hazard exposure"),
        ("TEST E (Machine Guarding Repeat)", NARRATIVE_E_MACHINE_REPEAT, "machinery maintenance", "rotating machinery", "machine guarding"),
    ]

    for step_name, narrative, expected_activity_substr, expected_hazard_or_exp_substr, *extra_checks in tests:
        print(f"\n==========================================")
        print(f"RUNNING: {step_name}")
        print(f"==========================================")

        # 1. Ingest/Import Report via API
        import_resp = requests.post(
            f"{BASE_URL}/reports/import",
            files={"file": ("narrative.txt", narrative.encode("utf-8"), "text/plain")},
            data={"source": "oil_hsse"}
        )
        assert import_resp.status_code == 200, f"Import failed: {import_resp.text}"
        import_data = import_resp.json()

        report_id = import_data.get("first_imported_id")
        assert report_id is not None, "first_imported_id missing from import response"
        assert report_id not in history_report_ids, f"Report ID {report_id} was reused!"
        history_report_ids.append(report_id)

        print(f"-> Generated report_id: {report_id}")

        # 2. Run Analysis via API
        analysis_resp = requests.post(f"{BASE_URL}/reports/{report_id}/analyze")
        assert analysis_resp.status_code == 200, f"Analysis failed: {analysis_resp.text}"
        analysis = analysis_resp.json()

        # 3. Assert Trace ID & Report ID match
        assert analysis.get("report_id") == report_id, f"Analysis report_id mismatch: expected {report_id}, got {analysis.get('report_id')}"
        trace_id = analysis.get("trace_id")
        assert trace_id is not None, "trace_id missing from analysis response"
        print(f"-> Trace ID: {trace_id}")

        ext = analysis.get("extraction", {})
        act = (ext.get("activity") or "").lower()
        haz = (ext.get("hazard") or "").lower()
        exp = (ext.get("exposure") or "").lower()
        bar = (ext.get("barrier") or "").lower()

        print(f"-> Extracted Activity: {ext.get('activity')}")
        print(f"-> Extracted Hazard: {ext.get('hazard')}")
        print(f"-> Extracted Barrier: {ext.get('barrier')}")
        print(f"-> Extracted Barrier Failure: {ext.get('barrier_failure')}")
        print(f"-> LSR Matches: {analysis.get('life_saving_rules')}")

        # Cross-Contamination Assertions
        if "Height" in step_name:
            assert "height" in act or "height" in haz or "fall" in exp
            assert "pressure" not in act and "machine" not in act
        elif "Pressure" in step_name:
            assert "pressur" in act or "pressur" in haz
            assert "height" not in act and "machine" not in act
        elif "Machine" in step_name:
            assert "machinery" in act or "rotating" in haz
            assert "height" not in act and "fall" not in haz and "pressur" not in act
        elif "Office" in step_name:
            assert "office" in haz or "minimal" in exp or "ergonomic" in haz
            assert "fall protection" not in bar and "pressure isolation" not in bar and "machine guarding" not in bar

    print("\n==========================================")
    print("ALL 5 SEQUENTIAL ISOLATION TESTS PASSED 100%")
    print("==========================================")


if __name__ == "__main__":
    test_sequential_isolation_five_runs()
