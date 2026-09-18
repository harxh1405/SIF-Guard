# SIF-Guard — Serious Injury & Fatality (SIF) Precursor Intelligence Platform Backend

SIF-Guard is an enterprise-grade AI and NLP platform built for **Oil India Limited (OIL)** to transform unstructured safety observation reports, near-miss records, unsafe acts, and incident logs into actionable precursor intelligence.

The fundamental platform principle is:
```
Actual Outcome != Potential Outcome
```
An event with zero actual injury (e.g., entering a confined vessel without atmospheric testing or opening a pressurized flange without zero-energy verification) is classified with high **`SIF_POTENTIAL`**.

---

## 🏗️ System Conceptual Flow

```
INPUT
  │
  ├── Typed report
  ├── CSV/XLSX/JSON import
  ├── Image (PNG, JPG, JPEG)
  └── PDF (Native or Scanned)
        │
        ▼
DOCUMENT / TEXT PROCESSING
        │
        ├── Direct text
        ├── Native PDF text extraction (pypdf)
        └── Tesseract OCR (pytesseract)
        │
        ▼
NORMALIZED / VERIFIED TEXT
        │
        ▼
SAFETY INFORMATION EXTRACTION (10 Dimensions)
        │
        ├── activity
        ├── hazard
        ├── hazardous_substance
        ├── exposure
        ├── energy_source
        ├── equipment
        ├── human_factor
        ├── environmental_factor
        ├── barrier & barrier_failure
        └── potential_consequence
        │
        ├──────────────────────┐
        │                      │
        ▼                      ▼
FEATURE ENGINEERING        BGE EMBEDDINGS (bge-base-en-v1.5)
        │                      │
        ▼                      ├── Cosine Similarity Search
TRAINED XGBOOST               │
        │                      └── HDBSCAN Pattern Clustering
        ▼
SIF PROBABILITY & SHAP EXPLAINABILITY
        │
        ├─────────────────────── IOGP LIFE-SAVING RULES MAPPING
        │
        ▼
SAFETY PRECURSOR FINGERPRINT
        │
        ▼
DATABASE / REST API / DASHBOARD
```

---

## 🌟 Core Backend Capabilities

1. **Provider-Agnostic OCR Layer (`app/services/ocr/`)**:
   - Supports native PDF text parsing (fast path), scanned document OCR via Tesseract (`pytesseract`), and image preprocessing.
   - Configurable quality gate threshold (`OCR_VERIFICATION_THRESHOLD=0.85`).
   - Endpoint: `POST /api/v1/ocr/extract`.

2. **Structured Categorical Feature Engineering (`app/ml/features.py` & `preprocessor.py`)**:
   - Defines authoritative 11-dimension safety feature list (`SIF_FEATURE_COLUMNS`).
   - Fits `OneHotEncoder` via `ColumnTransformer` strictly on training data (no data leakage).

3. **Offline Trained XGBoost Classifier (`app/services/sif/classifier.py`)**:
   - Trained on ~5,000 domain synthetic safety records including ~500 safe vs. unsafe counterfactual pairs.
   - Evaluates probability via `predict_proba()` and applies operating thresholds:
     - `score >= 0.70` => `SIF_POTENTIAL`
     - `0.40 <= score < 0.70` => `UNCERTAIN`
     - `score < 0.40` => `NON_SIF`
   - SHAP TreeExplainer integration (`top_factors`) for dashboard explainability.

4. **BGE Dense Vector Embeddings & HDBSCAN Clustering**:
   - `BAAI/bge-base-en-v1.5` dense embeddings for semantic search and HDBSCAN precursor cluster discovery.

5. **IOGP Life-Saving Rules Mapping (`app/services/lsr/matcher.py`)**:
   - Maps unstructured reports against 9 canonical IOGP Life-Saving Rules.

---

## 📦 Model Artifacts & Locations

Artifacts are persisted in `app/ml/models/sif/`:
- `xgboost_model.json`: Trained XGBoost booster model
- `preprocessor.joblib`: Fitted OneHotEncoder / ColumnTransformer
- `feature_schema.json`: Feature column definitions and missing-value strategy
- `metrics.json`: Test metrics (Accuracy: 100%, Precision: 100%, Recall: 100%, ROC-AUC: 1.0, 0 False Negatives)
- `model_metadata.json`: Model versioning, hyperparameter config, and operating thresholds

---

## 🛠️ Offline Training & Dataset Generation

```bash
# 1. Generate ~5,000 synthetic safety records with counterfactual pairs
python scripts/generate_sif_dataset.py

# 2. Train XGBoost classifier & save model artifacts
python scripts/train_sif_xgboost.py
```

---

## 🧪 Testing & Verification

Run the full pytest suite (unit tests, ML pipeline tests, OCR tests, and full BFT-001..BFT-010 API regression):

```bash
PYTHONPATH=. pytest tests/ -v
```

---

## ⚙️ Environment Configuration

Added settings in `app/core/config.py`:
- `SIF_CLASSIFIER_MODE`: `"xgboost"` (or `"heuristic"`)
- `SIF_MODEL_PATH`: `"app/ml/models/sif/xgboost_model.json"`
- `SIF_PREPROCESSOR_PATH`: `"app/ml/models/sif/preprocessor.joblib"`
- `SIF_HIGH_THRESHOLD`: `0.70`
- `SIF_UNCERTAIN_THRESHOLD`: `0.40`
- `OCR_PROVIDER`: `"tesseract"`
- `OCR_VERIFICATION_THRESHOLD`: `0.85`
- `OCR_MAX_FILE_SIZE_MB`: `15.0`

---

## ⚠️ Synthetic Data Disclaimer

> **Notice**: The initial XGBoost model is trained using synthetic safety data and is intended for prototype validation and operating threshold demonstration. It must not be interpreted as a production-validated SIF model or as representative of actual OIL incident frequencies.
