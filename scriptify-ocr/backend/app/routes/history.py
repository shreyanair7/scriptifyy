"""History routes. All routes here require authentication (no guest access)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.database.models import User
from app.database.session import get_db
from app.schemas.ocr import HistoryDetailOut, HistoryItemOut, MessageResponse
from app.services.history_service import history_service

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=list[HistoryItemOut])
def list_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return history_service.list_for_user(db, current_user.id)


@router.get("/{extraction_id}", response_model=HistoryDetailOut)
def get_history_item(
    extraction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = history_service.get_for_user(db, current_user.id, extraction_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extraction not found.")
    return entry


@router.delete("/{extraction_id}", response_model=MessageResponse)
def delete_history_item(
    extraction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = history_service.delete_for_user(db, current_user.id, extraction_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extraction not found.")
    return MessageResponse(message="Extraction deleted successfully")
