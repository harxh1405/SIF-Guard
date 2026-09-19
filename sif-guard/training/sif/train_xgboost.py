import os
import sys
import json
import joblib
import pandas as pd
import xgboost as xgb

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.ml.features import SIF_FEATURE_COLUMNS, DEFAULT_MISSING_VALUE
from app.ml.preprocessor import fit_sif_preprocessor

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
if not os.path.exists(DATA_DIR):
    DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../app/ml/models/sif"))
os.makedirs(MODEL_DIR, exist_ok=True)


def train_sif_xgboost():
    print("=" * 60)
    print("Training XGBoost SIF Potential Classifier (Proprietary Data Only)")
    print("=" * 60)

    train_path = os.path.join(DATA_DIR, "sif_guard_train.csv")
    val_path = os.path.join(DATA_DIR, "sif_guard_validation.csv")

    df_train = pd.read_csv(train_path).fillna(DEFAULT_MISSING_VALUE)
    df_val = pd.read_csv(val_path).fillna(DEFAULT_MISSING_VALUE)

    # Strict audit: verify sif_reason and target fields are NOT in features
    assert "sif_reason" not in SIF_FEATURE_COLUMNS

    X_train_df = df_train[SIF_FEATURE_COLUMNS]
    y_train = df_train["sif_potential"].astype(int).values

    X_val_df = df_val[SIF_FEATURE_COLUMNS]
    y_val = df_val["sif_potential"].astype(int).values

    # Fit preprocessor strictly on X_train to prevent data leakage
    preprocessor = fit_sif_preprocessor(df_train)
    X_train_trans = preprocessor.transform(X_train_df)
    X_val_trans = preprocessor.transform(X_val_df)

    joblib.dump(preprocessor, os.path.join(MODEL_DIR, "preprocessor.joblib"))

    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        early_stopping_rounds=30
    )

    model.fit(X_train_trans, y_train, eval_set=[(X_val_trans, y_val)], verbose=False)

    out_json = os.path.join(MODEL_DIR, "xgboost_model.json")
    model.save_model(out_json)
    print(f"Successfully trained and saved XGBoost model -> {out_json}")


if __name__ == "__main__":
    train_sif_xgboost()
