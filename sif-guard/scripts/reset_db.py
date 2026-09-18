import os
import sys

# Ensure app path in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal, engine, Base
import app.db.models  # Import all models to register Base.metadata
from scripts.seed_data import seed_database


def reset_database():
    print("Dropping all existing database tables (reports, clusters, analysis results)...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Re-seeding reference rules and terminology...")
    seed_database()
    print("Database reset completed successfully. Ready for fresh testing.")


if __name__ == "__main__":
    reset_database()
