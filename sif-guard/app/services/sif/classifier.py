import os
import json
import joblib
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np

from app.schemas.analysis import ExtractionSchema, SIFResultSchema
from app.ml.features import SIF_FEATURE_COLUMNS, extraction_to_feature_record
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


class HeuristicSIFClassifier:
    """
    Explicit legacy / heuristic fallback classifier.
    """
    def predict(self, text: str, extraction: ExtractionSchema, metadata: Optional[Dict[str, Any]] = None) -> SIFResultSchema:
        rule_label, rule_conf, rule_risk_factors = weak_rules_engine.evaluate(text, extraction, metadata)
        if rule_label == "SIF_POTENTIAL":
            classification = "SIF_POTENTIAL"
            score = 0.90
        elif rule_label == "NON_SIF":
            classification = "NON_SIF"
            score = 0.10
        else:
            classification = "UNCERTAIN"
            score = 0.50

        return SIFResultSchema(
            classification=classification,
            score=score,
            confidence=rule_conf,
            risk_factors=rule_risk_factors,
            model_type="heuristic",
            model_version="0.1.0",
            top_factors=[]
        )


class SIFClassifier:
    """
    Production Trained XGBoost SIF Potential Classifier.
    Loads preprocessor and XGBoost model once at initialization.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        preprocessor_path: Optional[str] = None,
        mode: Optional[str] = None,
    ):
        self.mode = mode or settings.SIF_CLASSIFIER_MODE

        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        raw_mpath = model_path or settings.SIF_MODEL_PATH
        raw_ppath = preprocessor_path or settings.SIF_PREPROCESSOR_PATH

        self.model_path = raw_mpath if os.path.isabs(raw_mpath) else os.path.abspath(os.path.join(base_dir, "..", raw_mpath))
        self.preprocessor_path = raw_ppath if os.path.isabs(raw_ppath) else os.path.abspath(os.path.join(base_dir, "..", raw_ppath))

        self.model: Optional[xgb.Booster] = None
        self.preprocessor = None
        self.explainer = None
        self.feature_names: List[str] = []
        self.heuristic_fallback = HeuristicSIFClassifier()
        self.is_loaded = False

        self._load_artifacts()

    def _load_artifacts(self):
        if self.mode == "heuristic":
            logger.info("SIFClassifier explicitly configured for 'heuristic' mode.")
            return

        if not HAS_XGB:
            logger.error("XGBoost library not installed in environment.")
            return

        if not os.path.exists(self.model_path) or not os.path.exists(self.preprocessor_path):
            logger.warning(
                f"XGBoost model or preprocessor artifact missing. Path: {self.model_path}, {self.preprocessor_path}"
            )
            return

        try:
            # Load preprocessor
            self.preprocessor = joblib.load(self.preprocessor_path)

            # Extract feature names from OneHotEncoder transformer
            if hasattr(self.preprocessor, "get_feature_names_out"):
                self.feature_names = list(self.preprocessor.get_feature_names_out())

            # Load Booster
            self.model = xgb.Booster()
            self.model.load_model(self.model_path)

            # Initialize SHAP explainer if available
            if HAS_SHAP and self.model is not None:
                try:
                    self.explainer = shap.TreeExplainer(self.model)
                except Exception as ex:
                    logger.warning(f"Could not initialize SHAP TreeExplainer: {ex}")
                    self.explainer = None

            self.is_loaded = True
            logger.info(f"Loaded trained XGBoost model from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load XGBoost artifacts: {e}")
            self.model = None
            self.preprocessor = None
            self.is_loaded = False

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
                if isinstance(shap_values, list):
                    vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
                elif shap_values.ndim == 2:
                    vals = shap_values[0]
                else:
                    vals = shap_values

                paired = []
                for idx, fname in enumerate(self.feature_names):
                    impact = float(vals[idx])
                    if abs(impact) > 0.01:
                        parts = fname.replace("cat__", "").split("_", 1)
                        field_name = parts[0] if len(parts) > 0 else fname
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
                logger.warning(f"SHAP explanation generation error: {e}")

        if not top_factors:
            for k in ["exposure", "barrier_failure", "hazard", "activity", "energy_source"]:
                val = feature_record.get(k)
                if val and val != "unknown":
                    top_factors.append({
                        "feature": k,
                        "value": val,
                        "impact": round(0.25 if prob >= 0.50 else -0.25, 4)
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
        if self.mode == "heuristic":
            return self.heuristic_fallback.predict(text, extraction, raw_data)

        # Delegate to hybrid ensemble classifier (XGBoost + CatBoost)
        from app.services.sif.ensemble import ensemble_sif_classifier
        return ensemble_sif_classifier.predict(text, extraction, raw_data)


sif_classifier = SIFClassifier()

