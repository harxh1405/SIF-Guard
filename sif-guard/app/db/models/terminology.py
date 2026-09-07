import datetime
from sqlalchemy import Column, String, Text, DateTime
from app.db.database import Base


class Terminology(Base):
    __tablename__ = "terminology"

    id = Column(String(64), primary_key=True, index=True)
    term = Column(String(128), unique=True, index=True, nullable=False)
    expansion = Column(String(256), nullable=False)
    category = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
