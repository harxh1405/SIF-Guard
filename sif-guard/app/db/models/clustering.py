import datetime
from sqlalchemy import Column, String, Integer, Float, JSON, DateTime
from app.db.database import Base


class PrecursorCluster(Base):
    __tablename__ = "precursor_clusters"

    id = Column(String(64), primary_key=True, index=True)
    cluster_id = Column(Integer, index=True, nullable=False)
    name = Column(String(256), nullable=False)
    description = Column(String(512), nullable=True)

    report_count = Column(Integer, default=0)
    sif_precursor_count = Column(Integer, default=0)
    sif_density = Column(Float, default=0.0)

    dominant_activity = Column(String(256), nullable=True)
    dominant_hazard = Column(String(256), nullable=True)
    dominant_barrier = Column(String(256), nullable=True)
    dominant_barrier_failure = Column(String(256), nullable=True)
    dominant_lsr = Column(String(256), nullable=True)

    representative_report_ids = Column(JSON, nullable=True) # List[str]

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
