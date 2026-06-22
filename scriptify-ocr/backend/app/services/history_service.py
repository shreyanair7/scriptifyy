"""Service layer for OCR extraction history."""
from typing import Optional

from sqlalchemy.orm import Session

from app.database.models import OCRExtraction


class HistoryService:
    @staticmethod
    def create_entry(
        db: Session,
        user_id: int,
        file_name: str,
        extracted_text: str,
        character_count: int,
        processing_time: float,
    ) -> OCRExtraction:
        entry = OCRExtraction(
            user_id=user_id,
            file_name=file_name,
            extracted_text=extracted_text,
            character_count=character_count,
            processing_time=processing_time,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def list_for_user(db: Session, user_id: int) -> list[OCRExtraction]:
        return (
            db.query(OCRExtraction)
            .filter(OCRExtraction.user_id == user_id)
            .order_by(OCRExtraction.created_at.desc())
            .all()
        )

    @staticmethod
    def get_for_user(db: Session, user_id: int, extraction_id: int) -> Optional[OCRExtraction]:
        return (
            db.query(OCRExtraction)
            .filter(OCRExtraction.id == extraction_id, OCRExtraction.user_id == user_id)
            .first()
        )

    @staticmethod
    def delete_for_user(db: Session, user_id: int, extraction_id: int) -> bool:
        entry = HistoryService.get_for_user(db, user_id, extraction_id)
        if entry is None:
            return False
        db.delete(entry)
        db.commit()
        return True


history_service = HistoryService()
