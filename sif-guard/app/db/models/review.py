import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class SIFLabel(Base):
    __tablename__ = "sif_labels"

    id = Column(String(64), primary_key=True, index=True)
    report_id = Column(String(64), ForeignKey("safety_reports.id"), nullable=False, index=True)
    label = Column(String(32), nullable=False) # SIF_POTENTIAL, NON_SIF, UNCERTAIN
    confidence = Column(Float, default=1.0)
    source = Column(String(64), nullable=False) # outcome_based, weak_rule, expert_review, manual, model_generated
    reviewer = Column(String(128), nullable=True)
    comments = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    report = relationship("SafetyReport", back_populates="reviews")
