from typing import Dict, Any, Tuple
import pandas as pd
from app.schemas.analysis import ExtractionSchema
from app.ml.features import SIF_FEATURE_COLUMNS, extraction_to_feature_record


class FeatureBuilder:
    """
    Unified feature engineering layer for XGBoost and CatBoost classifiers.
    Produces identical canonical feature inputs to prevent model divergence or leakage.
    """

    @staticmethod
    def build_features(
        extraction: ExtractionSchema,
        raw_data: Dict[str, Any] = None
    ) -> Tuple[Dict[str, str], pd.DataFrame]:
        # 1. Convert ExtractionSchema to normalized categorical feature record
        feat_dict = extraction_to_feature_record(extraction)

        # 2. Construct clean DataFrame matching SIF_FEATURE_COLUMNS
        df_row = pd.DataFrame([feat_dict])[SIF_FEATURE_COLUMNS]

        return feat_dict, df_row


feature_builder = FeatureBuilder()
