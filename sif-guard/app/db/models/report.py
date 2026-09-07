import datetime
from sqlalchemy import Column, String, Float, DateTime, Text, JSON, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class SafetyReport(Base):
    __tablename__ = "safety_reports"

    id = Column(String(64), primary_key=True, index=True)
    source_dataset = Column(String(64), index=True, nullable=False)
    source_record_id = Column(String(128), index=True, nullable=False)

    report_type = Column(String(64), nullable=True, default="incident")
    report_text = Column(Text, nullable=False)
    report_summary = Column(Text, nullable=True)
    keywords = Column(Text, nullable=True)

    event_date = Column(DateTime, nullable=True, index=True)

    employer = Column(String(256), nullable=True)
    site = Column(String(256), nullable=True, index=True)
    location = Column(String(256), nullable=True)
    city = Column(String(128), nullable=True)
    state = Column(String(128), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    industry = Column(String(256), nullable=True)
    naics = Column(String(64), nullable=True)

    activity = Column(String(256), nullable=True, index=True)
    task_assigned = Column(String(256), nullable=True)
    event_type = Column(String(256), nullable=True, index=True)

    hazard = Column(String(256), nullable=True, index=True)
    hazardous_substance = Column(String(256), nullable=True)
    exposure = Column(String(256), nullable=True)
    energy_source = Column(String(256), nullable=True)
    equipment = Column(String(256), nullable=True)

    human_factor = Column(String(256), nullable=True)
    environmental_factor = Column(String(256), nullable=True)

    barrier = Column(String(256), nullable=True)
    barrier_failure = Column(String(256), nullable=True, index=True)

    actual_severity = Column(String(128), nullable=True)
    immediate_consequence = Column(Text, nullable=True)
    potential_consequence = Column(Text, nullable=True)
    affected_body_part = Column(String(256), nullable=True)

    fatal_cause = Column(String(256), nullable=True)
    fall_height = Column(Float, nullable=True)

    project_type = Column(String(128), nullable=True)
    construction_end_use = Column(String(128), nullable=True)
    building_stories = Column(Integer, nullable=True)
    project_cost = Column(String(128), nullable=True)

    # NLP Derived Fields
    life_saving_rules = Column(JSON, nullable=True)
    sif_potential = Column(String(32), nullable=True, index=True) # SIF_POTENTIAL, NON_SIF, UNCERTAIN
    sif_score = Column(Float, nullable=True)
    sif_confidence = Column(Float, nullable=True)

    # Vector embedding (JSON array for SQLite/generic, pgvector handling in queries)
    embedding = Column(JSON, nullable=True)
    raw_data = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    analysis = relationship("ReportAnalysis", back_populates="report", uselist=False, cascade="all, delete-orphan")
    reviews = relationship("SIFLabel", back_populates="report", cascade="all, delete-orphan")
