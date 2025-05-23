import stripe
from typing import Dict, Any, Optional
from app.core.config import settings
from app.models.subscription import Subscription
import logging

logger = logging.getLogger(__name__)


class StripeService:
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    async def create_customer(
        self, email: str, name: Optional[str] = None
    ) -> Optional[str]:
        """Create a Stripe customer."""
        try:
            customer = stripe.Customer.create(email=email, name=name)
            return customer.id
        except Exception as e:
            logger.error(f"Error creating Stripe customer: {e}")
            return None

    async def create_subscription(
        self, customer_id: str, price_id: str
    ) -> Optional[Dict[str, Any]]:
        """Create a Stripe subscription."""
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                payment_settings={"save_default_payment_method": "on_subscription"},
                expand=["latest_invoice.payment_intent"],
            )
            return {
                "subscription_id": subscription.id,
                "client_secret": subscription.latest_invoice.payment_intent.client_secret,
                "status": subscription.status,
            }
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            return None

    async def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel a Stripe subscription."""
        try:
            stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)
            return True
        except Exception as e:
            logger.error(f"Error canceling subscription: {e}")
            return False

    async def get_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription details from Stripe."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                "id": subscription.id,
                "status": subscription.status,
                "current_period_start": subscription.current_period_start,
                "current_period_end": subscription.current_period_end,
                "cancel_at_period_end": subscription.cancel_at_period_end,
            }
        except Exception as e:
            logger.error(f"Error retrieving subscription: {e}")
            return None

    def construct_webhook_event(self, payload: bytes, sig_header: str):
        """Construct and verify webhook event."""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            return event
        except ValueError:
            logger.error("Invalid payload")
            return None
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature")
            return None


stripe_service = StripeService()
