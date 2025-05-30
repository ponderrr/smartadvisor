from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.crud.user import user_crud
from app.crud.preferences import preferences_crud
from app.crud.subscription import subscription_crud
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.user import UserCreate
from app.schemas.preferences import UserPreferencesCreate
from app.schemas.subscription import SubscriptionTier, SubscriptionStatus
from app.schemas.auth import Token
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Service class for authentication operations."""

    async def register_user(
        self, db: AsyncSession, user_data: UserCreate
    ) -> Dict[str, Any]:
        """
        Register a new user with default preferences and subscription.

        Args:
            db: Database session
            user_data: User registration data

        Returns:
            Dictionary containing user data and tokens

        Raises:
            HTTPException: If email already exists or registration fails
        """

        existing_user = await user_crud.get_by_email(db, email=user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        try:
            user = await user_crud.create(db, obj_in=user_data)

            default_preferences = UserPreferencesCreate()
            await preferences_crud.create_for_user(
                db, user_id=user.id, obj_in=default_preferences
            )

            default_subscription = Subscription(
                user_id=user.id,
                tier=SubscriptionTier.FREE,
                status=SubscriptionStatus.ACTIVE,
                cancel_at_period_end=False,
            )
            db.add(default_subscription)
            await db.commit()
            await db.refresh(default_subscription)

            access_token = create_access_token(subject=user.id)
            refresh_token = create_refresh_token(subject=user.id)

            logger.info(f"User registered successfully: {user.email}")

            return {
                "user": user,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
            }

        except Exception as e:
            logger.error(f"Registration failed for {user_data.email}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Registration failed",
            )

    async def authenticate_user(
        self, db: AsyncSession, email: str, password: str
    ) -> Dict[str, Any]:
        """
        Authenticate user and return tokens.

        Args:
            db: Database session
            email: User email
            password: User password

        Returns:
            Dictionary containing user data and tokens

        Raises:
            HTTPException: If authentication fails
        """
        user = await user_crud.authenticate(db, email=email, password=password)

        if not user:
            logger.warning(f"Failed login attempt for email: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
            )

        subscription = await subscription_crud.get_by_user_id(db, user_id=user.id)
        if not subscription:
            default_subscription = Subscription(
                user_id=user.id,
                tier=SubscriptionTier.FREE,
                status=SubscriptionStatus.ACTIVE,
                cancel_at_period_end=False,
            )
            db.add(default_subscription)
            await db.commit()

        access_token = create_access_token(subject=user.id)
        refresh_token = create_refresh_token(subject=user.id)

        logger.info(f"User authenticated successfully: {user.email}")

        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    async def refresh_access_token(self, db: AsyncSession, refresh_token: str) -> Token:
        """
        Refresh access token using refresh token.

        Args:
            db: Database session
            refresh_token: Valid refresh token

        Returns:
            New token pair

        Raises:
            HTTPException: If refresh token is invalid
        """
        user_id = verify_token(refresh_token, "refresh")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = await user_crud.get(db, id=user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user"
            )

        new_access_token = create_access_token(subject=user.id)
        new_refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
        )

    async def verify_user_token(self, db: AsyncSession, token: str) -> Optional[User]:
        """
        Verify access token and return user.

        Args:
            db: Database session
            token: JWT access token

        Returns:
            User object if token is valid, None otherwise
        """
        user_id = verify_token(token, "access")

        if user_id is None:
            return None

        user = await user_crud.get(db, id=user_id)
        if not user or not user.is_active:
            return None

        return user

    async def change_password(
        self, db: AsyncSession, user: User, current_password: str, new_password: str
    ) -> bool:
        """
        Change user password.

        Args:
            db: Database session
            user: User object
            current_password: Current password
            new_password: New password

        Returns:
            True if password changed successfully

        Raises:
            HTTPException: If current password is incorrect
        """
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password",
            )

        await user_crud.update_password(db, user=user, new_password=new_password)
        logger.info(f"Password changed for user: {user.email}")
        return True

    async def initiate_password_reset(self, db: AsyncSession, email: str) -> bool:
        """
        Initiate password reset process.

        Args:
            db: Database session
            email: User email

        Returns:
            True if reset initiated (always returns True for security)
        """
        user = await user_crud.get_by_email(db, email=email)

        if user:
            # Generate password reset token
            reset_token = create_access_token(
                subject=user.id, expires_delta=timedelta(hours=1)
            )

            logger.info(f"Password reset requested for: {email}")
            logger.info(f"Reset token: {reset_token}")

        return True

    async def confirm_password_reset(
        self, db: AsyncSession, token: str, new_password: str
    ) -> bool:
        """
        Confirm password reset with token.

        Args:
            db: Database session
            token: Password reset token
            new_password: New password

        Returns:
            True if password reset successfully

        Raises:
            HTTPException: If token is invalid or expired
        """
        user_id = verify_token(token, "access")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        user = await user_crud.get(db, id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token",
            )

        await user_crud.update_password(db, user=user, new_password=new_password)
        logger.info(f"Password reset completed for user: {user.email}")
        return True

    async def deactivate_user(self, db: AsyncSession, user: User) -> bool:
        """
        Deactivate user account.

        Args:
            db: Database session
            user: User to deactivate

        Returns:
            True if user deactivated successfully
        """
        await user_crud.update(db, db_obj=user, obj_in={"is_active": False})
        logger.info(f"User deactivated: {user.email}")
        return True

    async def reactivate_user(self, db: AsyncSession, email: str) -> bool:
        """
        Reactivate user account.

        Args:
            db: Database session
            email: User email to reactivate

        Returns:
            True if user reactivated successfully

        Raises:
            HTTPException: If user not found
        """
        user = await user_crud.get_by_email(db, email=email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        await user_crud.update(db, db_obj=user, obj_in={"is_active": True})
        logger.info(f"User reactivated: {user.email}")
        return True


auth_service = AuthService()
