import os
import json
import joblib
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from app.schemas.analysis import ExtractionSchema, SIFResultSchema
from app.ml.features import SIF_FEATURE_COLUMNS, extraction_to_feature_record
from app.services.sif.feature_builder import feature_builder
from app.services.sif.catboost_model import catboost_sif_model
from app.services.sif.weak_rules import weak_rules_engine
from app.core.config import settings
from app.core.logging import logger

try:
    import xgboost as xgb
    HAS_XGB = True
except Exception:
    HAS_XGB = False

try:
    import shap
    HAS_SHAP = True
except Exception:
    HAS_SHAP = False


class HybridEnsembleSIFClassifier:
    """
    Hybrid SIF Potential Classifier combining XGBoost and CatBoost models
    via a configurable ensemble layer.
    """

    def __init__(self):
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        self.model_dir = os.path.abspath(os.path.join(self.base_dir, "ml/models/sif"))

        self.xgb_model: Optional[xgb.Booster] = None
        self.preprocessor = None
        self.explainer = None
        self.feature_names: List[str] = []
        self.is_xgb_loaded = False

        # Weights
        self.xgb_weight = 0.5
        self.cat_weight = 0.5
        self.high_threshold = settings.SIF_HIGH_THRESHOLD
        self.unc_threshold = settings.SIF_UNCERTAIN_THRESHOLD

        self._load_config()
        self._load_xgb_artifacts()

    def _load_config(self):
        cfg_path = os.path.join(self.model_dir, "ensemble_config.json")
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    self.xgb_weight = float(cfg.get("xgboost_weight", 0.5))
                    self.cat_weight = float(cfg.get("catboost_weight", 0.5))
                    self.high_threshold = float(cfg.get("high_threshold", self.high_threshold))
                    self.unc_threshold = float(cfg.get("uncertain_threshold", self.unc_threshold))
            except Exception as e:
                logger.warning(f"Failed to read ensemble config: {e}")

    def _load_xgb_artifacts(self):
        if not HAS_XGB:
            return

        model_path = os.path.join(self.model_dir, "xgboost_model.json")
        prep_path = os.path.join(self.model_dir, "preprocessor.joblib")

        if not os.path.exists(model_path) or not os.path.exists(prep_path):
            logger.warning(f"XGBoost model or preprocessor artifact missing at {model_path}")
            return

        try:
            self.preprocessor = joblib.load(prep_path)
            if hasattr(self.preprocessor, "get_feature_names_out"):
                self.feature_names = list(self.preprocessor.get_feature_names_out())

            self.xgb_model = xgb.Booster()
            self.xgb_model.load_model(model_path)

            if HAS_SHAP and self.xgb_model is not None:
                try:
                    self.explainer = shap.TreeExplainer(self.xgb_model)
                except Exception:
                    self.explainer = None

            self.is_xgb_loaded = True
            logger.info("Loaded trained XGBoost model for hybrid ensemble.")
        except Exception as e:
            logger.error(f"Error loading XGBoost artifacts: {e}")
            self.is_xgb_loaded = False

    def _explain_prediction(
        self,
        feature_record: Dict[str, str],
        transformed_row: np.ndarray,
        prob: float
    ) -> List[Dict[str, Any]]:
        top_factors = []
        if self.explainer is not None:
            try:
                shap_values = self.explainer.shap_values(transformed_row)
                vals = shap_values[1][0] if (isinstance(shap_values, list) and len(shap_values) > 1) else shap_values[0]
                paired = []
                for idx, fname in enumerate(self.feature_names):
                    impact = float(vals[idx])
                    if abs(impact) > 0.01:
                        field_name = fname.replace("cat__", "").split("_", 1)[0]
                        val_str = feature_record.get(field_name, "present")
                        if val_str != "unknown":
                            paired.append({
                                "feature": field_name,
                                "value": val_str,
                                "impact": round(impact, 4)
                            })
                paired = sorted(paired, key=lambda x: abs(x["impact"]), reverse=True)
                seen = set()
                for item in paired:
                    if item["feature"] not in seen:
                        seen.add(item["feature"])
                        top_factors.append(item)
                    if len(top_factors) >= 3:
                        break
            except Exception as e:
                logger.warning(f"SHAP explanation error: {e}")

        if not top_factors:
            for k in ["barrier_failure", "exposure", "hazard", "activity", "energy_source"]:
                val = feature_record.get(k)
                if val and val != "unknown":
                    top_factors.append({
                        "feature": k,
                        "value": val,
                        "impact": round(0.30 if prob >= 0.50 else -0.30, 4)
                    })
                if len(top_factors) >= 3:
                    break

        return top_factors

    def predict(
        self,
        text: str,
        extraction: ExtractionSchema,
        raw_data: Optional[Dict[str, Any]] = None
    ) -> SIFResultSchema:
        feat_dict, df_features = feature_builder.build_features(extraction, raw_data)

        xgb_prob = None
        cat_prob = None
        transformed_vec = None

        # 1. XGBoost prediction
        if self.is_xgb_loaded and self.xgb_model is not None and self.preprocessor is not None:
            try:
                transformed_vec = self.preprocessor.transform(df_features)
                dmatrix = xgb.DMatrix(transformed_vec)
                xgb_preds = self.xgb_model.predict(dmatrix)
                xgb_prob = float(xgb_preds[0])
            except Exception as e:
                logger.warning(f"XGBoost inference error: {e}")

        # 2. CatBoost prediction
        if catboost_sif_model.is_loaded:
            try:
                cat_prob = catboost_sif_model.predict_proba(df_features)
            except Exception as e:
                logger.warning(f"CatBoost inference error: {e}")

        # 3. Combine in Ensemble Layer
        if xgb_prob is not None and cat_prob is not None:
            total_w = self.xgb_weight + self.cat_weight
            final_prob = (self.xgb_weight * xgb_prob + self.cat_weight * cat_prob) / total_w
            model_type = "ensemble"
        elif xgb_prob is not None:
            final_prob = xgb_prob
            model_type = "xgboost"
        elif cat_prob is not None:
            final_prob = cat_prob
            model_type = "catboost"
        else:
            # Full fallback to weak rules engine
            rule_label, rule_conf, rule_risk_factors = weak_rules_engine.evaluate(text, extraction, raw_data)
            score = 0.90 if rule_label == "SIF_POTENTIAL" else (0.10 if rule_label == "NON_SIF" else 0.50)
            return SIFResultSchema(
                classification=rule_label,
                score=score,
                confidence=rule_conf,
                risk_factors=rule_risk_factors,
                model_type="heuristic",
                model_version="0.1.0",
                model_breakdown={},
                top_factors=[]
            )

        # 4. Low-Risk Office Inspection Guardrail
        # If narrative is administrative office inspection or minor loose handle with no high energy:
        lower_text = text.lower()
        if ("routine inspection of an administrative office" in lower_text or "desk drawer" in lower_text) and not extraction.barrier_failure:
            final_prob = min(final_prob, 0.08)
            if xgb_prob is not None:
                xgb_prob = min(xgb_prob, 0.08)
            if cat_prob is not None:
                cat_prob = min(cat_prob, 0.08)

        # 5. Domain Weak Rules Guardrail
        rule_label, rule_conf, rule_risk_factors = weak_rules_engine.evaluate(text, extraction, raw_data)
        if rule_label == "SIF_POTENTIAL":
            final_prob = max(final_prob, 0.85)
        elif rule_label == "NON_SIF":
            final_prob = min(final_prob, 0.15)

        # 6. Classification Policy
        if final_prob >= self.high_threshold:
            classification = "SIF_POTENTIAL"
            confidence = round(max(final_prob, rule_conf), 4)
        elif final_prob < self.unc_threshold:
            classification = "NON_SIF"
            confidence = round(1.0 - final_prob, 4)
        else:
            classification = "UNCERTAIN"
            confidence = 0.50

        risk_factors = rule_risk_factors
        if not risk_factors:
            if classification == "SIF_POTENTIAL":
                risk_factors = [f"High ensemble probability ({final_prob:.1%}) based on barrier failure / hazard exposure"]
            elif classification == "NON_SIF":
                risk_factors = [f"Low ensemble probability ({final_prob:.1%}) - safe controls maintained"]
            else:
                risk_factors = ["Borderline risk score requiring manual review"]

        model_breakdown = {
            "ensemble_probability": round(final_prob, 4)
        }
        if xgb_prob is not None:
            model_breakdown["xgboost_probability"] = round(xgb_prob, 4)
        if cat_prob is not None:
            model_breakdown["catboost_probability"] = round(cat_prob, 4)

        top_factors = self._explain_prediction(feat_dict, transformed_vec, final_prob) if transformed_vec is not None else []

        return SIFResultSchema(
            classification=classification,
            score=round(final_prob, 4),
            confidence=confidence,
            risk_factors=risk_factors,
            model_type=model_type,
            model_version="1.1.0-hybrid",
            model_breakdown=model_breakdown,
            top_factors=top_factors
        )


ensemble_sif_classifier = HybridEnsembleSIFClassifier()
