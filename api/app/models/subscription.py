from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    tier = Column(String, nullable=False)  # "free", "premium-monthly", "premium-annual"
    status = Column(String, nullable=False)  # "active", "canceled", "past_due"
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    cancel_at_period_end = Column(Boolean, default=False)
    price_id = Column(String)  # Stripe price ID
    customer_id = Column(String)  # Stripe customer ID
    stripe_subscription_id = Column(String)
    stripe_subscription_item_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="subscription")
