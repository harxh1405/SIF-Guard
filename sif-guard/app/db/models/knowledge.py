import datetime
from sqlalchemy import Column, String, Text, JSON, Float, DateTime
from app.db.database import Base


class HSEKnowledge(Base):
    __tablename__ = "hse_knowledge"

    id = Column(String(64), primary_key=True, index=True)
    source = Column(String(64), index=True, nullable=False) # smartqhse, glossary, etc.
    title = Column(String(256), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(128), index=True, nullable=True)
    keywords = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    embedding = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class CatastrophicMechanism(Base):
    __tablename__ = "catastrophic_mechanisms"

    id = Column(String(64), primary_key=True, index=True)
    source = Column(String(64), index=True, nullable=False) # CSB, OSHA, Process Safety
    title = Column(String(256), nullable=False)
    activity = Column(String(256), nullable=True)
    hazard = Column(String(256), nullable=True)
    exposure = Column(String(256), nullable=True)
    barrier = Column(String(256), nullable=True)
    barrier_failure = Column(String(256), nullable=True)
    consequence = Column(Text, nullable=True)
    embedding = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
