from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    age: Optional[int] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    age: Optional[int] = None
    profile_picture_url: Optional[str] = None


class UserInDB(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    profile_picture_url: Optional[str] = None
    profile_picture_updated: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: str
    is_active: bool
    profile_picture_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
