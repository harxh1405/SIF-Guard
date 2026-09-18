import os
from typing import Dict, Any, Optional, Tuple, List
import pandas as pd
import numpy as np
from app.ml.features import SIF_FEATURE_COLUMNS
from app.core.logging import logger

try:
    from catboost import CatBoostClassifier, Pool
    HAS_CATBOOST = True
except Exception:
    HAS_CATBOOST = False


class CatBoostSIFModel:
    """
    Inference wrapper for trained CatBoost SIF Potential model.
    Loaded once at startup from app/ml/models/sif/catboost_model.cbm.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../ml/models/sif/catboost_model.cbm")
        )
        self.model: Optional[CatBoostClassifier] = None
        self.is_loaded = False
        self._load_artifact()

    def _load_artifact(self):
        if not HAS_CATBOOST:
            logger.warning("CatBoost library not installed. Operating with XGBoost single model mode.")
            return

        if not os.path.exists(self.model_path):
            logger.warning(f"CatBoost model artifact not found at {self.model_path}.")
            return

        try:
            self.model = CatBoostClassifier()
            self.model.load_model(self.model_path)
            self.is_loaded = True
            logger.info(f"Loaded trained CatBoost model from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load CatBoost artifact: {e}")
            self.model = None
            self.is_loaded = False

    def predict_proba(self, df_features: pd.DataFrame) -> float:
        if not self.is_loaded or self.model is None:
            raise RuntimeError("CatBoost model not available.")

        # Ensure all columns are string for categorical processing
        clean_df = df_features[SIF_FEATURE_COLUMNS].astype(str)
        pool = Pool(clean_df, cat_features=SIF_FEATURE_COLUMNS)
        probs = self.model.predict_proba(pool)
        return float(probs[0, 1])


catboost_sif_model = CatBoostSIFModel()
