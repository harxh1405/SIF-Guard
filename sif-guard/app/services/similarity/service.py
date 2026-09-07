from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.db.models.report import SafetyReport
from app.services.embeddings.service import embedding_service


class SimilarityService:

    def find_similar_reports(
        self,
        db: Session,
        target_report: SafetyReport,
        limit: int = 5,
        site_filter: Optional[str] = None,
        activity_filter: Optional[str] = None,
        hazard_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        
        target_emb = target_report.embedding
        if not target_emb:
            target_emb = embedding_service.encode(target_report.report_text)

        query = db.query(SafetyReport).filter(SafetyReport.id != target_report.id)

        if site_filter:
            query = query.filter(SafetyReport.site == site_filter)
        if activity_filter:
            query = query.filter(SafetyReport.activity == activity_filter)
        if hazard_filter:
            query = query.filter(SafetyReport.hazard == hazard_filter)

        candidates = query.all()
        if not candidates:
            return []

        target_vec = np.array(target_emb)
        norm_target = np.linalg.norm(target_vec)

        scored_candidates = []
        for cand in candidates:
            cand_emb = cand.embedding
            if not cand_emb:
                cand_emb = embedding_service.encode(cand.report_text)
            
            cand_vec = np.array(cand_emb)
            norm_cand = np.linalg.norm(cand_vec)

            sim = np.dot(target_vec, cand_vec) / (norm_target * norm_cand) if norm_target > 0 and norm_cand > 0 else 0.0
            
            scored_candidates.append({
                "id": cand.id,
                "source_record_id": cand.source_record_id,
                "report_text": cand.report_text[:200] + "...",
                "activity": cand.activity,
                "hazard": cand.hazard,
                "barrier_failure": cand.barrier_failure,
                "sif_potential": cand.sif_potential,
                "similarity": round(float(sim), 4)
            })

        scored_candidates.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_candidates[:limit]


similarity_service = SimilarityService()
