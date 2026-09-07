import os
import sys
import json
import numpy as np

# Ensure app path in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal, Base, engine
from app.db.models.report import SafetyReport
from app.db.models.registry import ModelRegistry
from app.services.extraction.service import extraction_service
from app.services.sif.weak_rules import weak_rules_engine
from app.services.sif.classifier import sif_classifier
from app.services.embeddings.service import embedding_service
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, precision_recall_curve, auc

try:
    import xgboost as xgb
    HAS_XGB = True
except Exception:
    HAS_XGB = False


def train_model():
    print("Initializing DB for training dataset extraction...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    reports = db.query(SafetyReport).all()
    if not reports:
        print("No reports found in DB. Please run import first.")
        return

    print(f"Extracting features and weak supervision labels for {len(reports)} reports...")
    X_features = []
    y_labels = []

    for r in reports:
        extraction = extraction_service.extract(r.report_text, r.raw_data)
        emb = r.embedding or embedding_service.encode(r.report_text)
        struct_feats = sif_classifier.extract_structured_features(r.report_text, extraction, r.raw_data)
        
        feat_vector = emb + struct_feats
        
        rule_label, _, _ = weak_rules_engine.evaluate(r.report_text, extraction, r.raw_data)
        if rule_label == "SIF_POTENTIAL":
            label = 1
        elif rule_label == "NON_SIF":
            label = 0
        else:
            # Uncertain / skip for supervised training seed
            continue

        X_features.append(feat_vector)
        y_labels.append(label)

    db.close()

    if len(X_features) < 10:
        print("Not enough labeled training samples to train XGBoost model.")
        return

    X = np.array(X_features, dtype=np.float32)
    y = np.array(y_labels, dtype=int)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print(f"Training XGBoost model on {len(X_train)} samples, validating on {len(X_test)} samples...")

    if HAS_XGB:
        dtrain = xgb.DMatrix(X_train, label=y_train)
        dtest = xgb.DMatrix(X_test, label=y_test)

        params = {
            "objective": "binary:logistic",
            "eval_metric": ["logloss", "aucpr"],
            "max_depth": 5,
            "eta": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "seed": 42
        }

        booster = xgb.train(params, dtrain, num_boost_round=100, evals=[(dtest, "test")], verbose_eval=False)

        preds_prob = booster.predict(dtest)
        preds_binary = (preds_prob >= 0.50).astype(int)

        prec = precision_score(y_test, preds_binary, zero_division=0)
        rec = recall_score(y_test, preds_binary, zero_division=0)
        f1 = f1_score(y_test, preds_binary, zero_division=0)
        
        try:
            roc = roc_auc_score(y_test, preds_prob)
        except Exception:
            roc = 0.5

        precision_curve, recall_curve, _ = precision_recall_curve(y_test, preds_prob)
        pr_auc = auc(recall_curve, precision_curve)

        metrics = {
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "roc_auc": float(roc),
            "pr_auc": float(pr_auc)
        }

        print("\nModel Evaluation Metrics:")
        print(f"  Precision : {prec:.4f}")
        print(f"  Recall    : {rec:.4f}")
        print(f"  F1 Score  : {f1:.4f}")
        print(f"  ROC-AUC   : {roc:.4f}")
        print(f"  PR-AUC    : {pr_auc:.4f}")

        # Ensure output directory exists
        os.makedirs(os.path.dirname(sif_classifier.model_path), exist_ok=True)
        booster.save_model(sif_classifier.model_path)
        print(f"Model saved to {sif_classifier.model_path}")

        # Update registry
        db = SessionLocal()
        existing_reg = db.query(ModelRegistry).filter(ModelRegistry.model_name == "sif-xgboost-v1").first()
        if existing_reg:
            existing_reg.metrics = metrics
            existing_reg.active = True
        else:
            reg_obj = ModelRegistry(
                id="sif_xgboost_v1",
                model_name="sif-xgboost-v1",
                model_type="XGBoost",
                version="1.0.0",
                path=sif_classifier.model_path,
                metrics=metrics,
                active=True
            )
            db.add(reg_obj)
        db.commit()
        db.close()


if __name__ == "__main__":
    train_model()
