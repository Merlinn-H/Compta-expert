from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = None
    preferred_language: str = "fr"
    default_currency: str = "CAD"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_language: Optional[str] = None
    default_currency: Optional[str] = None
    fiscal_year_start: Optional[int] = None


class UserRead(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    preferred_language: str
    default_currency: str
    fiscal_year_start: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
