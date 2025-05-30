# api/app/api/v1/endpoints/users.py - Add saved items endpoints

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.crud.user import user_crud
from app.models.user import User
from app.models.saved_item import SavedItem
from app.schemas.user import UserResponse, UserUpdate
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()


# Pydantic models for saved items
class SaveItemRequest(BaseModel):
    item_id: str
    item_type: str  # "movie" or "book"
    item_title: str
    item_data: dict  # Full movie/book data


class SavedItemResponse(BaseModel):
    id: str
    user_id: str
    item_id: str
    item_type: str
    item_title: str
    item_data: dict
    created_at: str

    class Config:
        from_attributes = True


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update current user information."""
    updated_user = await user_crud.update(db, db_obj=current_user, obj_in=user_update)
    return updated_user


@router.delete("/me")
async def delete_current_user(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete current user account."""
    await user_crud.remove(db, id=current_user.id)
    return {"message": "Account deleted successfully"}


# SAVED ITEMS ENDPOINTS
@router.post("/saved-items", response_model=SavedItemResponse)
async def save_item(
    request: SaveItemRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Save an item to user's saved list"""
    from sqlalchemy import select

    # Check if item is already saved
    result = await db.execute(
        select(SavedItem).where(
            and_(
                SavedItem.user_id == current_user.id,
                SavedItem.item_id == request.item_id,
                SavedItem.item_type == request.item_type,
            )
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Item is already saved")

    # Create new saved item
    saved_item = SavedItem(
        user_id=current_user.id,
        item_id=request.item_id,
        item_type=request.item_type,
        item_title=request.item_title,
        item_data=json.dumps(request.item_data),
    )

    db.add(saved_item)
    await db.commit()
    await db.refresh(saved_item)

    # Convert back for response
    response_item = SavedItemResponse(
        id=saved_item.id,
        user_id=saved_item.user_id,
        item_id=saved_item.item_id,
        item_type=saved_item.item_type,
        item_title=saved_item.item_title,
        item_data=json.loads(saved_item.item_data),
        created_at=saved_item.created_at.isoformat(),
    )

    return response_item


@router.delete("/saved-items/{item_id}")
async def unsave_item(
    item_id: str,
    item_type: str = Query(..., description="Type of item: movie or book"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Remove an item from user's saved list"""
    from sqlalchemy import select

    result = await db.execute(
        select(SavedItem).where(
            and_(
                SavedItem.user_id == current_user.id,
                SavedItem.item_id == item_id,
                SavedItem.item_type == item_type,
            )
        )
    )
    saved_item = result.scalar_one_or_none()

    if not saved_item:
        raise HTTPException(status_code=404, detail="Saved item not found")

    await db.delete(saved_item)
    await db.commit()

    return {"message": "Item removed from saved list"}


@router.get("/saved-items")
async def get_saved_items(
    item_type: Optional[str] = Query(
        None, description="Filter by item type: movie or book"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get user's saved items"""
    from sqlalchemy import select

    query = select(SavedItem).where(SavedItem.user_id == current_user.id)

    if item_type:
        query = query.where(SavedItem.item_type == item_type)

    query = query.order_by(SavedItem.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    saved_items = result.scalars().all()

    # Count total
    count_query = select(func.count(SavedItem.id)).where(
        SavedItem.user_id == current_user.id
    )
    if item_type:
        count_query = count_query.where(SavedItem.item_type == item_type)

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Convert to response format
    items = []
    for item in saved_items:
        items.append(
            SavedItemResponse(
                id=item.id,
                user_id=item.user_id,
                item_id=item.item_id,
                item_type=item.item_type,
                item_title=item.item_title,
                item_data=json.loads(item.item_data),
                created_at=item.created_at.isoformat(),
            )
        )

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/saved-items/{item_id}/check")
async def check_item_saved(
    item_id: str,
    item_type: str = Query(..., description="Type of item: movie or book"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Check if an item is saved by the user"""
    from sqlalchemy import select

    result = await db.execute(
        select(SavedItem).where(
            and_(
                SavedItem.user_id == current_user.id,
                SavedItem.item_id == item_id,
                SavedItem.item_type == item_type,
            )
        )
    )
    saved_item = result.scalar_one_or_none()

    return {"is_saved": saved_item is not None}
