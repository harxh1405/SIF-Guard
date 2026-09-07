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
        if len(reports) < 2:
            logger.warning(f"Not enough reports ({len(reports)}) to perform clustering.")
            return []

        # 1. Batch encode any un-embedded reports and persist to DB
        unencoded = [r for r in reports if not r.embedding]
        if unencoded:
            logger.info(f"Batch encoding {len(unencoded)} un-embedded reports for clustering...")
            unencoded_texts = [r.report_text for r in unencoded]
            batch_vecs = embedding_service.encode_batch(unencoded_texts)
            for r, vec in zip(unencoded, batch_vecs):
                r.embedding = vec
            db.commit()

        embeddings = []
        valid_reports = []
        for r in reports:
            if r.embedding:
                embeddings.append(r.embedding)
                valid_reports.append(r)

        if len(valid_reports) < 2:
            return []

        X = np.array(embeddings, dtype=np.float32)
        # L2 normalization for cosine similarity compatibility with Euclidean distance
        norms = np.linalg.norm(X, axis=1, keepdims=True)
        norms[norms == 0] = 1e-10
        X_norm = X / norms

        # 2. Perform HDBSCAN or KMeans clustering
        labels = None
        eff_min_size = max(2, min(min_cluster_size, len(valid_reports) // 2))

        if HAS_HDBSCAN and len(valid_reports) >= 4:
            try:
                clusterer = hdbscan.HDBSCAN(
                    min_cluster_size=eff_min_size,
                    min_samples=1,
                    metric='euclidean',
                    cluster_selection_epsilon=0.35
                )
                raw_labels = clusterer.fit_predict(X_norm)
                non_noise = set(l for l in raw_labels if l != -1)
                
                if len(non_noise) > 0:
                    labels = np.array(raw_labels, copy=True)
                    # Reassign noise (-1) points to closest cluster centroid if similarity is sufficiently high
                    centroids = {}
                    for cid in non_noise:
                        centroids[cid] = np.mean(X_norm[labels == cid], axis=0)

                    for idx, label in enumerate(labels):
                        if label == -1:
                            best_cid = -1
                            best_sim = -1.0
                            vec = X_norm[idx]
                            for cid, c_vec in centroids.items():
                                sim = float(np.dot(vec, c_vec))
                                if sim > best_sim:
                                    best_sim = sim
                                    best_cid = cid
                            if best_sim >= 0.60:
                                labels[idx] = best_cid
                else:
                    logger.info("HDBSCAN resulted in 0 non-noise clusters. Falling back to KMeans.")
            except Exception as e:
                logger.warning(f"HDBSCAN clustering execution failed ({e}), falling back to KMeans.")

        if labels is None or len(set(l for l in labels if l != -1)) == 0:
            k = max(2, min(6, len(valid_reports) // 2))
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_norm)

        # 3. Clear old cluster definitions
        db.query(PrecursorCluster).delete()

        cluster_groups: Dict[int, List[SafetyReport]] = {}
        for label, report in zip(labels, valid_reports):
            cid = int(label)
            if cid not in cluster_groups:
                cluster_groups[cid] = []
            cluster_groups[cid].append(report)

        created_clusters = []
        for cid, group in cluster_groups.items():
            cid_int = int(cid)
            if cid_int == -1: # Unassigned noise in HDBSCAN
                continue

            total_count = int(len(group))
            sif_count = int(sum(1 for r in group if r.sif_potential == "SIF_POTENTIAL"))
            sif_density = float(round(sif_count / total_count if total_count > 0 else 0.0, 4))

            activities = [str(r.activity) for r in group if r.activity]
            hazards = [str(r.hazard) for r in group if r.hazard]
            barriers = [str(r.barrier) for r in group if r.barrier]
            failures = [str(r.barrier_failure) for r in group if r.barrier_failure]
            lsrs = []
            for r in group:
                if r.life_saving_rules and isinstance(r.life_saving_rules, list):
                    for item in r.life_saving_rules:
                        if isinstance(item, dict) and "rule_name" in item:
                            lsrs.append(str(item["rule_name"]))
                        elif isinstance(item, str):
                            lsrs.append(item)

            dom_activity = str(Counter(activities).most_common(1)[0][0]) if activities else "General Activity"
            dom_hazard = str(Counter(hazards).most_common(1)[0][0]) if hazards else "Unspecified Hazard"
            dom_barrier = str(Counter(barriers).most_common(1)[0][0]) if barriers else "Safety Barrier"
            dom_failure = str(Counter(failures).most_common(1)[0][0]) if failures else "Barrier Defect"
            dom_lsr = str(Counter(lsrs).most_common(1)[0][0]) if lsrs else "Life-Saving Rule"

            cluster_name = f"{dom_activity} incidents involving {dom_hazard}"
            desc = f"Recurring precursor pattern around {dom_failure} during {dom_activity}."

            cluster_obj = PrecursorCluster(
                id=f"cluster_{cid_int}",
                cluster_id=cid_int,
                name=cluster_name,
                description=desc,
                report_count=total_count,
                sif_precursor_count=sif_count,
                sif_density=sif_density,
                dominant_activity=dom_activity,
                dominant_hazard=dom_hazard,
                dominant_barrier=dom_barrier,
                dominant_barrier_failure=dom_failure,
                dominant_lsr=dom_lsr,
                representative_report_ids=[str(r.id) for r in group[:5]]
            )
            db.add(cluster_obj)
            created_clusters.append({
                "id": f"cluster_{cid_int}",
                "cluster_id": cid_int,
                "name": cluster_name,
                "description": desc,
                "report_count": total_count,
                "sif_precursor_count": sif_count,
                "sif_density": sif_density,
                "dominant_activity": dom_activity,
                "dominant_hazard": dom_hazard,
                "dominant_barrier": dom_barrier,
                "dominant_barrier_failure": dom_failure,
                "dominant_lsr": dom_lsr,
                "representative_report_ids": [str(r.id) for r in group[:5]]
            })

        db.commit()
        return created_clusters


clustering_service = PrecursorClusteringService()
