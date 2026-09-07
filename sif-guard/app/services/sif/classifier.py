import os
import json
from typing import Dict, Any, List, Optional
import numpy as np
from app.schemas.analysis import ExtractionSchema, SIFResultSchema
from app.services.sif.weak_rules import weak_rules_engine
from app.services.embeddings.service import embedding_service
from app.core.config import settings
from app.core.logging import logger

try:
    import xgboost as xgb
    HAS_XGB = True
except Exception:
    HAS_XGB = False


class SIFClassifier:

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or settings.SIF_MODEL_PATH
        self.model = None
        self._load_model()

    def _load_model(self):
        if HAS_XGB and os.path.exists(self.model_path):
            try:
                self.model = xgb.Booster()
                self.model.load_model(self.model_path)
                logger.info(f"Loaded trained XGBoost model from {self.model_path}")
            except Exception as e:
                logger.warning(f"Could not load XGBoost model from {self.model_path}: {e}")
                self.model = None

    def extract_structured_features(self, text: str, extraction: ExtractionSchema, metadata: Optional[Dict[str, Any]] = None) -> List[float]:
        t_lower = text.lower()
        
        feats = [
            1.0 if "confined space" in t_lower or extraction.activity == "confined space entry" else 0.0,
            1.0 if "height" in t_lower or "fall" in t_lower or extraction.activity == "work at height" else 0.0,
            1.0 if "line of fire" in t_lower or extraction.exposure == "worker in line of fire under suspended load" else 0.0,
            1.0 if "suspended load" in t_lower or extraction.hazard == "suspended load / struck-by" else 0.0,
            1.0 if "loto" in t_lower or "isolation" in t_lower or extraction.barrier == "energy isolation (LOTO)" else 0.0,
            1.0 if "electrical" in t_lower or extraction.energy_source == "electrical energy" else 0.0,
            1.0 if "h2s" in t_lower or "toxic" in t_lower or extraction.hazard == "toxic gas / hazardous atmosphere" else 0.0,
            1.0 if "explosion" in t_lower or "fire" in t_lower else 0.0,
            1.0 if "vehicle" in t_lower or "driving" in t_lower else 0.0,
            1.0 if extraction.barrier_failure is not None else 0.0,
            1.0 if extraction.exposure is not None else 0.0,
            1.0 if extraction.hazardous_substance is not None else 0.0,
            float(metadata.get("fall_height", 0.0)) if metadata and metadata.get("fall_height") else 0.0,
            1.0 if metadata and metadata.get("fatal_cause") else 0.0,
            1.0 if extraction.human_factor is not None else 0.0,
            1.0 if extraction.environmental_factor is not None else 0.0,
        ]
        return feats

    def predict(self, text: str, extraction: ExtractionSchema, metadata: Optional[Dict[str, Any]] = None) -> SIFResultSchema:
        rule_label, rule_conf, rule_risk_factors = weak_rules_engine.evaluate(text, extraction, metadata)

        # Compute feature vector (embedding + structured indicators)
        emb = embedding_service.encode(text)
        struct_feats = self.extract_structured_features(text, extraction, metadata)
        
        # If trained model exists, compute model score
        model_score = None
        if self.model is not None:
            try:
                feature_vec = np.array(emb + struct_feats, dtype=np.float32).reshape(1, -1)
                dmatrix = xgb.DMatrix(feature_vec)
                preds = self.model.predict(dmatrix)
                model_score = float(preds[0])
            except Exception as e:
                logger.error(f"XGBoost inference error: {e}")
                model_score = None

        # Hybrid ensemble decision logic
        if rule_label == "SIF_POTENTIAL":
            final_classification = "SIF_POTENTIAL"
            score = max(0.85, model_score) if model_score is not None else 0.92
            confidence = rule_conf
            risk_factors = rule_risk_factors
        elif rule_label == "NON_SIF":
            final_classification = "NON_SIF"
            score = min(0.15, model_score) if model_score is not None else 0.08
            confidence = rule_conf
            risk_factors = rule_risk_factors
        else:
            # Uncertain / model dependent
            if model_score is not None:
                score = model_score
                if score >= 0.70:
                    final_classification = "SIF_POTENTIAL"
                    confidence = 0.75
                    risk_factors = ["High model SIF probability from dense vector features"]
                elif score <= 0.30:
                    final_classification = "NON_SIF"
                    confidence = 0.75
                    risk_factors = ["Low model SIF probability from dense vector features"]
                else:
                    final_classification = "UNCERTAIN"
                    confidence = 0.50
                    risk_factors = rule_risk_factors
            else:
                final_classification = "UNCERTAIN"
                score = 0.50
                confidence = 0.50
                risk_factors = rule_risk_factors

        return SIFResultSchema(
            classification=final_classification,
            score=round(score, 4),
            confidence=round(confidence, 4),
            risk_factors=risk_factors
        )


sif_classifier = SIFClassifier()
