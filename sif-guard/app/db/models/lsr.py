import datetime
from sqlalchemy import Column, String, Text, JSON, DateTime
from app.db.database import Base


class LifeSavingRule(Base):
    __tablename__ = "life_saving_rules"

    id = Column(String(64), primary_key=True, index=True)
    rule_code = Column(String(64), unique=True, index=True, nullable=False)
    rule_name = Column(String(128), index=True, nullable=False)
    description = Column(Text, nullable=False)
    keywords = Column(JSON, nullable=False) # List[str]
    icon = Column(String(128), nullable=True)
    embedding = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
