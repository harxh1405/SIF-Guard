import pytest
from app.services.extraction.service import extraction_service
from app.services.sif.classifier import sif_classifier


def test_model_breakdown_schema():
    """Verify model_breakdown contains xgboost, catboost, and ensemble probabilities."""
    text = (
        "Rigging sling broke while hoisting a 15-ton compressor skid. "
        "The suspended load dropped into the active work area."
    )
    ext = extraction_service.extract(text)
    res = sif_classifier.predict(text, ext)

    assert res.model_breakdown is not None
    assert "xgboost_probability" in res.model_breakdown
    assert "catboost_probability" in res.model_breakdown
    assert "ensemble_probability" in res.model_breakdown

    xgb_p = res.model_breakdown["xgboost_probability"]
    cat_p = res.model_breakdown["catboost_probability"]
    ens_p = res.model_breakdown["ensemble_probability"]

    assert 0.0 <= xgb_p <= 1.0
    assert 0.0 <= cat_p <= 1.0
    assert 0.0 <= ens_p <= 1.0
    assert res.classification in ("SIF_POTENTIAL", "NON_SIF", "UNCERTAIN")


def test_counterfactual_pair_loto():
    """Counterfactual Pair 1: LOTO applied (safe) vs LOTO omitted (high SIF)."""
    text_safe = (
        "Electrician applied lockout/tagout padlocks and confirmed zero electrical voltage "
        "with a calibrated meter before replacing the 480V motor control center wiring."
    )
    text_unsafe = (
        "Electrician replaced wiring on 480V motor control center while energized, "
        "without applying lockout/tagout or verifying zero energy, sustaining an electric shock."
    )

    ext_safe = extraction_service.extract(text_safe)
    ext_unsafe = extraction_service.extract(text_unsafe)

    res_safe = sif_classifier.predict(text_safe, ext_safe)
    res_unsafe = sif_classifier.predict(text_unsafe, ext_unsafe)

    assert res_unsafe.score > res_safe.score
    assert res_unsafe.classification == "SIF_POTENTIAL"
    assert res_unsafe.score >= 0.80
    assert res_safe.score <= 0.40


def test_counterfactual_pair_hot_work():
    """Counterfactual Pair 2: Gas test & permit completed (safe) vs omitted (high SIF)."""
    text_safe = (
        "Welder obtained valid hot work permit and completed continuous gas testing "
        "prior to initiating fabrication welding on the structural pipe rack."
    )
    text_unsafe = (
        "Welder initiated torch cutting on process line adjacent to crude oil separator "
        "without obtaining a hot work permit and without conducting gas testing."
    )

    ext_safe = extraction_service.extract(text_safe)
    ext_unsafe = extraction_service.extract(text_unsafe)

    res_safe = sif_classifier.predict(text_safe, ext_safe)
    res_unsafe = sif_classifier.predict(text_unsafe, ext_unsafe)

    assert res_unsafe.score > res_safe.score
    assert res_unsafe.classification == "SIF_POTENTIAL"
    assert res_unsafe.score >= 0.80
    assert res_safe.score <= 0.40


def test_shap_feature_explainability():
    """Verify SHAP / feature impact explainability returns ranked features."""
    text = (
        "Worker entered 4-meter deep unshored trench with unstable soil walls. "
        "Soil collapsed entrapping worker up to waist level."
    )
    ext = extraction_service.extract(text)
    res = sif_classifier.predict(text, ext)

    assert len(res.top_factors) >= 1
    top = res.top_factors[0]
    assert "feature" in top
    assert "value" in top
    assert "impact" in top
    assert isinstance(top["impact"], float)
