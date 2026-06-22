"""Pydantic schemas for OCR extraction and history endpoints."""
from datetime import datetime

from pydantic import BaseModel


class OCRExtractResponse(BaseModel):
    success: bool
    text: str
    character_count: int
    processing_time: float
    id: int | None = None



class HistoryItemOut(BaseModel):
    id: int
    file_name: str
    character_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class HistoryDetailOut(BaseModel):
    id: int
    file_name: str
    extracted_text: str
    character_count: int
    processing_time: float
    created_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    message: str
