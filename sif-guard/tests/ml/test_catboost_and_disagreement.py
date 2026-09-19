import uuid
import pytest
import pandas as pd
import numpy as np
from unittest.mock import patch

from app.ml.features import SIF_FEATURE_COLUMNS
from app.services.sif.catboost_model import catboost_sif_model
from app.services.sif.ensemble import ensemble_sif_classifier
from app.services.sif.classifier import sif_classifier
from app.services.extraction.service import extraction_service
from app.schemas.analysis import ExtractionSchema
from app.db.database import SessionLocal
from app.db.models.report import SafetyReport
from app.services.clustering.service import PrecursorClusteringService


def test_gap15_catboost_standalone_model():
    """Gap #15: CatBoost standalone model validation, probabilities, and unseen categories."""
    assert catboost_sif_model.is_loaded is True, "CatBoost model artifact should be loaded at startup"
    assert catboost_sif_model.model is not None

    # High-risk feature record (all SIF_FEATURE_COLUMNS present)
    df_high = pd.DataFrame([{
        "activity": "confined space entry",
        "hazard": "toxic gas / hazardous atmosphere",
        "hazardous_substance": "h2s",
        "exposure": "toxic atmosphere / inhalation exposure",
        "barrier": "atmospheric testing",
        "barrier_failure": "atmospheric testing missing or not performed",
        "energy_source": "chemical energy",
        "equipment": "storage tank / vessel",
        "potential_consequence": "toxic asphyxiation"
    }])
    prob_high = catboost_sif_model.predict_proba(df_high)
    assert 0.0 <= prob_high <= 1.0
    assert prob_high >= 0.70, f"Expected high SIF probability for critical failure, got {prob_high}"

    # Low-risk feature record
    df_low = pd.DataFrame([{
        "activity": "routine inspection",
        "hazard": "none",
        "hazardous_substance": "none",
        "exposure": "controlled",
        "barrier": "none",
        "barrier_failure": "none",
        "energy_source": "none",
        "equipment": "office desk",
        "potential_consequence": "none / minor"
    }])
    prob_low = catboost_sif_model.predict_proba(df_low)
    assert 0.0 <= prob_low <= 1.0
    assert prob_low <= 0.40, f"Expected low SIF probability for safe inspection, got {prob_low}"
    assert prob_high > prob_low

    # Unseen/novel categories must not cause crash (CatBoost handles novel string categories)
    df_unseen = pd.DataFrame([{
        "activity": "quantum nanolathe inspection",
        "hazard": "dark matter flux",
        "hazardous_substance": "tachyon fluid",
        "exposure": "subatomic drift",
        "barrier": "hyperspace barrier",
        "barrier_failure": "phase inversion",
        "energy_source": "zero point energy",
        "equipment": "tachyon emitter",
        "potential_consequence": "matter disintegration"
    }])
    prob_unseen = catboost_sif_model.predict_proba(df_unseen)
    assert 0.0 <= prob_unseen <= 1.0


def test_gap16_ensemble_disagreement_and_uncertain_zone():
    """Gap #16: Ensemble disagreement, 50/50 weighting, and uncertain zone decision logic."""
    ext = ExtractionSchema(
        activity="machinery maintenance",
        hazard="rotating machinery",
        barrier="machine guarding",
        barrier_failure="guard was removed during maintenance",
        exposure="line of fire",
        energy_source="mechanical energy"
    )

    # Case A: High agreement (both models high -> SIF_POTENTIAL)
    with patch.object(ensemble_sif_classifier.xgb_model, "predict", return_value=np.array([0.85])):
        with patch.object(catboost_sif_model, "predict_proba", return_value=0.85):
            res_high = ensemble_sif_classifier.predict("Maintenance narrative", ext)
            assert res_high.classification == "SIF_POTENTIAL"
            assert res_high.score == 0.85
            assert res_high.model_breakdown["ensemble_probability"] == 0.85
            assert res_high.model_breakdown["xgboost_probability"] == 0.85
            assert res_high.model_breakdown["catboost_probability"] == 0.85

    # Case B: Disagreement leading to UNCERTAIN zone (unc_threshold <= prob < high_threshold)
    # With high=0.45, unc=0.30, target blend = 0.375
    target_mid = (ensemble_sif_classifier.high_threshold + ensemble_sif_classifier.unc_threshold) / 2
    xgb_mid = target_mid + 0.10
    cat_mid = target_mid - 0.10
    with patch.object(ensemble_sif_classifier.xgb_model, "predict", return_value=np.array([xgb_mid])):
        with patch.object(catboost_sif_model, "predict_proba", return_value=cat_mid):
            res_disagree = ensemble_sif_classifier.predict("Maintenance narrative", ext)
            assert res_disagree.classification == "UNCERTAIN"
            assert round(res_disagree.score, 3) == round(target_mid, 3)
            assert res_disagree.confidence == 0.50

    # Case C: Low agreement (both models low -> NON_SIF)
    with patch.object(ensemble_sif_classifier.xgb_model, "predict", return_value=np.array([0.15])):
        with patch.object(catboost_sif_model, "predict_proba", return_value=0.25):
            res_low = ensemble_sif_classifier.predict("Maintenance narrative", ext)
            assert res_low.classification == "NON_SIF"
            assert round(res_low.score, 2) == 0.20
            assert res_low.confidence == 0.80


def test_gap17_counterfactual_pair_fall_protection():
    """Gap #17: Counterfactual Pair 3: Fall protection anchored vs unanchored."""
    text_safe = (
        "Technician working on 10m pipe rack was securely tied off with full-body harness "
        "and shock-absorbing lanyard attached to certified anchor point."
    )
    text_unsafe = (
        "Technician working at height on a 10m pipe rack was wearing a harness "
        "but was not tied off to any anchor point near the unprotected edge."
    )

    ext_safe = extraction_service.extract(text_safe)
    ext_unsafe = extraction_service.extract(text_unsafe)

    res_safe = sif_classifier.predict(text_safe, ext_safe)
    res_unsafe = sif_classifier.predict(text_unsafe, ext_unsafe)

    assert res_unsafe.score > res_safe.score
    assert res_unsafe.classification == "SIF_POTENTIAL"
    assert res_unsafe.score >= 0.80
    assert res_safe.score <= 0.40


def test_gap17_counterfactual_pair_excavation():
    """Gap #17: Counterfactual Pair 4: Shored trench vs unshored collapsing trench."""
    text_safe = (
        "Excavation team installed certified trench box shoring and established safe access "
        "before entering 3-meter deep trench for pipe inspection."
    )
    text_unsafe = (
        "Workers entered 3-meter deep trench without shoring or trench shields "
        "while trench walls exhibited visible sloughing and soil movement."
    )

    ext_safe = extraction_service.extract(text_safe)
    ext_unsafe = extraction_service.extract(text_unsafe)

    res_safe = sif_classifier.predict(text_safe, ext_safe)
    res_unsafe = sif_classifier.predict(text_unsafe, ext_unsafe)

    assert res_unsafe.score > res_safe.score
    assert res_unsafe.classification == "SIF_POTENTIAL"
    assert res_unsafe.score >= 0.80
    assert res_safe.score <= 0.40


def test_gap18_hdbscan_clustering_quality():
    """Gap #18: Clustering service produces distinct clusters on controlled semantic topics."""
    db = SessionLocal()
    clustering_service = PrecursorClusteringService()

    # Clear any previous temporary test reports
    prefix = f"test_clust_{uuid.uuid4().hex[:6]}"
    sample_reports = [
        # Cluster A: Work at Height / Fall
        (f"{prefix}_h1", "Scaffold erection crew worked on 12m elevated tower without safety harness."),
        (f"{prefix}_h2", "Worker stepped on fragile roof sheet at height without fall arrest system."),
        (f"{prefix}_h3", "Painter on portable ladder reached beyond railing and nearly fell from elevated edge."),
        # Cluster B: Confined Space / H2S
        (f"{prefix}_c1", "Contractor entered crude oil storage vessel without atmospheric testing and detected H2S."),
        (f"{prefix}_c2", "Technician entered underground chamber for desludging inspection without continuous gas monitoring."),
        (f"{prefix}_c3", "Worker inside process vessel felt dizzy due to oxygen deficiency and sour gas accumulation."),
        # Cluster C: Office / Administrative
        (f"{prefix}_o1", "Routine safety walk of administrative office noted loose handle on desk drawer."),
        (f"{prefix}_o2", "Office inspection identified unstable armrest on conference room chair."),
        (f"{prefix}_o3", "Staff member reported loose paper filing cabinet drawer in headquarters building.")
    ]

    try:
        created_reports = []
        for rid, narrative in sample_reports:
            rep = SafetyReport(
                id=rid,
                source_dataset="manual",
                source_record_id=rid,
                data_origin="manual",
                report_text=narrative
            )
            db.add(rep)
            created_reports.append(rep)
        db.commit()

        # Run clustering
        clusters = clustering_service.cluster_reports(db, min_cluster_size=2)
        assert len(clusters) >= 2, f"Expected at least 2 clusters from 3 distinct semantic domains, got {len(clusters)}"

        # Verify cluster structure
        for c in clusters:
            assert "cluster_id" in c
            assert "report_count" in c
            assert c["report_count"] >= 2
            assert "name" in c

    finally:
        # Cleanup
        for rid, _ in sample_reports:
            r = db.query(SafetyReport).filter(SafetyReport.id == rid).first()
            if r:
                db.delete(r)
        db.commit()
        db.close()
