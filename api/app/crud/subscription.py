from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate


class CRUDSubscription(CRUDBase[Subscription, SubscriptionCreate, SubscriptionUpdate]):
    async def get_by_user_id(
        self, db: AsyncSession, *, user_id: str
    ) -> Optional[Subscription]:
        """Get subscription by user ID."""
        result = await db.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_stripe_subscription_id(
        self, db: AsyncSession, *, stripe_subscription_id: str
    ) -> Optional[Subscription]:
        """Get subscription by Stripe subscription ID."""
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_subscription_id
            )
        )
        return result.scalar_one_or_none()


subscription_crud = CRUDSubscription(Subscription)
