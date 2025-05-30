# api/app/models/saved_item.py
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class SavedItem(Base):
    __tablename__ = "saved_items"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    item_id = Column(String, nullable=False, index=True)  # Movie/Book ID
    item_type = Column(String, nullable=False, index=True)  # "movie" or "book"
    item_title = Column(String, nullable=False)
    item_data = Column(Text, nullable=False)  # JSON string of full item data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="saved_items")

    def __repr__(self):
        return f"<SavedItem(id={self.id}, user_id={self.user_id}, item_type={self.item_type}, item_title={self.item_title})>"
