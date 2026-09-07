from typing import List
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.lsr import LifeSavingRule
from app.schemas.lsr import LSRRead
from app.schemas.analysis import LSRMatchSchema
from app.services.lsr.matcher import lsr_matcher

router = APIRouter()


@router.get("/lsr/rules", response_model=List[LSRRead])
def get_lsr_rules(db: Session = Depends(get_db)):
    rules = db.query(LifeSavingRule).all()
    if not rules:
        # Fallback to in-memory definitions if DB not seeded yet
        return [
            LSRRead(
                id=f"lsr_{r['code']}",
                rule_code=r["code"],
                rule_name=r["name"],
                description=r["description"],
                keywords=r["keywords"],
                icon=None
            ) for r in lsr_matcher.rules
        ]
    return rules


@router.post("/lsr/map", response_model=List[LSRMatchSchema])
def map_text_to_lsr(text: str = Body(..., embed=True)):
    return lsr_matcher.map_report(text)
