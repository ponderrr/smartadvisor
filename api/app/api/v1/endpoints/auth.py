from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.auth_service import auth_service
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    TokenRefresh,
    PasswordReset,
    PasswordResetConfirm,
)
from app.schemas.user import UserResponse

router = APIRouter()


@router.post("/register")
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user and return tokens."""
    try:
        result = await auth_service.register_user(db, user_data)

        return {
            "user": UserResponse.model_validate(result["user"]),
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": result["token_type"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user and return tokens."""
    try:
        result = await auth_service.authenticate_user(
            db, email=user_credentials.email, password=user_credentials.password
        )

        return Token(
            access_token=result["access_token"],
            refresh_token=result["refresh_token"],
            token_type=result["token_type"],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login failed"
        )


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token."""
    try:
        return await auth_service.refresh_access_token(db, token_data.refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed",
        )


@router.post("/forgot-password")
async def forgot_password(
    password_reset: PasswordReset, db: AsyncSession = Depends(get_db)
):
    """Initiate password reset process."""
    try:
        await auth_service.initiate_password_reset(db, password_reset.email)
        return {"message": "If the email exists, a password reset link has been sent"}
    except Exception as e:
        # Always return success for security (don't reveal if email exists)
        return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)
):
    """Reset password using reset token."""
    try:
        await auth_service.confirm_password_reset(
            db, reset_data.token, reset_data.new_password
        )
        return {"message": "Password reset successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Password reset failed"
        )


@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)."""
    return {"message": "Successfully logged out"}
