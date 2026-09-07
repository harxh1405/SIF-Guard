import datetime
from sqlalchemy import Column, String, Boolean, JSON, DateTime
from app.db.database import Base


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    id = Column(String(64), primary_key=True, index=True)
    model_name = Column(String(128), index=True, nullable=False)
    model_type = Column(String(64), nullable=False)
    version = Column(String(32), nullable=False)
    path = Column(String(256), nullable=False)
    metrics = Column(JSON, nullable=True)
    active = Column(Boolean, default=False, index=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
