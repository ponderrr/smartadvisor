from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserPreferencesBase(BaseModel):
    accessibility_require_subtitles: bool = False
    accessibility_require_audio_description: bool = False
    accessibility_require_closed_captions: bool = False
    content_filters_exclude_violent_content: bool = False
    content_filters_exclude_sexual_content: bool = False
    language: str = "en"


class UserPreferencesCreate(UserPreferencesBase):
    pass


class UserPreferencesUpdate(BaseModel):
    accessibility_require_subtitles: Optional[bool] = None
    accessibility_require_audio_description: Optional[bool] = None
    accessibility_require_closed_captions: Optional[bool] = None
    content_filters_exclude_violent_content: Optional[bool] = None
    content_filters_exclude_sexual_content: Optional[bool] = None
    language: Optional[str] = None


class UserPreferencesResponse(UserPreferencesBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
