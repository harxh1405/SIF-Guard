import os
import sys

# Ensure app path in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal, Base, engine
from app.services.clustering.service import clustering_service


def run_clustering():
    print("Initializing database connection...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Executing HDBSCAN report clustering...")
        clusters = clustering_service.cluster_reports(db)
        print(f"Clustering complete. Discovered {len(clusters)} recurring precursor pattern clusters:")
        for c in clusters:
            print(f"  [{c['cluster_id']}] {c['name']} (Count: {c['report_count']}, SIF Density: {c['sif_density']:.2%})")
    finally:
        db.close()


if __name__ == "__main__":
    run_clustering()
