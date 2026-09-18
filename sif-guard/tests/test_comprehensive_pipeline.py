import pytest
import numpy as np
from app.schemas.analysis import ExtractionSchema, SIFResultSchema, LSRMatchSchema
from app.services.extraction.service import RuleBasedExtractor, extraction_service
from app.services.sif.classifier import SIFClassifier, sif_classifier
from app.services.lsr.matcher import LSRMatcher, lsr_matcher
from app.services.similarity.service import SimilarityService, similarity_service
from app.services.clustering.service import PrecursorClusteringService, clustering_service
from app.services.embeddings.service import EmbeddingService, embedding_service
from app.core.config import settings

# Sample Test Narratives
NARRATIVE_OFFICE_LOW_RISK = (
    "During a routine inspection of an administrative office, an employee noticed that a desk "
    "drawer was difficult to close because its handle was loose. The drawer was taken out of use "
    "and the handle was repaired by the facilities team. No employee was exposed to a significant "
    "hazard and no injury or near miss occurred."
)

NARRATIVE_MACHINE_GUARDING = (
    "During routine maintenance of a centrifugal pump, a technician removed the protective guard "
    "from the rotating coupling to inspect the equipment. The pump was restarted while the guard "
    "was still removed. The technician was working within close proximity to the exposed rotating coupling "
    "and could have been caught in the moving equipment. No machine guarding was in place when the equipment was operated."
)

NARRATIVE_PRESSURE_ISOLATION = (
    "During servicing of a high pressure gas manifold, operators failed to depressurize and isolate "
    "the line before loosening the flange bolts. A sudden release of high pressure natural gas occurred. "
    "The pressure isolation valve was not locked out or tagged out."
)

NARRATIVE_WORK_AT_HEIGHT = (
    "During maintenance on an elevated platform 7 meters above ground, a technician inspected a pipe support. "
    "The platform had an unprotected edge and no guardrail was installed. The worker was not wearing a safety harness "
    "and no lifeline was connected. Fall protection controls were missing."
)


class TestRuleBasedExtraction:
    """Tests for RuleBasedExtractor entity extraction across diverse narrative types."""

    def test_office_low_risk_extraction(self):
        result = extraction_service.extract(NARRATIVE_OFFICE_LOW_RISK)
        assert isinstance(result, ExtractionSchema)
        assert result.hazard is not None
        assert "office" in result.hazard.lower() or "ergonomic" in result.hazard.lower() or result.hazard == "Unspecified"
        # Verify human_factor does not falsely trigger non-compliance on "no employee was exposed"
        assert result.human_factor != "inappropriate positioning / procedure non-compliance"

    def test_machine_guarding_extraction(self):
        result = extraction_service.extract(NARRATIVE_MACHINE_GUARDING)
        assert result.activity == "machinery maintenance"
        assert "rotating" in result.hazard.lower() or "machinery" in result.hazard.lower() or "caught" in result.hazard.lower()
        assert result.barrier_failure is not None
        assert "guard" in result.barrier_failure.lower()

    def test_pressure_isolation_extraction(self):
        result = extraction_service.extract(NARRATIVE_PRESSURE_ISOLATION)
        assert "pressure" in result.activity.lower() or "maintenance" in result.activity.lower()
        assert "pressure" in result.hazard.lower()
        assert result.barrier_failure is not None
        assert "isolation" in result.barrier_failure.lower() or "lockout" in result.barrier_failure.lower()

    def test_work_at_height_extraction(self):
        result = extraction_service.extract(NARRATIVE_WORK_AT_HEIGHT)
        assert result.activity == "work at height"
        assert "fall" in result.hazard.lower()
        assert result.barrier_failure is not None
        assert "fall protection" in result.barrier_failure.lower() or "guardrail" in result.barrier_failure.lower() or "harness" in result.barrier_failure.lower()


class TestXGBoostModel:
    """Tests for XGBoost model inference, feature schema, and threshold classification."""

    def test_model_loading_and_prediction(self):
        extracted = extraction_service.extract(NARRATIVE_MACHINE_GUARDING)
        result = sif_classifier.predict(NARRATIVE_MACHINE_GUARDING, extracted)
        assert isinstance(result, SIFResultSchema)
        assert result.classification in ["SIF_POTENTIAL", "NON_SIF", "UNCERTAIN"]
        assert 0.0 <= result.score <= 1.0
        assert 0.0 <= result.confidence <= 1.0

    def test_low_risk_classification(self):
        extracted = extraction_service.extract(NARRATIVE_OFFICE_LOW_RISK)
        result = sif_classifier.predict(NARRATIVE_OFFICE_LOW_RISK, extracted)
        assert result.classification == "NON_SIF"
        assert result.score < 0.20

    def test_high_risk_machine_guarding_classification(self):
        extracted = extraction_service.extract(NARRATIVE_MACHINE_GUARDING)
        result = sif_classifier.predict(NARRATIVE_MACHINE_GUARDING, extracted)
        assert result.classification == "SIF_POTENTIAL"
        assert result.score >= 0.50


class TestLifeSavingRulesMapping:
    """Tests for IOGP Life-Saving Rules matching and threshold enforcement."""

    def test_lsr_match_line_of_fire(self):
        matches = lsr_matcher.map_report(NARRATIVE_MACHINE_GUARDING)
        assert len(matches) > 0
        rule_names = [m.rule_name for m in matches]
        assert "Line of Fire" in rule_names or "Bypass Safety Controls" in rule_names

    def test_lsr_match_energy_isolation(self):
        matches = lsr_matcher.map_report(NARRATIVE_PRESSURE_ISOLATION)
        assert len(matches) > 0
        rule_names = [m.rule_name for m in matches]
        assert "Energy Isolation" in rule_names or "Bypass Safety Controls" in rule_names

    def test_lsr_match_working_at_height(self):
        matches = lsr_matcher.map_report(NARRATIVE_WORK_AT_HEIGHT)
        assert len(matches) > 0
        rule_names = [m.rule_name for m in matches]
        assert "Work at Height" in rule_names or "Bypass Safety Controls" in rule_names

    def test_lsr_low_risk_threshold_filtering(self):
        matches = lsr_matcher.map_report(NARRATIVE_OFFICE_LOW_RISK)
        # All matches below threshold should be filtered out
        for m in matches:
            assert m.score >= settings.LSR_THRESHOLD


class TestHSEPrecursorEntities:
    """Tests for ExtractionSchema model structure and entity completeness."""

    def test_extraction_schema_valid_dict(self):
        extracted = extraction_service.extract(NARRATIVE_MACHINE_GUARDING)
        data_dict = extracted.model_dump()
        required_keys = [
            "activity",
            "hazard",
            "exposure",
            "energy_source",
            "equipment",
            "barrier",
            "barrier_failure",
            "potential_consequence",
            "human_factor",
            "environmental_factor",
        ]
        for key in required_keys:
            assert key in data_dict


class TestSIFRiskFactors:
    """Tests for SIF risk factors explainability and feature attributions."""

    def test_risk_factors_generated_for_high_risk(self):
        extracted = extraction_service.extract(NARRATIVE_MACHINE_GUARDING)
        result = sif_classifier.predict(NARRATIVE_MACHINE_GUARDING, extracted)
        assert isinstance(result.risk_factors, list)
        assert len(result.risk_factors) > 0


class TestBGESemanticMatchSignals:
    """Tests for BGE embedding generation and cosine similarity score calculation."""

    def test_bge_embeddings_shape(self):
        emb1 = embedding_service.encode(NARRATIVE_MACHINE_GUARDING)
        emb2 = embedding_service.encode(NARRATIVE_PRESSURE_ISOLATION)
        assert isinstance(emb1, list)
        assert len(emb1) > 0
        assert len(emb1) == len(emb2)

    def test_bge_similarity_threshold(self):
        emb1 = embedding_service.encode("routine office desk repair")
        emb2 = embedding_service.encode("high pressure explosion gas release")
        sim = float(np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2)))
        assert 0.0 <= sim <= 1.0
        emb1_self = embedding_service.encode("routine office desk repair")
        sim_self = float(np.dot(emb1, emb1_self) / (np.linalg.norm(emb1) * np.linalg.norm(emb1_self)))
        assert sim_self > sim


class TestHDBSCANClustering:
    """Tests for HDBSCAN pattern clustering service."""

    def test_clustering_with_db_reports(self):
        from app.db.database import SessionLocal
        db = SessionLocal()
        try:
            clusters = clustering_service.cluster_reports(db)
            assert isinstance(clusters, list)
        finally:
            db.close()
