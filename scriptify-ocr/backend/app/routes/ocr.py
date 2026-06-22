"""OCR extraction routes. Supports both authenticated users and guests."""
import io
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from sqlalchemy.orm import Session

from app.core.auth import get_optional_user
from app.core.config import settings
from app.database.models import User
from app.database.session import get_db
from app.schemas.ocr import OCRExtractResponse
from app.services.paddleocr_service import ocr_service
from app.services.history_service import history_service

router = APIRouter(prefix="/ocr", tags=["OCR"])


def _validate_upload(file: UploadFile, content: bytes) -> None:
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    if len(content) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds the maximum allowed size of {settings.MAX_FILE_SIZE_MB} MB.",
        )

    extension = Path(file.filename or "").suffix.lower()
    if extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{extension}'. Allowed types: "
            f"{', '.join(sorted(settings.ALLOWED_EXTENSIONS))}.",
        )

    if file.content_type not in settings.ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported content type '{file.content_type}'.",
        )


@router.post("/extract", response_model=OCRExtractResponse)
async def extract_text(
    file: UploadFile,
    current_user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    content = await file.read()
    _validate_upload(file, content)

    try:
        image = Image.open(io.BytesIO(content))
        image.load()
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file could not be read as a valid image.",
        )

    if not ocr_service.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OCR engine is still initializing. Please try again shortly.",
        )

    try:
        clean_text, character_count, processing_time = ocr_service.extract_text(image)
    except Exception as exc:  # pragma: no cover - defensive guard around OCR engine
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR processing failed: {exc}",
        )

    # Only persist history for authenticated users; guests are skipped.
    saved_id = None
    if current_user is not None:
        entry = history_service.create_entry(
            db=db,
            user_id=current_user.id,
            file_name=file.filename or "untitled",
            extracted_text=clean_text,
            character_count=character_count,
            processing_time=processing_time,
        )
        saved_id = entry.id

    return OCRExtractResponse(
        success=True,
        text=clean_text,
        character_count=character_count,
        processing_time=processing_time,
        id=saved_id,
    )
