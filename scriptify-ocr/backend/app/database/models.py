"""SQLAlchemy ORM models."""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    extractions = relationship(
        "OCRExtraction", back_populates="user", cascade="all, delete-orphan"
    )


class OCRExtraction(Base):
    __tablename__ = "ocr_extractions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(512), nullable=False)
    extracted_text = Column(Text, nullable=False)
    character_count = Column(Integer, nullable=False, default=0)
    processing_time = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="extractions")
