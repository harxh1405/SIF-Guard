import os
import sys
import json
from collections import Counter
from sqlalchemy import func

# Ensure app path in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal, engine
from app.db.models.report import SafetyReport
from app.db.models.analysis import ReportAnalysis


def run_database_audit():
    db = SessionLocal()
    try:
        total_reports = db.query(SafetyReport).count()
        print(f"==================================================")
        print(f"DATABASE INVENTORY AUDIT REPORT")
        print(f"==================================================")
        print(f"Total Safety Reports in DB: {total_reports}\n")

        # 1. Group by source_dataset
        sources = db.query(SafetyReport.source_dataset, func.count(SafetyReport.id)).group_by(SafetyReport.source_dataset).all()
        print("1. Reports Grouped by source_dataset:")
        for src, count in sources:
            print(f"  - {src}: {count}")
        print()

        # 2. Group by Prefix (BFT-*, REC-BFT-*, OSHA-*, etc.)
        all_reports = db.query(SafetyReport).all()
        prefix_counter = Counter()
        origin_classification = Counter()

        audit_table_rows = []

        for r in all_reports:
            rec_id = r.source_record_id or r.id
            if rec_id.startswith("BFT-"):
                prefix = "BFT-*"
                origin = "synthetic_test"
            elif rec_id.startswith("REC-BFT-") or "BFT-" in rec_id:
                prefix = "REC-BFT-*"
                origin = "synthetic_test"
            elif rec_id.startswith("RAW-"):
                prefix = "RAW-*"
                origin = "manual"
            elif rec_id.startswith("OCR-"):
                prefix = "OCR-*"
                origin = "ocr"
            elif r.source_dataset == "osha_severe" or r.source_dataset == "osha_construction":
                prefix = "OSHA-*"
                origin = "osha"
            else:
                prefix = "OTHER"
                origin = "unknown"

            prefix_counter[prefix] += 1
            origin_classification[origin] += 1

            if origin in ("synthetic_test", "manual", "ocr") or "bft" in rec_id.lower():
                audit_table_rows.append({
                    "id": r.id,
                    "source_record_id": r.source_record_id,
                    "source_dataset": r.source_dataset,
                    "origin": origin,
                    "site": r.site,
                    "report_type": r.report_type,
                    "sif_potential": r.sif_potential,
                    "sif_score": r.sif_score,
                    "sif_confidence": r.sif_confidence,
                    "created_at": str(r.created_at),
                })

        print("2. Reports Grouped by Record ID Prefix:")
        for pfx, count in prefix_counter.items():
            print(f"  - {pfx}: {count}")
        print()

        print("3. Inferred Data Origin Breakdown:")
        for orig, count in origin_classification.items():
            print(f"  - {orig}: {count}")
        print()

        # 4. Group by Site
        sites = db.query(SafetyReport.site, func.count(SafetyReport.id)).group_by(SafetyReport.site).all()
        print("4. Reports Grouped by Site:")
        for site, count in sites:
            print(f"  - {site or 'Unspecified'}: {count}")
        print()

        # 5. Group by SIF Classification
        sifs = db.query(SafetyReport.sif_potential, func.count(SafetyReport.id)).group_by(SafetyReport.sif_potential).all()
        print("5. Reports Grouped by SIF Classification:")
        for sif, count in sifs:
            print(f"  - {sif or 'UNCLASSIFIED'}: {count}")
        print()

        print(f"==================================================")
        print(f"DETAILED SUSPICIOUS / SYNTHETIC TEST RECORD AUDIT ({len(audit_table_rows)} records)")
        print(f"==================================================")
        print(json.dumps(audit_table_rows, indent=2))

    finally:
        db.close()


if __name__ == "__main__":
    run_database_audit()
