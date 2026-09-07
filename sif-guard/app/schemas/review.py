from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ReviewCreate(BaseModel):
    label: str # SIF_POTENTIAL, NON_SIF, UNCERTAIN
    confidence: Optional[float] = 1.0
    reviewer: Optional[str] = "expert"
    comments: Optional[str] = None


class ReviewRead(BaseModel):
    id: str
    report_id: str
    label: str
    confidence: float
    source: str
    reviewer: Optional[str] = None
    comments: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
