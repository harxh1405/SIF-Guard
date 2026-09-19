# SIF-Guard Deployment Guide

This guide details how to deploy the **SIF-Guard Backend on Render** and the **SIF-Guard Frontend on Vercel**.

---

## 1. Backend Deployment on Render

### Option A: 1-Click Blueprint (Recommended)
Because this repository contains [`render.yaml`](./render.yaml), you can deploy via Render Blueprints:
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect the repository `harxh1405/SIF-Guard` and select branch `atul`.
4. Render will automatically parse `render.yaml`, configure Docker, and launch the `sif-guard-backend` service.

---

### Option B: Manual Web Service Deployment
1. Go to [Render Dashboard](https://dashboard.render.com) → Click **New +** → **Web Service**.
2. Select **Build and deploy from a Git repository** and connect `harxh1405/SIF-Guard`.
3. Fill in the service configuration:
   - **Name**: `sif-guard-backend` (or your preferred name)
   - **Region**: Oregon (US West) or any preferred region
   - **Branch**: `atul`
   - **Root Directory**: `sif-guard`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `Dockerfile` (or `./Dockerfile`)
   - **Instance Type**: Starter (or Free tier, recommend Starter for ML inference memory)
4. Under **Environment Variables**, configure:
   | Key | Value | Description |
   |---|---|---|
   | `PORT` | `10000` | Port Render routes to (handled dynamically by Docker) |
   | `ENVIRONMENT` | `production` | Production mode |
   | `DATABASE_URL` | `sqlite:///./sif_guard.db` | Or your PostgreSQL connection string |
   | `SIF_CLASSIFIER_MODE` | `xgboost` | AI classifier mode |
   | `OCR_PROVIDER` | `tesseract` | OCR engine |
   | `EMBEDDING_MODEL` | `BAAI/bge-base-en-v1.5` | Semantic embedding model |
5. Click **Create Web Service**.
6. Once deployed, note your service URL: `https://<your-service-name>.onrender.com`.
7. Verify health by opening: `https://<your-service-name>.onrender.com/api/v1/health`.

---

## 2. Frontend Deployment on Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New…** → **Project**.
3. Import the repository `harxh1405/SIF-Guard`.
4. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `sif-guard-frontend`
   - **Build Command**: `npm run build` (or leave default `tsc -b && vite build`)
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `VITE_API_BASE_URL` | `https://<your-render-backend>.onrender.com` | Your Render backend URL |
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Optional / Supabase URL |
   | `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Optional / Supabase public key |
6. Click **Deploy**.
7. Vercel will build the frontend with [`vercel.json`](./sif-guard-frontend/vercel.json), configuring client SPA routing and cache headers.

---

## 3. End-to-End Verification

1. Open your Vercel URL (e.g. `https://sif-guard-frontend.vercel.app`).
2. Navigate to **Capture & OCR** (`/capture-ocr` or `#capture-ocr`).
3. Enter a sample report or upload a test document/image to verify OCR and ML prediction:
   ```text
   During pipe replacement on unit 3, worker entered barricaded area underneath suspended valve load.
   ```
4. Confirm that the SIF probability score, barrier defect, and IOGP Life-Saving Rules populate correctly from your Render backend.
