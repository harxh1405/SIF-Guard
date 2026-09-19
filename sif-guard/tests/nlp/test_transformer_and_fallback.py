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


def test_gap5_transformer_entity_semantic_properties():
    """Gap #5: Verify structural and semantic integrity of transformer spans."""
    text = "Technician entered the storage vessel to perform desludging inspection with a gas monitor."
    spans = transformer_extractor.extract(text)
    assert len(spans) >= 1

    valid_labels = {"EQUIPMENT", "ACTIVITY", "HAZARDOUS_SUBSTANCE", "BARRIER", "EXPOSURE", "HUMAN_FACTOR"}

    for span in spans:
        # 1. Start and end offsets within bounds
        assert 0 <= span.start < span.end <= len(text)
        # 2. Exact slice equality
        assert text[span.start:span.end] == span.text
        # 3. Valid confidence score
        assert 0.0 <= span.confidence <= 1.0
        # 4. Source attribute
        assert span.source == "transformer"
        # 5. Label in canonical safety vocabulary
        assert span.label in valid_labels


def test_gap5_multi_token_spans():
    """Gap #5: Verify extraction of multi-token domain spans."""
    text = "Operator maintained continuous gas monitoring while working around the centrifugal pump."
    spans = transformer_extractor.extract(text)
    assert len(spans) >= 1

    # At least one extracted entity should be multi-token (contain whitespace)
    multi_token_spans = [s for s in spans if " " in s.text.strip()]
    assert len(multi_token_spans) >= 1
    labels = {s.label for s in multi_token_spans}
    assert "BARRIER" in labels or "EQUIPMENT" in labels or "ACTIVITY" in labels


def test_gap5_out_of_vocabulary_handling():
    """Gap #5: Transformer extractor handles rare/OOV tokens gracefully."""
    text = "Worker deployed XYZ-9988-Alpha beta-gamma nonstandard nanodevice on unit K-99."
    spans = transformer_extractor.extract(text)
    assert isinstance(spans, list)


def test_gap5_empty_and_whitespace_input():
    """Gap #5: Edge case handling for empty, whitespace, and null inputs."""
    assert transformer_extractor.extract("") == []
    assert transformer_extractor.extract("   \n\t  ") == []
    assert transformer_extractor.extract(None) == []

