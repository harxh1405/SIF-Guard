import os
import sys
import json
import joblib
import datetime
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, precision_recall_curve, auc, confusion_matrix
)
import xgboost as xgb

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.features import SIF_FEATURE_COLUMNS, DEFAULT_MISSING_VALUE
from app.ml.preprocessor import fit_sif_preprocessor
from app.core.config import settings

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))
MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../app/ml/models/sif"))
os.makedirs(MODEL_DIR, exist_ok=True)


def train_sif_xgboost():
    print("=" * 60)
    print("SIF-Guard Offline XGBoost Classifier Training Pipeline")
    print("=" * 60)

    train_path = os.path.join(DATA_DIR, "sif_guard_train.csv")
    val_path = os.path.join(DATA_DIR, "sif_guard_validation.csv")
    test_path = os.path.join(DATA_DIR, "sif_guard_test.csv")

    if not os.path.exists(train_path):
        print(f"Dataset files missing in {DATA_DIR}. Generating synthetic dataset first...")
        from scripts.generate_sif_dataset import generate_dataset
        generate_dataset(5000)

    print(f"\n1. Loading datasets...")
    df_train = pd.read_csv(train_path).fillna(DEFAULT_MISSING_VALUE)
    df_val = pd.read_csv(val_path).fillna(DEFAULT_MISSING_VALUE)
    df_test = pd.read_csv(test_path).fillna(DEFAULT_MISSING_VALUE)

    # Validate feature columns present
    for col in SIF_FEATURE_COLUMNS:
        if col not in df_train.columns:
            raise ValueError(f"Missing required feature column '{col}' in training dataset.")

    # Validate TARGET is separated
    target_col = "sif_potential"
    if target_col not in df_train.columns:
        raise ValueError(f"Target column '{target_col}' missing.")

    print(f"   Train samples      : {len(df_train)}")
    print(f"   Validation samples : {len(df_val)}")
    print(f"   Test samples       : {len(df_test)}")

    X_train_df = df_train[SIF_FEATURE_COLUMNS]
    y_train = df_train[target_col].astype(int).values

    X_val_df = df_val[SIF_FEATURE_COLUMNS]
    y_val = df_val[target_col].astype(int).values

    X_test_df = df_test[SIF_FEATURE_COLUMNS]
    y_test = df_test[target_col].astype(int).values

    # Fit preprocessor STRICTLY on X_train to prevent data leakage
    print(f"\n2. Fitting OneHotEncoder preprocessor strictly on X_train...")
    preprocessor = fit_sif_preprocessor(df_train)

    X_train_trans = preprocessor.transform(X_train_df)
    X_val_trans = preprocessor.transform(X_val_df)
    X_test_trans = preprocessor.transform(X_test_df)

    encoded_feature_count = X_train_trans.shape[1]
    print(f"   Encoded feature vector dimension: {encoded_feature_count}")

    # Train XGBoost Classifier
    print(f"\n3. Training XGBClassifier model...")
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

    model.fit(
        X_train_trans,
        y_train,
        eval_set=[(X_val_trans, y_val)],
        verbose=False
    )

    print(f"   Best iteration: {model.best_iteration}")

    # Evaluate on Test Split
    print(f"\n4. Evaluating model on held-out test split...")
    test_probs = model.predict_proba(X_test_trans)[:, 1]
    test_preds = (test_probs >= 0.50).astype(int)

    acc = accuracy_score(y_test, test_preds)
    prec = precision_score(y_test, test_preds, zero_division=0)
    rec = recall_score(y_test, test_preds, zero_division=0)
    f1 = f1_score(y_test, test_preds, zero_division=0)
    roc_auc = roc_auc_score(y_test, test_probs)

    precision_curve, recall_curve, _ = precision_recall_curve(y_test, test_probs)
    pr_auc = auc(recall_curve, precision_curve)

    tn, fp, fn, tp = confusion_matrix(y_test, test_preds).ravel()
    fn_rate = fn / (fn + tp) if (fn + tp) > 0 else 0.0

    print("\n   --- TEST EVALUATION METRICS ---")
    print(f"   Accuracy             : {acc:.4f}")
    print(f"   Precision            : {prec:.4f}")
    print(f"   Recall (TPR)         : {rec:.4f}")
    print(f"   F1 Score             : {f1:.4f}")
    print(f"   ROC-AUC              : {roc_auc:.4f}")
    print(f"   PR-AUC               : {pr_auc:.4f}")
    print(f"   False Negatives (FN) : {fn}  (FN Rate: {fn_rate:.4f})")
    print(f"   False Positives (FP) : {fp}")
    print(f"   True Positives  (TP) : {tp}")
    print(f"   True Negatives  (TN) : {tn}")

    # Evaluate Counterfactual Pairs in Test Set
    if "pair_id" in df_test.columns:
        df_test_pairs = df_test[df_test["pair_id"] != "none"]
        if len(df_test_pairs) > 0:
            pair_ids = df_test_pairs["pair_id"].unique()
            correct_pairs = 0
            total_pairs = 0
            for pid in pair_ids:
                pair_rows = df_test[df_test["pair_id"] == pid]
                if len(pair_rows) == 2:
                    total_pairs += 1
                    sif_row = pair_rows[pair_rows["sif_potential"] == 1]
                    safe_row = pair_rows[pair_rows["sif_potential"] == 0]
                    
                    sif_trans = preprocessor.transform(sif_row[SIF_FEATURE_COLUMNS])
                    safe_trans = preprocessor.transform(safe_row[SIF_FEATURE_COLUMNS])
                    
                    prob_sif = model.predict_proba(sif_trans)[0][1]
                    prob_safe = model.predict_proba(safe_trans)[0][1]

                    if prob_sif > prob_safe:
                        correct_pairs += 1

            cf_accuracy = (correct_pairs / total_pairs) if total_pairs > 0 else 1.0
            print(f"   Counterfactual Pair Accuracy: {cf_accuracy:.4f} ({correct_pairs}/{total_pairs} pairs)")
        else:
            cf_accuracy = 1.0
    else:
        cf_accuracy = 1.0

    # 5. Persist Model Artifacts
    print(f"\n5. Persisting model artifacts to {MODEL_DIR}...")
    model_path = os.path.join(MODEL_DIR, "xgboost_model.json")
    preprocessor_path = os.path.join(MODEL_DIR, "preprocessor.joblib")
    feature_schema_path = os.path.join(MODEL_DIR, "feature_schema.json")
    metrics_path = os.path.join(MODEL_DIR, "metrics.json")
    metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")

    # Save XGBoost booster model
    model.save_model(model_path)
    print(f"   Saved model        -> {model_path}")

    # Save sklearn preprocessor
    joblib.dump(preprocessor, preprocessor_path)
    print(f"   Saved preprocessor -> {preprocessor_path}")

    # Save feature schema
    feature_schema = {
        "features": SIF_FEATURE_COLUMNS,
        "target": target_col,
        "missing_value_strategy": DEFAULT_MISSING_VALUE
    }
    with open(feature_schema_path, "w") as f:
        json.dump(feature_schema, f, indent=2)
    print(f"   Saved schema       -> {feature_schema_path}")

    # Save evaluation metrics
    metrics_data = {
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "f1": float(f1),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc),
        "false_negatives": int(fn),
        "false_positives": int(fp),
        "true_positives": int(tp),
        "true_negatives": int(tn),
        "false_negative_rate": float(fn_rate),
        "counterfactual_pair_accuracy": float(cf_accuracy)
    }
    with open(metrics_path, "w") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"   Saved metrics      -> {metrics_path}")

    # Save model metadata
    metadata = {
        "model_type": "xgboost",
        "model_version": "1.0.0",
        "training_timestamp": datetime.datetime.utcnow().isoformat(),
        "training_rows": len(df_train),
        "validation_rows": len(df_val),
        "test_rows": len(df_test),
        "xgboost_version": xgb.__version__,
        "encoded_feature_count": encoded_feature_count,
        "operating_thresholds": {
            "high_risk": settings.SIF_HIGH_THRESHOLD,
            "uncertain": settings.SIF_UNCERTAIN_THRESHOLD
        },
        "warning": "Initial XGBoost model trained on synthetic safety data for prototype validation."
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"   Saved metadata     -> {metadata_path}")

    print("\nTraining & artifact generation complete successfully!")


if __name__ == "__main__":
    train_sif_xgboost()
