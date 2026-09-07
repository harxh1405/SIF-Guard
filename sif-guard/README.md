# SIF-Guard — Serious Injury & Fatality (SIF) Precursor Intelligence Platform Backend

SIF-Guard is an AI/NLP-powered safety intelligence platform engineered for Oil India Limited (OIL). It ingests unstructured and semi-structured HSE incident narratives and observations to proactively detect Serious Injury & Fatality (SIF) precursors.

The core guiding principle is:
```
Actual Outcome != Potential Outcome
```
An event with zero actual injury (e.g. entering a confined vessel without atmospheric testing) is flagged as `SIF_POTENTIAL = YES`.

---

## Key Features

1. **Source Adapter Architecture (`DataSourceAdapter`)**:
   - `OSHASevereInjuryAdapter`: Ingests OSHA Severe Injury / Incident dataset.
   - `OSHAConstructionAdapter`: Ingests OSHA Construction dataset, preserving structured mechanism fields (`task_assigned`, `fat_cause`, `evn_factor`, `hum_factor`, `fall_ht`, `hazsub`).
   - `SmartQHSEAdapter`: Ingests HSE knowledge, IOGP Life-Saving Rules, and process safety standards.
   - `CSBAdapter`: Optional future adapter for Chemical Safety Board investigation reports.
   - `OILHSSEAdapter`: Adapter for Oil India Limited confidential Unsafe Act / Unsafe Condition / Near Miss datasets.

2. **Unified Safety Report (`SafetyReport`)**:
   - Standardized internal relational & vector model with raw metadata preservation.

3. **Domain Preprocessing & Terminology Expansion**:
   - Automatic acronym expansion (`LOTO`, `PTW`, `PPE`, `H2S`, `SIMOPS`, etc.) preserving domain-specific terms.

4. **NLP Extraction & Dense Vector Embeddings**:
   - Extracts activity, hazard, exposure, energy source, equipment, human/environmental factors, barriers, barrier failures, and potential consequences.
   - Embeddings generated via `BAAI/bge-base-en-v1.5` and indexed with `pgvector`.

5. **IOGP 9 Life-Saving Rules (LSR) Mapping**:
   - Automatic semantic similarity & keyword matching against IOGP 576 Life-Saving Rules.

6. **Explainable SIF Classification**:
   - XGBoost classifier combining dense embeddings + 16 structured precursor indicator flags.
   - Configurable weak supervision rules for strong precursor signals.
   - Returns classification (`SIF_POTENTIAL`, `NON_SIF`, `UNCERTAIN`), probability score, confidence score, and clear risk factors.

7. **Safety Precursor Fingerprints & Pattern Clustering**:
   - Generates `SafetyPrecursorFingerprint`.
   - Semantic similarity search over report embeddings.
   - HDBSCAN precursor clustering generating human-interpretable pattern labels.

8. **Trends & Hotspot Analytics**:
   - Precursor density calculation (`SIF Potential Reports / Total Reports`).
   - Temporal trend detection with z-score anomaly indicators.
   - Hotspot rankings for sites, activities, hazards, barriers, and Life-Saving Rules.

9. **Human-in-the-Loop Review**:
   - Review queue for uncertain reports with feedback loop for model retraining.

---

## Quickstart

### Local Setup with Virtual Environment
```bash
# 1. Activate virtual environment
source venv/bin/activate

# 2. Seed database with IOGP Life-Saving Rules and Terminology
python sif-guard/scripts/seed_data.py

# 3. Run test suite
pytest sif-guard/tests -v

# 4. Start API server
uvicorn sif-guard.app.main:app --reload --port 8000
```

### Docker Compose
```bash
docker compose up -d
```

---

## Interactive API Documentation
Access Swagger UI at:
`http://localhost:8000/docs`
