from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    # Accessibility preferences
    accessibility_require_subtitles = Column(Boolean, default=False)
    accessibility_require_audio_description = Column(Boolean, default=False)
    accessibility_require_closed_captions = Column(Boolean, default=False)

    # Content filters
    content_filters_exclude_violent_content = Column(Boolean, default=False)
    content_filters_exclude_sexual_content = Column(Boolean, default=False)

    # Language preference
    language = Column(String, default="en")  # ISO language code

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="preferences")
