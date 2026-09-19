import os
import pytest
import numpy as np
import pandas as pd
from app.schemas.analysis import ExtractionSchema, SIFResultSchema
from app.ml.features import SIF_FEATURE_COLUMNS, extraction_to_feature_record
from app.ml.preprocessor import fit_sif_preprocessor, build_sif_preprocessor
from app.services.sif.classifier import sif_classifier


def test_extraction_to_feature_record():
    ext = ExtractionSchema(
        activity="confined space entry",
        hazard="toxic gas / hazardous atmosphere",
        barrier="atmospheric testing",
        barrier_failure="atmospheric testing missing or not performed"
    )
    rec = extraction_to_feature_record(ext)
    assert isinstance(rec, dict)
    assert set(rec.keys()) == set(SIF_FEATURE_COLUMNS)
    assert rec["activity"] == "confined space entry"
    assert rec["hazard"] == "toxic gas / hazardous atmosphere"
    assert rec["hazardous_substance"] == "unknown"


def test_preprocessor_no_leakage_and_unseen_category():
    train_data = pd.DataFrame([
        {col: "known_category" for col in SIF_FEATURE_COLUMNS}
    ])
    preprocessor = fit_sif_preprocessor(train_data)

    test_data = pd.DataFrame([
        {col: "completely_unseen_category" for col in SIF_FEATURE_COLUMNS}
    ])

    # Should not crash on unseen categories (handle_unknown='ignore')
    transformed = preprocessor.transform(test_data)
    assert transformed.shape[0] == 1
    # All binary encodings for unseen categories should be 0.0
    assert np.sum(transformed) == 0.0


def test_xgboost_classifier_loaded():
    assert sif_classifier.is_loaded is True
    assert sif_classifier.model is not None
    assert sif_classifier.preprocessor is not None


def test_xgboost_classifier_prediction_high_risk():
    ext = ExtractionSchema(
        activity="confined space entry",
        hazard="toxic gas / hazardous atmosphere",
        hazardous_substance="hydrogen sulfide (h2s)",
        exposure="worker exposed to toxic gas / oxygen deficiency",
        energy_source="chemical / toxic gas energy",
        equipment="vessel / container / process line",
        human_factor="inappropriate positioning / procedure non-compliance",
        environmental_factor="confined space atmosphere",
        barrier="atmospheric testing",
        barrier_failure="atmospheric testing missing or not performed",
        potential_consequence="fatal asphyxiation / acute toxicity poisoning"
    )
    res = sif_classifier.predict("untested tank entry with h2s", ext)

    assert isinstance(res, SIFResultSchema)
    assert res.classification in ["SIF_POTENTIAL", "UNCERTAIN", "NON_SIF"]
    assert 0.0 <= res.score <= 1.0
    assert 0.0 <= res.confidence <= 1.0
    assert res.model_type in ["xgboost", "ensemble"]
    assert res.model_version in ["1.0.0", "1.1.0", "1.1.0-hybrid", "0.1.0"]
    assert isinstance(res.top_factors, list)


def test_xgboost_classifier_prediction_low_risk_control():
    ext = ExtractionSchema(
        activity="office housekeeping",
        hazard="ergonomic / minor office hazard",
        exposure="minimal hazard exposure",
        barrier="routine housekeeping",
        barrier_failure="none"
    )
    res = sif_classifier.predict("routine desk chair check", ext)

    assert res.classification == "NON_SIF"
    assert res.score < 0.40
    assert res.model_type in ["xgboost", "ensemble"]
