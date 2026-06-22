"""Profile routes: view profile, update profile, change password."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.security import hash_password, verify_password
from app.database.models import User
from app.database.session import get_db
from app.schemas.profile import (
    MessageResponse,
    PasswordChangeRequest,
    ProfileOut,
    ProfileUpdateRequest,
)

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=ProfileOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("", response_model=ProfileOut)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.email is not None and payload.email.lower() != current_user.email:
        existing = db.query(User).filter(User.email == payload.email.lower()).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists.",
            )
        current_user.email = payload.email.lower()

    if payload.name is not None:
        current_user.name = payload.name.strip()

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password", response_model=MessageResponse)
def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()

    return MessageResponse(message="Password updated successfully")
