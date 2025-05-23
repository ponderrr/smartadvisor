from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.crud.subscription import subscription_crud
from app.crud.user import user_crud
from app.models.user import User
from app.services.stripe_service import stripe_service
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionUpdate,
    SubscriptionTier,
    SubscriptionStatus,
)
import json

router = APIRouter()


@router.get("/plans")
async def get_subscription_plans():
    """Get available subscription plans."""
    return {
        "plans": [
            {
                "id": "free",
                "name": "Free",
                "price": 0,
                "currency": "USD",
                "interval": "month",
                "features": [
                    "Up to 5 questions per recommendation",
                    "Basic movie and book recommendations",
                    "Limited recommendation history",
                ],
            },
            {
                "id": "premium-monthly",
                "name": "Premium Monthly",
                "price": 4.99,
                "currency": "USD",
                "interval": "month",
                "stripe_price_id": "price_premium_monthly",  # Replace with actual Stripe price ID
                "features": [
                    "Up to 15 questions per recommendation",
                    "Enhanced AI recommendations",
                    "Unlimited recommendation history",
                    "Priority support",
                    "Early access to new features",
                ],
            },
            {
                "id": "premium-annual",
                "name": "Premium Annual",
                "price": 39.99,
                "currency": "USD",
                "interval": "year",
                "stripe_price_id": "price_premium_annual",  # Replace with actual Stripe price ID
                "features": [
                    "All Premium Monthly features",
                    "Over 30% savings",
                    "Exclusive content recommendations",
                ],
            },
        ]
    }


@router.get("/status", response_model=SubscriptionResponse)
async def get_subscription_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current subscription status."""
    subscription = await subscription_crud.get_by_user_id(db, user_id=current_user.id)

    if not subscription:
        # Create default free subscription
        from app.models.subscription import Subscription

        subscription = Subscription(
            user_id=current_user.id,
            tier=SubscriptionTier.FREE,
            status=SubscriptionStatus.ACTIVE,
        )
        db.add(subscription)
        await db.commit()
        await db.refresh(subscription)

    return subscription


@router.post("/create")
async def create_subscription(
    subscription_data: SubscriptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new subscription."""

    # Check if user already has an active subscription
    existing_subscription = await subscription_crud.get_by_user_id(
        db, user_id=current_user.id
    )

    if (
        existing_subscription
        and existing_subscription.status == SubscriptionStatus.ACTIVE
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has an active subscription",
        )

    # Create Stripe customer if not exists
    if not current_user.stripe_customer_id:
        customer_id = await stripe_service.create_customer(
            email=current_user.email, name=current_user.username
        )

        if not customer_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create payment profile",
            )

        # Update user with Stripe customer ID
        await user_crud.update(
            db, db_obj=current_user, obj_in={"stripe_customer_id": customer_id}
        )
        current_user.stripe_customer_id = customer_id

    # Create Stripe subscription
    stripe_subscription = await stripe_service.create_subscription(
        customer_id=current_user.stripe_customer_id, price_id=subscription_data.price_id
    )

    if not stripe_subscription:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subscription",
        )

    return {
        "client_secret": stripe_subscription["client_secret"],
        "subscription_id": stripe_subscription["subscription_id"],
    }


@router.put("/cancel")
async def cancel_subscription(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Cancel current subscription."""
    subscription = await subscription_crud.get_by_user_id(db, user_id=current_user.id)

    if not subscription or subscription.tier == SubscriptionTier.FREE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription to cancel",
        )

    if subscription.stripe_subscription_id:
        success = await stripe_service.cancel_subscription(
            subscription.stripe_subscription_id
        )

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel subscription",
            )

    # Update subscription
    await subscription_crud.update(
        db, db_obj=subscription, obj_in={"cancel_at_period_end": True}
    )

    return {"message": "Subscription will be canceled at the end of the billing period"}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhooks."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    event = stripe_service.construct_webhook_event(payload, sig_header)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook"
        )

    # Handle different event types
    if event["type"] == "customer.subscription.updated":
        subscription_obj = event["data"]["object"]
        await _handle_subscription_updated(db, subscription_obj)

    elif event["type"] == "customer.subscription.deleted":
        subscription_obj = event["data"]["object"]
        await _handle_subscription_deleted(db, subscription_obj)

    elif event["type"] == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        await _handle_payment_succeeded(db, invoice)

    return {"status": "success"}


async def _handle_subscription_updated(db: AsyncSession, stripe_subscription: dict):
    """Handle subscription update webhook."""
    subscription = await subscription_crud.get_by_stripe_subscription_id(
        db, stripe_subscription_id=stripe_subscription["id"]
    )

    if subscription:
        await subscription_crud.update(
            db,
            db_obj=subscription,
            obj_in={
                "status": stripe_subscription["status"],
                "current_period_start": stripe_subscription["current_period_start"],
                "current_period_end": stripe_subscription["current_period_end"],
                "cancel_at_period_end": stripe_subscription["cancel_at_period_end"],
            },
        )


async def _handle_subscription_deleted(db: AsyncSession, stripe_subscription: dict):
    """Handle subscription deletion webhook."""
    subscription = await subscription_crud.get_by_stripe_subscription_id(
        db, stripe_subscription_id=stripe_subscription["id"]
    )

    if subscription:
        await subscription_crud.update(
            db,
            db_obj=subscription,
            obj_in={
                "status": SubscriptionStatus.CANCELED,
                "tier": SubscriptionTier.FREE,
            },
        )


async def _handle_payment_succeeded(db: AsyncSession, invoice: dict):
    """Handle successful payment webhook."""
    # Update subscription status if needed
    if invoice.get("subscription"):
        subscription = await subscription_crud.get_by_stripe_subscription_id(
            db, stripe_subscription_id=invoice["subscription"]
        )

        if subscription and subscription.status != SubscriptionStatus.ACTIVE:
            await subscription_crud.update(
                db, db_obj=subscription, obj_in={"status": SubscriptionStatus.ACTIVE}
            )
