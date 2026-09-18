import pytest
from unittest.mock import patch
from app.services.extraction.service import HybridSafetyExtractor, RuleBasedExtractor
from app.services.extraction.transformer.extractor import transformer_extractor
from app.services.extraction.transformer.config import ner_config


def test_transformer_direct_extraction():
    """Verify transformer extractor returns CandidateEntity spans or gracefully falls back."""
    text = "Contractor performed pipe welding at the processing facility."
    spans = transformer_extractor.extract(text)
    assert isinstance(spans, list)


def test_hybrid_extractor_normal():
    """Verify normal hybrid extraction execution."""
    text = "Fitter was welding on the line without a valid hot work permit."
    extractor = HybridSafetyExtractor()
    schema = extractor.extract(text)
    assert schema.activity is not None
    assert schema.barrier_failure is not None


def test_rule_only_mode_fallback():
    """Verify fallback when SAFETY_NER_ENABLED is toggled off."""
    extractor = HybridSafetyExtractor()
    text = "Technician opened high pressure flange without zero energy verification."
    with patch.object(ner_config, "SAFETY_NER_ENABLED", False):
        schema = extractor.extract(text)
        assert schema.activity is not None
        assert "pressure" in (schema.hazard or "").lower() or "flange" in (schema.activity or "").lower()
        assert schema.barrier_failure is not None


def test_transformer_exception_graceful_fallback():
    """Verify graceful fallback when transformer throws an unexpected error."""
    extractor = HybridSafetyExtractor()
    text = "Worker in 3m trench without shoring or trench box collapse hazard."

    with patch.object(transformer_extractor, "extract", side_effect=RuntimeError("Simulated GPU OOM or model crash")):
        # Must not raise an exception; must catch and fallback cleanly to RuleBasedExtractor
        schema = extractor.extract(text)
        assert schema is not None
        assert any(w in (schema.activity or "").lower() for w in ["trench", "excavation"]) or any(w in (schema.hazard or "").lower() for w in ["trench", "excavation", "cave-in", "collapse"])
        assert schema.barrier_failure is not None
