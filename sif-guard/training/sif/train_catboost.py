import os
import sys
import json
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier, Pool

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.ml.features import SIF_FEATURE_COLUMNS, DEFAULT_MISSING_VALUE

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
if not os.path.exists(DATA_DIR):
    DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../app/ml/models/sif"))
os.makedirs(MODEL_DIR, exist_ok=True)


def train_sif_catboost() -> CatBoostClassifier:
    print("=" * 60)
    print("Training CatBoost SIF Potential Classifier (Proprietary Data Only)")
    print("=" * 60)

    train_path = os.path.join(DATA_DIR, "sif_guard_train.csv")
    val_path = os.path.join(DATA_DIR, "sif_guard_validation.csv")

    df_train = pd.read_csv(train_path).fillna(DEFAULT_MISSING_VALUE)
    df_val = pd.read_csv(val_path).fillna(DEFAULT_MISSING_VALUE)

    # Clean string types for categorical features
    for col in SIF_FEATURE_COLUMNS:
        df_train[col] = df_train[col].astype(str)
        df_val[col] = df_val[col].astype(str)

    X_train = df_train[SIF_FEATURE_COLUMNS]
    y_train = df_train["sif_potential"].astype(int).values

    X_val = df_val[SIF_FEATURE_COLUMNS]
    y_val = df_val["sif_potential"].astype(int).values

    # Strict audit: verify sif_reason and target fields are NOT in features
    assert "sif_reason" not in X_train.columns
    assert "sif_potential" not in X_train.columns

    train_pool = Pool(X_train, y_train, cat_features=SIF_FEATURE_COLUMNS)
    val_pool = Pool(X_val, y_val, cat_features=SIF_FEATURE_COLUMNS)

    model = CatBoostClassifier(
        iterations=300,
        learning_rate=0.06,
        depth=5,
        loss_function="Logloss",
        eval_metric="Logloss",
        random_seed=42,
        verbose=False,
        early_stopping_rounds=30
    )

    model.fit(train_pool, eval_set=val_pool, verbose=False)

    out_path = os.path.join(MODEL_DIR, "catboost_model.cbm")
    model.save_model(out_path)
    print(f"Successfully trained and saved CatBoost model -> {out_path}")
    return model


if __name__ == "__main__":
    train_sif_catboost()
