from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_token
from app.crud.user import user_crud
from app.models.user import User

security = HTTPBearer()


class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """Get current authenticated user."""
    token = credentials.credentials
    user_id = verify_token(token, "access")

    if user_id is None:
        raise AuthenticationError("Invalid authentication credentials")

    user = await user_crud.get(db, id=user_id)
    if user is None:
        raise AuthenticationError("User not found")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


async def get_current_user_optional(
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[User]:
    """Get current user if authenticated, otherwise None."""
    if credentials is None:
        return None

    try:
        token = credentials.credentials
        user_id = verify_token(token, "access")

        if user_id is None:
            return None

        user = await user_crud.get(db, id=user_id)
        if user is None or not user.is_active:
            return None

        return user
    except Exception:
        return None
