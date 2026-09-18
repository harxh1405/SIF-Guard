from typing import List, Tuple
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from app.ml.features import SIF_FEATURE_COLUMNS


def build_sif_preprocessor() -> ColumnTransformer:
    """
    Builds an scikit-learn ColumnTransformer for OneHotEncoding categorical features.
    Configured with handle_unknown='ignore' so unseen categories during inference do not crash.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                SIF_FEATURE_COLUMNS,
            )
        ],
        remainder="drop",
    )
    return preprocessor


def fit_sif_preprocessor(df_train: pd.DataFrame) -> ColumnTransformer:
    """
    Fits the preprocessor strictly on training data (preventing data leakage).
    """
    preprocessor = build_sif_preprocessor()
    preprocessor.fit(df_train[SIF_FEATURE_COLUMNS])
    return preprocessor
