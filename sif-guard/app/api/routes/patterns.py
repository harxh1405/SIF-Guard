from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.report import SafetyReport
from app.db.models.clustering import PrecursorCluster
from app.services.similarity.service import similarity_service
from app.services.clustering.service import clustering_service

router = APIRouter()


@router.get("/reports/{report_id}/similar")
def get_similar_reports(
    report_id: str,
    limit: int = Query(5, ge=1, le=20),
    site: Optional[str] = None,
    activity: Optional[str] = None,
    hazard: Optional[str] = None,
    db: Session = Depends(get_db)
):
    report = db.query(SafetyReport).filter(SafetyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Safety report '{report_id}' not found")
    
    similar = similarity_service.find_similar_reports(
        db, report, limit=limit, site_filter=site, activity_filter=activity, hazard_filter=hazard
    )
    return {
        "report_id": report_id,
        "similar_reports": similar
    }


@router.get("/patterns/clusters")
def get_clusters(db: Session = Depends(get_db)):
    clusters = db.query(PrecursorCluster).order_by(PrecursorCluster.sif_density.desc()).all()
    return [{
        "id": c.id,
        "cluster_id": c.cluster_id,
        "name": c.name,
        "description": c.description,
        "report_count": c.report_count,
        "sif_precursor_count": c.sif_precursor_count,
        "sif_density": c.sif_density,
        "dominant_activity": c.dominant_activity,
        "dominant_hazard": c.dominant_hazard,
        "dominant_barrier": c.dominant_barrier,
        "dominant_barrier_failure": c.dominant_barrier_failure,
        "dominant_lsr": c.dominant_lsr,
        "representative_report_ids": c.representative_report_ids
    } for c in clusters]


@router.post("/patterns/cluster-now")
def trigger_clustering(min_cluster_size: int = 3, db: Session = Depends(get_db)):
    result = clustering_service.cluster_reports(db, min_cluster_size=min_cluster_size)
    return {
        "status": "success",
        "clusters_discovered": len(result),
        "clusters": result
    }
