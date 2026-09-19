import pytest
from app.services.extraction.service import extraction_service
from app.services.sif.ensemble import ensemble_sif_classifier
from app.services.lsr.matcher import lsr_matcher


# ==============================================================================
# 20 CANONICAL SIF-GUARD TEST NARRATIVES
# ==============================================================================

def test_01_confined_space_missing_gas_testing():
    narrative = (
        "During maintenance inside a storage vessel, two technicians entered the confined space to inspect an internal valve. "
        "Atmospheric testing was not performed before entry, and no H2S or oxygen measurement was taken. "
        "The required gas monitor was not available at the entry point. "
        "One technician was already inside when a strong gas odor was noticed. "
        "The supervisor stopped the work and evacuated the vessel."
    )
    ext = extraction_service.extract(narrative)
    assert ext.activity == "confined space entry"
    assert "toxic gas" in (ext.hazard or "") or "hazardous atmosphere" in (ext.hazard or "")
    assert "toxic gas" in (ext.exposure or "") or "oxygen deficiency" in (ext.exposure or "")
    assert ext.barrier == "atmospheric testing"
    assert ext.barrier_failure is not None
    assert "atmospheric testing" in ext.barrier_failure or "gas testing" in ext.barrier_failure
    assert "toxic exposure" in (ext.potential_consequence or "") or "asphyxiation" in (ext.potential_consequence or "")

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Confined Space" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70
    assert res.model_breakdown["ensemble_probability"] == res.score
    assert abs(res.model_breakdown["ensemble_probability"] - 0.5 * (res.model_breakdown["xgboost_probability"] + res.model_breakdown["catboost_probability"])) < 1e-3


def test_02_confined_space_controls_effective():
    narrative = (
        "Before entering a storage vessel, the confined-space team completed atmospheric testing and confirmed acceptable oxygen and H2S levels. "
        "The entry permit was verified, continuous gas monitoring was established, and an attendant remained at the entry point throughout the inspection. "
        "No unsafe condition was observed."
    )
    ext = extraction_service.extract(narrative)
    assert ext.activity == "confined space entry"
    assert ext.barrier_failure is None
    assert ext.exposure == "controlled"

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Confined Space" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "NON_SIF"
    assert res.score < 0.30


def test_03_loto_failure():
    narrative = (
        "During maintenance on a centrifugal pump, the technician began work without applying lockout/tagout. "
        "The electrical supply remained connected and the pump unexpectedly started when another operator attempted to restart the equipment. "
        "The technician immediately moved away from the rotating coupling."
    )
    ext = extraction_service.extract(narrative)
    assert "maintenance" in (ext.activity or "")
    assert any(h in (ext.hazard or "") for h in ["rotating", "caught-in", "energized"])
    assert ext.barrier_failure is not None
    assert "energy isolation" in ext.barrier_failure or "loto" in ext.barrier_failure

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Energy Isolation" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_04_loto_successfully_applied():
    narrative = (
        "Before maintenance began on the centrifugal pump, the electrical supply was isolated and locked out. "
        "The technician verified zero energy and attempted a controlled start to confirm that the equipment could not operate. "
        "The pump remained isolated throughout the maintenance activity."
    )
    ext = extraction_service.extract(narrative)
    assert ext.barrier_failure is None

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Energy Isolation" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "NON_SIF"
    assert res.score < 0.30


def test_05_pressure_isolation_failure():
    narrative = (
        "During maintenance on a pressure vessel, the process line was not isolated before the connection was opened. "
        "Residual pressure remained in the system and the technician had not verified zero pressure. "
        "When the flange was loosened, pressurized fluid escaped unexpectedly and the technician moved away from the release point."
    )
    ext = extraction_service.extract(narrative)
    assert ext.barrier_failure is not None
    assert "pressure isolation" in ext.barrier_failure or "zero-energy" in ext.barrier_failure or "isolation" in ext.barrier_failure
    assert ext.exposure == "line of fire"
    assert "pressure" in (ext.potential_consequence or "") or "injury" in (ext.potential_consequence or "")

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Energy Isolation" in lsrs or "Line of Fire" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_06_machine_guarding():
    narrative = (
        "During routine maintenance of a centrifugal pump, a technician removed the protective coupling guard to inspect the shaft alignment. "
        "The pump was restarted while the guard was still removed. "
        "The technician was working close to the exposed rotating shaft and could have been caught in the moving equipment."
    )
    ext = extraction_service.extract(narrative)
    assert ext.barrier_failure is not None
    assert "machine guard" in ext.barrier_failure or "guard" in ext.barrier_failure
    assert "amputation" in (ext.potential_consequence or "") or "injury" in (ext.potential_consequence or "")

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_07_lifting_worker_under_suspended_load():
    narrative = (
        "During replacement of a heavy valve, a crane lifted the component over the maintenance area. "
        "Several workers entered the area underneath the suspended load while the lift was in progress. "
        "No exclusion zone had been established and the barricade was missing on one side. "
        "The lifting supervisor stopped the operation before the valve was lowered."
    )
    ext = extraction_service.extract(narrative)
    assert "lifting" in (ext.activity or "")
    assert "suspended load" in (ext.hazard or "")
    assert "line of fire" in (ext.exposure or "")
    assert ext.barrier_failure is not None
    assert "exclusion zone" in ext.barrier_failure or "barricad" in ext.barrier_failure
    assert "crush" in (ext.potential_consequence or "") or "fatality" in (ext.potential_consequence or "")

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Safe Mechanical Lifting" in lsrs or "Line of Fire" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_08_lifting_controls_working():
    narrative = (
        "A 2-tonne pump was lifted using an approved crane and inspected lifting accessories. "
        "The lifting area was barricaded and all personnel remained outside the exclusion zone. "
        "A designated lifting supervisor controlled the operation and no one entered beneath the suspended load."
    )
    ext = extraction_service.extract(narrative)
    assert "lifting" in (ext.activity or "")
    assert ext.barrier_failure is None
    assert ext.exposure == "controlled"

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Safe Mechanical Lifting" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "NON_SIF"
    assert res.score < 0.30


def test_09_hot_work_multiple_barrier_failures():
    narrative = (
        "A technician began welding on a process pipe near a hydrocarbon processing unit. "
        "The required hot-work permit had not been issued and gas testing had not been completed before welding started. "
        "Continuous gas monitoring was also unavailable. "
        "The supervisor noticed the activity and stopped the work."
    )
    ext = extraction_service.extract(narrative)
    assert ext.activity == "hot work"
    assert ext.barrier_failure is not None
    assert "hot work permit" in ext.barrier_failure or "gas testing" in ext.barrier_failure
    assert "fire" in (ext.potential_consequence or "") or "explosion" in (ext.potential_consequence or "")

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Hot Work" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_10_excavation_without_shoring():
    narrative = (
        "A maintenance crew entered a 3-meter-deep excavation beside a process pipeline. "
        "The excavation walls showed signs of instability and no shoring or other protective system had been installed. "
        "Workers were standing close to the unsupported walls while exposing the pipeline. "
        "The required excavation inspection had not been completed."
    )
    ext = extraction_service.extract(narrative)
    assert "excavation" in (ext.activity or "")
    assert "cave-in" in (ext.hazard or "") or "collapse" in (ext.hazard or "")
    assert any(k in (ext.exposure or "") for k in ["burial", "crushing", "excavation", "collapse"])
    assert ext.barrier_failure is not None
    assert "shoring" in ext.barrier_failure or "excavation" in ext.barrier_failure
    assert "crush" in (ext.potential_consequence or "") or "burial" in (ext.potential_consequence or "")

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_11_vehicle_pedestrian_interaction():
    narrative = (
        "During maintenance near a warehouse loading area, a forklift was reversing through the designated vehicle route. "
        "The maintenance area had not been barricaded and pedestrians were allowed to enter the vehicle operating zone. "
        "A worker walked directly behind the reversing forklift while the operator had limited visibility. "
        "The supervisor stopped the vehicle before contact occurred."
    )
    ext = extraction_service.extract(narrative)
    assert ext.barrier_failure is not None
    assert "exclusion zone" in ext.barrier_failure or "barricad" in ext.barrier_failure
    assert any(k in (ext.exposure or "") for k in ["struck-by", "traffic", "vehicle", "moving"])
    assert "crush" in (ext.potential_consequence or "") or "fatality" in (ext.potential_consequence or "")

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Driving" in lsrs or "Line of Fire" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_12_work_at_height():
    narrative = (
        "A technician was working approximately 8 meters above ground while inspecting a pipe rack. "
        "The worker was not connected to a fall-arrest system and there was no guardrail along one side of the platform. "
        "The technician moved close to the unprotected edge before the supervisor stopped the work."
    )
    ext = extraction_service.extract(narrative)
    assert ext.activity == "work at height"
    assert "fall" in (ext.hazard or "")
    assert any(k in (ext.exposure or "") for k in ["unprotected", "fall", "height", "edge"])
    assert ext.barrier_failure is not None
    assert "fall protection" in ext.barrier_failure or "guardrail" in ext.barrier_failure
    assert "fatal fall" in (ext.potential_consequence or "")

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Work at Height" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_13_electrical_hazard():
    narrative = (
        "During electrical maintenance, a technician opened a distribution panel without confirming that the circuit had been isolated. "
        "The panel remained energized and the technician's insulated gloves were not available at the work location. "
        "The supervisor identified the condition before contact occurred."
    )
    ext = extraction_service.extract(narrative)
    assert "electrical" in (ext.activity or "")
    assert "electrical" in (ext.hazard or "")
    assert ext.exposure == "electrical contact"
    assert ext.barrier_failure is not None
    assert "energy isolation" in ext.barrier_failure or "gloves" in ext.barrier_failure or "ppe" in ext.barrier_failure
    assert "electric shock" in (ext.potential_consequence or "") or "arc flash" in (ext.potential_consequence or "")

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Energy Isolation" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_14_bypassed_safety_interlock():
    narrative = (
        "During equipment troubleshooting, an operator bypassed the machine safety interlock to keep production running. "
        "The machine was operated with the protective access door open. "
        "Another worker approached the equipment while the interlock remained bypassed."
    )
    ext = extraction_service.extract(narrative)
    assert ext.barrier_failure is not None
    assert "interlock" in ext.barrier_failure or "bypassed" in ext.barrier_failure

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Bypass Safety Controls" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_15_corrective_action_not_misclassified():
    narrative = (
        "A previous inspection identified that gas testing was not being performed before confined-space entry. "
        "Following the observation, the site introduced mandatory pre-entry gas testing and installed fixed gas monitors at the vessel entry point. "
        "Subsequent inspections confirmed that the new controls were being followed."
    )
    ext = extraction_service.extract(narrative)
    assert ext.activity == "confined space entry"
    assert ext.barrier_failure is None

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "NON_SIF"
    assert res.score < 0.30


def test_16_low_risk_office_incident():
    narrative = (
        "During a routine inspection of an administrative office, an employee noticed that a desk drawer was difficult to close because its handle was loose. "
        "The drawer was taken out of use and the handle was repaired by the facilities team. "
        "No employee was exposed to a significant hazard and no injury or near miss occurred."
    )
    ext = extraction_service.extract(narrative)
    assert ext.barrier_failure is None
    assert ext.exposure in (None, "minimal hazard exposure")

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "NON_SIF"
    assert res.score <= 0.05


def test_17_ambiguous_narrative():
    narrative = (
        "During maintenance activities, an operator noticed an unusual vibration from a pump. "
        "The equipment was stopped and inspected. "
        "No damage was found and no unsafe condition was confirmed. "
        "Maintenance personnel subsequently checked the alignment and returned the pump to service."
    )
    ext = extraction_service.extract(narrative)
    assert ext.barrier_failure is None

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification in ("NON_SIF", "UNCERTAIN")
    assert res.score < 0.45


def test_18_multiple_simultaneous_failures():
    narrative = (
        "During maintenance inside a process unit, the technician entered the restricted area without completing the work permit. "
        "The equipment had not been isolated and zero energy was not verified. "
        "A nearby valve was opened by another operator, releasing pressurized gas into the area. "
        "No gas testing had been performed before the technician entered."
    )
    ext = extraction_service.extract(narrative)
    assert ext.barrier_failure is not None
    assert ext.exposure is not None

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert any(r in lsrs for r in ["Work Authorisation", "Energy Isolation", "Confined Space"])

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_19_line_of_fire():
    narrative = (
        "While loosening a seized valve using a long wrench, a technician positioned himself directly in front of the wrench handle. "
        "The tool suddenly slipped and rotated toward the technician. "
        "No exclusion zone was established around the work area. "
        "The technician stepped back before being struck."
    )
    ext = extraction_service.extract(narrative)
    assert ext.exposure == "line of fire"
    assert ext.barrier_failure is not None
    assert "exclusion zone" in ext.barrier_failure or "barricad" in ext.barrier_failure

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Line of Fire" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "SIF_POTENTIAL"
    assert res.score >= 0.70


def test_20_safe_mechanical_lifting_with_near_miss():
    narrative = (
        "During a crane lift, the load began to swing unexpectedly because of wind. "
        "The lifting supervisor immediately stopped the operation and lowered the load to a safe position. "
        "The exclusion zone remained intact and no workers were inside the lifting area. "
        "The lifting plan was reviewed before the operation resumed."
    )
    ext = extraction_service.extract(narrative)
    assert "lifting" in (ext.activity or "")
    assert ext.barrier_failure is None
    assert ext.exposure == "controlled"

    lsrs = [m.rule_name for m in lsr_matcher.map_report(narrative)]
    assert "Safe Mechanical Lifting" in lsrs

    res = ensemble_sif_classifier.predict(narrative, ext)
    assert res.classification == "NON_SIF"
    assert res.score < 0.35
