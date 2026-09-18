import os
import sys
from sqlalchemy import text

# Ensure app path in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal, engine, Base
import app.db.models
from app.db.models.report import SafetyReport
from app.db.models.analysis import ReportAnalysis


def cleanup_synthetic_records():
    print("Executing synthetic record cleanup and schema update...")

    # 1. Add data_origin column if missing in SQLite
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE safety_reports ADD COLUMN data_origin VARCHAR(32) DEFAULT 'oil_hsse';"))
            conn.commit()
            print("Added 'data_origin' column to safety_reports table.")
        except Exception:
            # Column already exists
            pass

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Find synthetic test records
        all_reports = db.query(SafetyReport).all()
        deleted_count = 0

        for r in all_reports:
            rec_id = (r.source_record_id or r.id).lower()
            if rec_id.startswith(("bft-", "rec-bft-")) or "bft" in rec_id or r.site == "Test Facility":
                print(f"Deleting synthetic test record: {r.id} ({r.source_record_id})")
                db.query(ReportAnalysis).filter(ReportAnalysis.report_id == r.id).delete()
                db.delete(r)
                deleted_count += 1
            else:
                if rec_id.startswith("raw-"):
                    r.data_origin = "manual"
                elif rec_id.startswith("ocr-"):
                    r.data_origin = "ocr"
                elif r.source_dataset in ("osha_severe", "osha_construction"):
                    r.data_origin = "osha"
                else:
                    r.data_origin = "oil_hsse"

        db.commit()
        print(f"\nCleanup complete. Successfully deleted {deleted_count} synthetic test records.")
        remaining = db.query(SafetyReport).count()
        print(f"Remaining active reports in DB: {remaining}")
    except Exception as e:
        db.rollback()
        print(f"Error during synthetic record cleanup: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    cleanup_synthetic_records()
