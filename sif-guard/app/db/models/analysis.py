import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class ReportAnalysis(Base):
    __tablename__ = "report_analysis"

    id = Column(String(64), primary_key=True, index=True)
    report_id = Column(String(64), ForeignKey("safety_reports.id"), nullable=False, unique=True, index=True)

    sif_classification = Column(String(32), nullable=False) # SIF_POTENTIAL, NON_SIF, UNCERTAIN
    sif_score = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)

    risk_factors = Column(JSON, nullable=False) # List[str]
    extraction = Column(JSON, nullable=False)   # Extracted fields dict
    life_saving_rules = Column(JSON, nullable=False) # LSR mapping results list
    fingerprint = Column(JSON, nullable=False) # SafetyPrecursorFingerprint dict

    catastrophic_similarity_score = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    report = relationship("SafetyReport", back_populates="analysis")
