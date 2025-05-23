from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.crud.preferences import preferences_crud
from app.models.user import User
from app.schemas.preferences import UserPreferencesResponse, UserPreferencesUpdate

router = APIRouter()


@router.get("/", response_model=UserPreferencesResponse)
async def get_user_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get user preferences."""
    preferences = await preferences_crud.get_by_user_id(db, user_id=current_user.id)

    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preferences not found"
        )

    return preferences


@router.put("/", response_model=UserPreferencesResponse)
async def update_user_preferences(
    preferences_update: UserPreferencesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update user preferences."""
    preferences = await preferences_crud.get_by_user_id(db, user_id=current_user.id)

    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Preferences not found"
        )

    updated_preferences = await preferences_crud.update(
        db, db_obj=preferences, obj_in=preferences_update
    )
    return updated_preferences
