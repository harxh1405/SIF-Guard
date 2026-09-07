from typing import List, Dict, Any
from collections import Counter
import numpy as np
from sqlalchemy.orm import Session
from app.db.models.report import SafetyReport
from app.db.models.clustering import PrecursorCluster
from app.services.embeddings.service import embedding_service
from app.core.logging import logger

try:
    import hdbscan
    HAS_HDBSCAN = True
except ImportError:
    HAS_HDBSCAN = False

from sklearn.cluster import KMeans


class PrecursorClusteringService:

    def cluster_reports(self, db: Session, min_cluster_size: int = 3) -> List[Dict[str, Any]]:
        reports = db.query(SafetyReport).all()
        if len(reports) < min_cluster_size:
            logger.warning(f"Not enough reports ({len(reports)}) to perform clustering (min: {min_cluster_size}).")
            return []

        embeddings = []
        valid_reports = []
        for r in reports:
            emb = r.embedding or embedding_service.encode(r.report_text)
            embeddings.append(emb)
            valid_reports.append(r)

        X = np.array(embeddings)

        if HAS_HDBSCAN and len(valid_reports) >= min_cluster_size * 2:
            clusterer = hdbscan.HDBSCAN(min_cluster_size=min_cluster_size, metric='euclidean')
            labels = clusterer.fit_predict(X)
        else:
            k = min(max(2, len(valid_reports) // 4), 8)
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X)

        # Clear old cluster definitions
        db.query(PrecursorCluster).delete()

        cluster_groups: Dict[int, List[SafetyReport]] = {}
        for label, report in zip(labels, valid_reports):
            if label not in cluster_groups:
                cluster_groups[label] = []
            cluster_groups[label].append(report)

        created_clusters = []
        for cid, group in cluster_groups.items():
            if cid == -1: # Noise in HDBSCAN
                continue

            total_count = len(group)
            sif_count = sum(1 for r in group if r.sif_potential == "SIF_POTENTIAL")
            sif_density = round(sif_count / total_count if total_count > 0 else 0.0, 4)

            activities = [r.activity for r in group if r.activity]
            hazards = [r.hazard for r in group if r.hazard]
            barriers = [r.barrier for r in group if r.barrier]
            failures = [r.barrier_failure for r in group if r.barrier_failure]
            lsrs = []
            for r in group:
                if r.life_saving_rules and isinstance(r.life_saving_rules, list):
                    for item in r.life_saving_rules:
                        if isinstance(item, dict) and "rule_name" in item:
                            lsrs.append(item["rule_name"])
                        elif isinstance(item, str):
                            lsrs.append(item)

            dom_activity = Counter(activities).most_common(1)[0][0] if activities else "General Activity"
            dom_hazard = Counter(hazards).most_common(1)[0][0] if hazards else "Unspecified Hazard"
            dom_barrier = Counter(barriers).most_common(1)[0][0] if barriers else "Safety Barrier"
            dom_failure = Counter(failures).most_common(1)[0][0] if failures else "Barrier Defect"
            dom_lsr = Counter(lsrs).most_common(1)[0][0] if lsrs else "Life-Saving Rule"

            cluster_name = f"{dom_activity} incidents involving {dom_hazard}"

            cluster_obj = PrecursorCluster(
                id=f"cluster_{cid}",
                cluster_id=int(cid),
                name=cluster_name,
                description=f"Recurring precursor pattern around {dom_failure} during {dom_activity}.",
                report_count=total_count,
                sif_precursor_count=sif_count,
                sif_density=sif_density,
                dominant_activity=dom_activity,
                dominant_hazard=dom_hazard,
                dominant_barrier=dom_barrier,
                dominant_barrier_failure=dom_failure,
                dominant_lsr=dom_lsr,
                representative_report_ids=[r.id for r in group[:5]]
            )
            db.add(cluster_obj)
            created_clusters.append({
                "cluster_id": cid,
                "name": cluster_name,
                "report_count": total_count,
                "sif_precursor_count": sif_count,
                "sif_density": sif_density,
                "dominant_activity": dom_activity,
                "dominant_hazard": dom_hazard,
                "dominant_barrier_failure": dom_failure,
                "dominant_lsr": dom_lsr
            })

        db.commit()
        return created_clusters


clustering_service = PrecursorClusteringService()
