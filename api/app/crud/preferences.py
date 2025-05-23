from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.models.preferences import UserPreferences
from app.schemas.preferences import UserPreferencesCreate, UserPreferencesUpdate


class CRUDUserPreferences(
    CRUDBase[UserPreferences, UserPreferencesCreate, UserPreferencesUpdate]
):
    async def get_by_user_id(
        self, db: AsyncSession, *, user_id: str
    ) -> Optional[UserPreferences]:
        """Get user preferences by user ID."""
        result = await db.execute(
            select(UserPreferences).where(UserPreferences.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_for_user(
        self, db: AsyncSession, *, user_id: str, obj_in: UserPreferencesCreate
    ) -> UserPreferences:
        """Create preferences for a specific user."""
        create_data = obj_in.dict()
        create_data["user_id"] = user_id
        db_obj = UserPreferences(**create_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj


preferences_crud = CRUDUserPreferences(UserPreferences)
