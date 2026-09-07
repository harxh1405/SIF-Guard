# SIF-Guard: AI/NLP-Powered Serious Injury & Fatality Precursor Intelligence Platform

[![Oil India Limited](https://img.shields.io/badge/Oil%20India%20Limited-OIL%20HSSE-blue.svg)](https://www.oil-india.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **SIF-Guard** is an enterprise-grade AI and NLP platform built for **Oil India Limited (OIL)** to transform unstructured safety observation reports, near-miss records, unsafe acts, and incident logs into actionable precursor intelligence. The platform automatically flags high-potential Serious Injury & Fatality (SIF) events, maps relevant **IOGP Life-Saving Rules**, extracts 10 core safety dimensions, clusters recurring precursor patterns using HDBSCAN, and visualizes precursor density across operational sites.

---

## 🌟 Executive Overview

In complex oil and gas exploration, drilling, production, and refining environments, traditional safety reporting often treats high-frequency low-severity incidents (e.g., minor cuts or slips) similarly to critical near-misses that possess severe consequence potential.

**SIF-Guard** solves this by enforcing the fundamental principle: **`Actual Outcome != Potential Outcome`**.

### Core Platform Capabilities

1. **Explainable SIF Classifier & Weak Supervision**:
   - Combines 16 domain-specific rules (confined space without gas test, suspended load, live electrical work without LOTO, elevated work without fall protection) with dense vector representations and an **XGBoost Classifier** to deliver explainable SIF potential probabilities.
2. **IOGP Life-Saving Rules (LSR) Alignment Engine**:
   - Maps unstructured report text against all 9 canonical **IOGP Life-Saving Rules** using vector similarity (`bge-base-en-v1.5`) augmented with keyword boosting.
3. **10-Dimension NLP Attribute Extractor**:
   - Extracts structured safety parameters: *Activity*, *Hazard*, *Hazardous Substance*, *Exposure*, *Energy Source*, *Equipment*, *Human Factor*, *Environmental Factor*, *Missing/Bypassed Barrier*, and *Potential Consequence*.
4. **HDBSCAN Precursor Clustering & Fingerprinting**:
   - Groups related incidents across different drilling rigs and production OCS facilities into dense precursor clusters to highlight systemic hazards before incidents escalate into fatalities.
5. **Hotspot & Temporal Trend Analytics**:
   - Calculates precursor density scores across operational sites, activities, equipment, and Life-Saving Rules, tracking directional velocity (increasing/decreasing risk trends).
6. **Human-in-the-Loop Review Queue**:
   - Routes low-confidence or borderline SIF predictions to safety experts for validation and continuous active learning.

---

## 🏗️ Architecture & Monorepo Structure

```
OIL/
├── README.md                      # Comprehensive project documentation
├── .gitignore                     # Root Git ignore rules
├── sif-guard/                     # Backend Python / FastAPI Service
│   ├── app/
│   │   ├── api/routes/            # REST API endpoints (reports, analytics, LSR, review, etc.)
│   │   ├── core/                  # Configuration, security & logging
│   │   ├── db/                    # SQLAlchemy models & database connection
│   │   ├── schemas/               # Pydantic data schemas
│   │   └── services/              # ML, NLP, Extractor, Embeddings, SIF & Clustering services
│   │       ├── analytics/         # Hotspots & summary metrics
│   │       ├── clustering/        # HDBSCAN precursor pattern clustering
│   │       ├── embeddings/        # BGE dense vector embeddings
│   │       ├── extraction/        # 10-dimension safety attribute extractor
│   │       ├── fingerprint/       # Structured precursor fingerprints
│   │       ├── ingestion/         # Source adapters (OSHA Severe, OSHA Construction, OIL HSSE)
│   │       ├── lsr/               # IOGP Life-Saving Rules matcher
│   │       ├── preprocessing/     # Text cleaner & acronym expansion (LOTO, PTW, H2S, SIMOPS)
│   │       ├── sif/               # SIF weak supervision rules & XGBoost classifier
│   │       ├── similarity/        # Cosine similarity vector search
│   │       └── trends/            # Temporal trend analyzer
│   ├── tests/                     # Pytest automated test suite (100% pass rate)
│   ├── Dockerfile                 # Backend container definition
│   ├── docker-compose.yml         # Container orchestration with PostgreSQL + pgvector
│   └── pyproject.toml             # Python dependencies & metadata
└── sif-guard-frontend/            # Frontend React + TypeScript + Vite SPA
    ├── src/
    │   ├── api/                   # Strongly typed Axios HTTP clients
    │   ├── components/            # Reusable UI components & navigation
    │   ├── pages/                 # Full feature suite views
    │   │   ├── DashboardPage.tsx       # Executive KPI Dashboard
    │   │   ├── IngestionPage.tsx       # Data Ingestion & Batch Queue Center
    │   │   ├── ReportsExplorerPage.tsx # Detailed Intelligence & Modal Explorer
    │   │   ├── PrecursorClustersPage.tsx # HDBSCAN Precursor Pattern Clusters
    │   │   ├── AnalyticsPage.tsx       # Hotspot Charts & Trend Analytics
    │   │   ├── KnowledgeLSRPage.tsx    # IOGP LSR Reference & Sandbox
    │   │   └── ReviewQueuePage.tsx     # Safety Expert Review Queue
    │   └── types/                 # OpenAPI & TypeScript definitions
    ├── package.json               # Node.js dependencies & scripts
    └── vite.config.ts             # Vite build configuration
```

---

## 💻 Tech Stack

### Backend
- **Framework**: Python 3.11+, [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: SQLite (local development) / PostgreSQL + `pgvector` (production)
- **Machine Learning & NLP**:
  - `BAAI/bge-base-en-v1.5` dense embeddings via PyTorch / HuggingFace Transformers
  - `XGBoost` for explainable SIF scoring
  - `HDBSCAN` & `Scikit-learn` for unsupervised precursor clustering
  - `Pandas` for dataset ingestion adapters
- **Validation**: Pydantic v2
- **Testing**: Pytest

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling & Aesthetics**: Custom Dark Theme Design System featuring Oil India Navy tokens, glassmorphism card elevation, micro-animations
- **Charts & Data Visualization**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and `npm`
- Git

### 1. Backend Setup

```bash
# Navigate to backend directory
cd sif-guard

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt  # or pip install -e .

# Run database migrations / seed initial data (if applicable)
python scripts/seed_demo_data.py

# Launch FastAPI backend server
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at:
- **API Base URL**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd sif-guard-frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev -- --port 3000
```

The frontend application will be live at:
- `http://localhost:3000`

---

## 📊 Core Features & Screenshots

### 1. Executive Dashboard
Real-time KPI metrics showing Total Reports Ingested, SIF Precursor Count, SIF Rate %, Active Precursor Clusters, Top Emerging Precursor Patterns, and High-Risk Operational Sites.

### 2. Data Ingestion & Import Center
Supports multi-format ingestion (CSV, XLSX, JSON, JSONL) with custom source adapters (`osha_severe`, `osha_construction`, `oil_hsse`), interactive drag-and-drop file upload, 1-click sample dataset generation, and asynchronous background batch analysis queue triggers.

### 3. Incident & Observation Explorer
Searchable and filterable record table with granular intelligence modal view displaying:
- `Actual Outcome != Potential Outcome` contrast
- Risk score breakdown and rule triggers
- 10-Dimension Precursor Fingerprint grid
- Matched IOGP Life-Saving Rules with confidence scores
- Vector-similar historical reports

### 4. HDBSCAN Precursor Clusters
Visualizes automatically discovered precursor clusters, identifying systemic safety risks across facilities (e.g., *Confined Space H2S Gas Accumulation*, *Elevated Rig Scaffolding Drop Hazards*).

### 5. Hotspot & Temporal Analytics
Interactive Recharts visualizations covering Site SIF Precursor Density, Activity Risk Matrix, Missing Safety Barrier Distributions, and Directional Temporal Trends.

---

## 🧪 Testing

### Running Backend Unit & Integration Tests

```bash
cd sif-guard
source venv/bin/activate
pytest tests/ -v
```

**Test Results**:
```
11 passed in 16.97s
```

### Running Frontend Type-Check & Build Validation

```bash
cd sif-guard-frontend
npm run build
```

---

## 📄 License & Attribution

Developed for **Oil India Limited (OIL)** HSE Precursor Intelligence Platform. All rights reserved.
