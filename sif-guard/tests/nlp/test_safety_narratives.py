import pytest
from app.services.extraction.service import extraction_service
from app.services.sif.classifier import sif_classifier


def test_narrative_confined_space():
    """1. Confined Space: nitrogen purge, atmospheric testing missing, oxygen deficiency, entry without permit."""
    text = (
        "Operator entered nitrogen-purged separator vessel without atmospheric testing or a valid "
        "confined space entry permit. Severe oxygen deficiency was present."
    )
    ext = extraction_service.extract(text)
    assert "confined space" in (ext.activity or "").lower() or "entry" in (ext.activity or "").lower()
    assert any(w in (ext.hazard or "").lower() for w in ["oxygen", "asphyxiation", "confined", "toxic", "gas"])
    assert ext.barrier_failure is not None
    assert any(w in ext.barrier_failure.lower() for w in ["atmospheric", "permit", "testing", "entry", "gas"])
    
    sif_res = sif_classifier.predict(text, ext)
    assert sif_res.classification == "SIF_POTENTIAL"
    assert sif_res.score >= 0.70


def test_narrative_lifting_operations():
    """2. Lifting Operations: crane lift, rigging failure, suspended load swing, exclusion zone bypassed."""
    text = (
        "During a 20-ton crane lifting operation, the rigging sling slipped causing the suspended load to swing. "
        "The lift exclusion zone was bypassed by two riggers who were standing directly underneath the load."
    )
    ext = extraction_service.extract(text)
    assert any(w in (ext.activity or "").lower() for w in ["lifting", "crane", "rigging"])
    assert any(w in (ext.hazard or "").lower() for w in ["suspended load", "dropped object", "crush"])
    assert ext.barrier_failure is not None
    assert any(w in ext.barrier_failure.lower() for w in ["exclusion zone", "rigging", "lift", "bypassed"])

    sif_res = sif_classifier.predict(text, ext)
    assert sif_res.classification == "SIF_POTENTIAL"
    assert sif_res.score >= 0.70


def test_narrative_excavation_trenching():
    """3. Excavation / Trenching: 3m trench, no shoring or trench box, soil collapse risk, water accumulation."""
    text = (
        "Contractor entered a 3-meter deep trench excavation without shoring, shielding trench box, or benching. "
        "Significant water accumulation was observed at the trench bottom with imminent soil collapse hazard."
    )
    ext = extraction_service.extract(text)
    assert any(w in (ext.activity or "").lower() for w in ["trench", "excavation", "digging"])
    assert any(w in (ext.hazard or "").lower() for w in ["soil", "cave-in", "collapse", "trench"])
    assert ext.barrier_failure is not None
    assert any(w in ext.barrier_failure.lower() for w in ["shoring", "trench box", "sloping", "trench"])

    sif_res = sif_classifier.predict(text, ext)
    assert sif_res.classification == "SIF_POTENTIAL"
    assert sif_res.score >= 0.70


def test_narrative_hot_work():
    """4. Hot Work: welding near condensate line, gas testing not performed, spark ignition risk."""
    text = (
        "Fitter performed cutting and welding on a pipe spool located 2 meters from an active condensate line. "
        "Gas testing was not performed prior to striking the arc, creating an imminent explosion hazard."
    )
    ext = extraction_service.extract(text)
    assert any(w in (ext.activity or "").lower() for w in ["welding", "hot work", "cutting"])
    assert any(w in (ext.hazard or "").lower() for w in ["flammable", "fire", "explosion", "spark", "gas"])
    assert ext.barrier_failure is not None
    assert any(w in ext.barrier_failure.lower() for w in ["gas test", "gas testing", "hot work", "permit"])

    sif_res = sif_classifier.predict(text, ext)
    assert sif_res.classification == "SIF_POTENTIAL"
    assert sif_res.score >= 0.70


def test_narrative_vehicle_pedestrian():
    """5. Vehicle / Pedestrian: forklift operating in reversing area, spotter absent, pedestrian in blind spot."""
    text = (
        "A heavy forklift was operating in a high-traffic logistics loading bay. The forklift reversed at speed "
        "without a designated spotter, nearly pinning a pedestrian worker caught in the vehicle blind spot."
    )
    ext = extraction_service.extract(text)
    assert any(w in (ext.activity or "").lower() for w in ["forklift", "vehicle", "driving", "logistics"])
    assert any(w in (ext.hazard or "").lower() for w in ["traffic", "pedestrian", "struck-by", "vehicle", "moving equipment"])
    assert ext.barrier_failure is not None
    assert any(w in ext.barrier_failure.lower() for w in ["spotter", "exclusion", "traffic segregation", "vehicle"])

    sif_res = sif_classifier.predict(text, ext)
    assert sif_res.classification == "SIF_POTENTIAL"
    assert sif_res.score >= 0.70


def test_narrative_pressure_isolation():
    """6. Pressure Isolation: process piping maintenance, double block and bleed not verified, residual pressure release."""
    text = (
        "Maintenance technician unbolted a high-pressure crude oil flange on the separator manifold. "
        "Zero pressure was not verified and double block and bleed isolation was not confirmed, releasing residual pressurized oil."
    )
    ext = extraction_service.extract(text)
    assert any(w in (ext.activity or "").lower() for w in ["flange", "maintenance", "piping", "line breaking"])
    assert any(w in (ext.hazard or "").lower() for w in ["pressure", "crude oil", "residual pressure", "release"])
    assert ext.barrier_failure is not None
    assert any(w in ext.barrier_failure.lower() for w in ["pressure isolation", "zero pressure", "isolation", "depressurization"])

    sif_res = sif_classifier.predict(text, ext)
    assert sif_res.classification == "SIF_POTENTIAL"
    assert sif_res.score >= 0.70


def test_narrative_machine_guarding():
    """7. Machine Guarding: conveyor belt nip point, guard removed for cleaning while energized, interlock bypassed."""
    text = (
        "Worker attempted to clean debris from a high-speed conveyor belt drive pulley while energized. "
        "The machine guard was removed and the safety interlock was bypassed, exposing worker to nip point entanglement."
    )
    ext = extraction_service.extract(text)
    assert any(w in (ext.activity or "").lower() for w in ["cleaning", "conveyor", "maintenance", "servicing", "machinery"])
    assert any(w in (ext.hazard or "").lower() for w in ["nip point", "rotating", "entanglement", "machine"])
    assert ext.barrier_failure is not None
    assert any(w in ext.barrier_failure.lower() for w in ["guard", "machine guarding", "interlock"])

    sif_res = sif_classifier.predict(text, ext)
    assert sif_res.classification == "SIF_POTENTIAL"
    assert sif_res.score >= 0.70


def test_narrative_low_risk_office_observation():
    """8. Low-Risk Office: loose screw on desk drawer handle in administrative building, no injury, maintenance ticket created."""
    text = (
        "During a routine safety walkthrough of the 2nd floor administrative office, an employee noticed "
        "a loose screw on a desk drawer handle. No injury occurred or was possible. A routine maintenance ticket was created."
    )
    ext = extraction_service.extract(text)
    # Must NOT identify high-energy hazard or failed safety barriers
    assert ext.barrier_failure is None or ext.barrier_failure == ""
    assert "pressure" not in (ext.energy_source or "").lower()
    assert "high voltage" not in (ext.energy_source or "").lower()

    sif_res = sif_classifier.predict(text, ext)
    # Must score <= 0.15 and be classified as NON_SIF
    assert sif_res.classification == "NON_SIF"
    assert sif_res.score <= 0.15
