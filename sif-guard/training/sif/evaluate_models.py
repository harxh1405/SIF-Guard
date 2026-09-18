import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, precision_recall_curve, auc, confusion_matrix
)
import xgboost as xgb
from catboost import CatBoostClassifier, Pool

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.ml.features import SIF_FEATURE_COLUMNS, DEFAULT_MISSING_VALUE

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data"))
if not os.path.exists(DATA_DIR):
    DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data"))

MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../app/ml/models/sif"))


def evaluate_all_models():
    print("=" * 60)
    print("Evaluating XGBoost, CatBoost, and Hybrid Ensemble on Test Split")
    print("=" * 60)

    test_path = os.path.join(DATA_DIR, "sif_guard_test.csv")
    df_test = pd.read_csv(test_path).fillna(DEFAULT_MISSING_VALUE)
    for col in SIF_FEATURE_COLUMNS:
        df_test[col] = df_test[col].astype(str)

    X_test_raw = df_test[SIF_FEATURE_COLUMNS]
    y_test = df_test["sif_potential"].astype(int).values

    # 1. Load Preprocessor & XGBoost
    preprocessor = joblib.load(os.path.join(MODEL_DIR, "preprocessor.joblib"))
    X_test_trans = preprocessor.transform(X_test_raw)

    xgb_booster = xgb.Booster()
    xgb_booster.load_model(os.path.join(MODEL_DIR, "xgboost_model.json"))
    dtest = xgb.DMatrix(X_test_trans)
    xgb_probs = xgb_booster.predict(dtest)

    # 2. Load CatBoost
    cat_model = CatBoostClassifier()
    cat_model.load_model(os.path.join(MODEL_DIR, "catboost_model.cbm"))
    test_pool = Pool(X_test_raw, cat_features=SIF_FEATURE_COLUMNS)
    cat_probs = cat_model.predict_proba(test_pool)[:, 1]

    # 3. Ensemble (50/50 weighted combination)
    w_xgb, w_cat = 0.5, 0.5
    ens_probs = (w_xgb * xgb_probs) + (w_cat * cat_probs)

    def calc_metrics(y_true, probs):
        preds = (probs >= 0.50).astype(int)
        cm = confusion_matrix(y_true, preds).tolist()
        tn, fp, fn, tp = confusion_matrix(y_true, preds).ravel()
        p_prec, p_rec, _ = precision_recall_curve(y_true, probs)
        pr_auc_val = auc(p_rec, p_prec)

        return {
            "accuracy": round(float(accuracy_score(y_true, preds)), 4),
            "precision": round(float(precision_score(y_true, preds, zero_division=0)), 4),
            "recall": round(float(recall_score(y_true, preds, zero_division=0)), 4),
            "f1": round(float(f1_score(y_true, preds, zero_division=0)), 4),
            "roc_auc": round(float(roc_auc_score(y_true, probs)), 4),
            "pr_auc": round(float(pr_auc_val), 4),
            "confusion_matrix": cm,
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
            "true_negatives": int(tn)
        }

    xgb_metrics = calc_metrics(y_test, xgb_probs)
    cat_metrics = calc_metrics(y_test, cat_probs)
    ens_metrics = calc_metrics(y_test, ens_probs)

    results = {
        "xgboost": xgb_metrics,
        "catboost": cat_metrics,
        "ensemble": ens_metrics,
        "ensemble_weights": {"xgboost": w_xgb, "catboost": w_cat},
        "evaluation_samples": len(y_test)
    }

    metrics_path = os.path.join(MODEL_DIR, "metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    config_path = os.path.join(MODEL_DIR, "ensemble_config.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump({
            "xgboost_weight": w_xgb,
            "catboost_weight": w_cat,
            "high_threshold": 0.65,
            "uncertain_threshold": 0.35,
            "model_version": "1.1.0-hybrid"
        }, f, indent=2)

    print(f"\n--- Model Evaluation Results (Test Set N={len(y_test)}) ---")
    print(f"XGBoost  - F1: {xgb_metrics['f1']}, ROC-AUC: {xgb_metrics['roc_auc']}, FN: {xgb_metrics['false_negatives']}, FP: {xgb_metrics['false_positives']}")
    print(f"CatBoost - F1: {cat_metrics['f1']}, ROC-AUC: {cat_metrics['roc_auc']}, FN: {cat_metrics['false_negatives']}, FP: {cat_metrics['false_positives']}")
    print(f"Ensemble - F1: {ens_metrics['f1']}, ROC-AUC: {ens_metrics['roc_auc']}, FN: {ens_metrics['false_negatives']}, FP: {ens_metrics['false_positives']}")
    print(f"Exported metrics -> {metrics_path}")
    print(f"Exported ensemble config -> {config_path}")

    return results


if __name__ == "__main__":
    evaluate_all_models()
