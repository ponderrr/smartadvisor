from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class SubscriptionTier(str, Enum):
    FREE = "free"
    PREMIUM_MONTHLY = "premium-monthly"
    PREMIUM_ANNUAL = "premium-annual"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"


class SubscriptionBase(BaseModel):
    tier: SubscriptionTier
    status: SubscriptionStatus


class SubscriptionCreate(BaseModel):
    tier: SubscriptionTier
    price_id: str  # Stripe price ID


class SubscriptionUpdate(BaseModel):
    cancel_at_period_end: Optional[bool] = None


class SubscriptionResponse(SubscriptionBase):
    id: str
    user_id: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
