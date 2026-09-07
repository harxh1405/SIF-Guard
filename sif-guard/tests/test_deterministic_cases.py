import pytest
from app.services.extraction.service import extraction_service
from app.services.sif.classifier import sif_classifier
from app.services.lsr.matcher import lsr_matcher


def test_confined_space_case():
    text = "Worker entered a confined vessel without atmospheric testing. H2S was detected after entry and the worker immediately exited."
    
    extraction = extraction_service.extract(text)
    sif_res = sif_classifier.predict(text, extraction)
    lsr_matches = lsr_matcher.map_report(text)
    
    assert extraction.activity == "confined space entry"
    assert "toxic gas" in extraction.hazard
    assert extraction.barrier_failure is not None
    assert "atmospheric testing" in extraction.barrier_failure.lower()
    
    assert sif_res.classification == "SIF_POTENTIAL"
    assert sif_res.score >= 0.80
    
    rule_names = [m.rule_name for m in lsr_matches]
    assert "Confined Space" in rule_names


def test_line_of_fire_case():
    text = "Worker was standing underneath a suspended load during lifting operations."
    
    extraction = extraction_service.extract(text)
    sif_res = sif_classifier.predict(text, extraction)
    lsr_matches = lsr_matcher.map_report(text)
    
    assert "line of fire" in extraction.exposure.lower()
    assert "suspended load" in extraction.hazard.lower()
    
    assert sif_res.classification == "SIF_POTENTIAL"
    assert sif_res.score >= 0.80
    
    rule_names = [m.rule_name for m in lsr_matches]
    assert any(r in rule_names for r in ["Line of Fire", "Safe Mechanical Lifting"])


def test_work_at_height_case():
    text = "Worker was performing roof installation at 25 feet without fall protection."
    metadata = {"fall_height": 25.0}
    
    extraction = extraction_service.extract(text, metadata)
    sif_res = sif_classifier.predict(text, extraction, metadata)
    lsr_matches = lsr_matcher.map_report(text)
    
    assert extraction.activity in ["work at height", "roof installation"]
    assert "fall protection" in extraction.barrier_failure.lower()
    
    assert sif_res.classification == "SIF_POTENTIAL"
    assert sif_res.score >= 0.80
    
    rule_names = [m.rule_name for m in lsr_matches]
    assert "Work at Height" in rule_names


def test_low_risk_case():
    text = "Damaged office chair identified in an administrative office."
    
    extraction = extraction_service.extract(text)
    sif_res = sif_classifier.predict(text, extraction)
    
    assert sif_res.classification == "NON_SIF"
    assert sif_res.score <= 0.30
