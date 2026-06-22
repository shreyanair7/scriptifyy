"""Pydantic schemas for the profile endpoints."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.security import validate_password_strength


class ProfileOut(BaseModel):
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        if not validate_password_strength(v):
            raise ValueError(
                "Password must be at least 8 characters long and include an "
                "uppercase letter, a lowercase letter, a number, and a special character."
            )
        return v


class MessageResponse(BaseModel):
    message: str
