"""Pydantic schemas for authentication endpoints."""
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.security import validate_password_strength


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def check_password_strength(cls, v: str) -> str:
        if not validate_password_strength(v):
            raise ValueError(
                "Password must be at least 8 characters long and include an "
                "uppercase letter, a lowercase letter, a number, and a special character."
            )
        return v


class RegisterResponse(BaseModel):
    message: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
