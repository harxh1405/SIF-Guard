import os
import sys

# Ensure app path in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal, engine, Base
from app.db.models.lsr import LifeSavingRule
from app.db.models.terminology import Terminology
from app.db.models.knowledge import HSEKnowledge
from app.services.lsr.matcher import IOGP_LSR_DEFINITIONS
from app.services.preprocessing.cleaner import DEFAULT_TERMINOLOGY


def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Seed IOGP Life-Saving Rules
        print("Seeding IOGP Life-Saving Rules...")
        for rule_def in IOGP_LSR_DEFINITIONS:
            existing = db.query(LifeSavingRule).filter(LifeSavingRule.rule_code == rule_def["code"]).first()
            if not existing:
                rule_obj = LifeSavingRule(
                    id=f"lsr_{rule_def['code']}",
                    rule_code=rule_def["code"],
                    rule_name=rule_def["name"],
                    description=rule_def["description"],
                    keywords=rule_def["keywords"]
                )
                db.add(rule_obj)

        # Seed Terminology Dictionary
        print("Seeding HSE Terminology dictionary...")
        for term, expansion in DEFAULT_TERMINOLOGY.items():
            existing = db.query(Terminology).filter(Terminology.term == term).first()
            if not existing:
                term_obj = Terminology(
                    id=f"term_{term.lower()}",
                    term=term,
                    expansion=expansion,
                    category="general_hse"
                )
                db.add(term_obj)

        # Seed initial HSE knowledge item
        print("Seeding sample HSE Knowledge items...")
        existing_k = db.query(HSEKnowledge).filter(HSEKnowledge.id == "smartqhse_lsr_overview").first()
        if not existing_k:
            k_obj = HSEKnowledge(
                id="smartqhse_lsr_overview",
                source="smartqhse",
                title="IOGP 9 Life-Saving Rules Framework Overview",
                content="The IOGP Life-Saving Rules aim to prevent serious injuries and fatalities in oil & gas operations. Key rules cover Confined Space Entry, Line of Fire, Work at Height, Energy Isolation, and Hot Work.",
                category="standards"
            )
            db.add(k_obj)

        db.commit()
        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
